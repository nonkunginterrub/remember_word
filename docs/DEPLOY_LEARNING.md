# เรียนรู้การ Deploy จากโปรเจกต์ Remember Word

เอกสารนี้อธิบายว่าตอน deploy เกิดอะไรขึ้นบ้าง ทำไมถึงพัง และแก้อย่างไร
อ่านตามลำดับ แล้วลองทำแบบฝึกหัดท้ายเอกสาร จะเข้าใจการ deploy ได้ด้วยตัวเอง

---

## 1. ภาพรวม: โค้ดเดินทางจากเครื่องเราไปถึงผู้ใช้อย่างไร

```
 [เครื่องเรา]                [GitHub]               [Vercel]                         [Neon]
  แก้โค้ด                     เก็บโค้ด                1) Build: npm run vercel-build     ฐานข้อมูล
  git commit   ── git push ──▶ repo     ── แจ้ง ──▶     - migrate (สร้างตาราง) ─────────▶ PostgreSQL
                                                       - next build                      ▲
                                                    2) Deploy: ได้ URL ใหม่              │
                                                    3) Runtime: ผู้ใช้เปิดเว็บ             │
                                                       หน้าเว็บ + API ทำงาน ── SQL ──────┘
```

จำ 3 ช่วงนี้ให้ดี เพราะปัญหาแต่ละแบบเกิดคนละช่วง

| ช่วง | เกิดอะไรขึ้น | ถ้าพังจะเห็นอะไร | ดู log ที่ไหน |
|---|---|---|---|
| **Build** | Vercel ดาวน์โหลดโค้ด ติดตั้งแพ็กเกจ แล้ว build | Deploy ขึ้นสถานะ **Error** เว็บเดิมยังใช้งานได้ | Build Logs |
| **Deploy** | นำผลจากการ build ขึ้นเซิร์ฟเวอร์ ได้ URL | ไม่ค่อยพัง | — |
| **Runtime** | ผู้ใช้เปิดเว็บ API ทำงานจริง และต่อฐานข้อมูล | Deploy เป็น **Ready** แต่หน้าเว็บหรือ API ตอบ error เช่น 500 | Runtime Logs |

> 💡 ปัญหาของเรารอบนี้เป็นแบบ **Runtime** คือ deploy ผ่าน (Ready) แต่ API ตอบ 500
> เพราะโค้ดถูกต้อง แต่**ค่าตั้งค่า (environment variables) และตารางในฐานข้อมูลยังไม่พร้อม**

---

## 2. แนวคิดสำคัญที่ต้องรู้

### 2.1 Environment Variables (ตัวแปรสภาพแวดล้อม)
ค่าที่เปลี่ยนตามที่ที่โค้ดไปรัน และค่าลับที่**ห้ามใส่ในโค้ด**เพราะโค้ดอยู่บน GitHub

| ตัวแปร | ใช้ทำอะไร | ถ้าไม่มี |
|---|---|---|
| `DATABASE_URL` | ที่อยู่ + รหัสผ่านฐานข้อมูล | ต่อฐานข้อมูลไม่ได้ → 500 |
| `JWT_SECRET` | กุญแจลับสำหรับเซ็น cookie ล็อกอิน | สร้าง session ไม่ได้ → ล็อกอินไม่ได้ |

ค่าเหล่านี้อยู่ใน 3 ที่ แยกกัน **ไม่ซิงก์กันเอง**:
- **เครื่องเรา:** ไฟล์ `.env.local` (ไม่ขึ้น GitHub เพราะอยู่ใน `.gitignore`)
- **Vercel:** Settings → Environment Variables แยกเป็น 3 environment: Production / Preview / Development
- **ไฟล์ตัวอย่าง:** `.env.example` บอกแค่ว่าต้องมีตัวแปรอะไรบ้าง ไม่มีค่าจริง จึงขึ้น GitHub ได้

> ⚠️ แก้ env บน Vercel แล้ว **ต้อง Redeploy** ค่าใหม่ถึงจะมีผล
> เพราะแต่ละ deployment ถูก "ถ่ายรูป" ค่าไว้ตอนสร้าง

**Sensitive (ค่าลับ):** Vercel ซ่อนค่าแบบนี้ไว้ แม้แต่เจ้าของก็ดูหรือดึงด้วย `vercel env pull` ไม่ได้ (จะได้ค่าว่าง)
เราเจอปัญหานี้กับ `DATABASE_URL` ที่ Neon ใส่ให้

### 2.2 Connection String ของ PostgreSQL
```
postgresql://ชื่อผู้ใช้:รหัสผ่าน@โฮสต์/ชื่อฐานข้อมูล?sslmode=require
```
มีรหัสผ่านอยู่ข้างใน จึงต้องเก็บเป็นความลับ ห้ามส่งในแชตหรือใส่ในโค้ด

### 2.3 Migration (การสร้าง/ปรับตาราง)
ฐานข้อมูลที่เพิ่งสร้างใหม่**ว่างเปล่า ยังไม่มีตาราง** ต้องรัน `db/schema.sql` ก่อน
- โปรเจกต์นี้ใช้ `CREATE TABLE IF NOT EXISTS` → รันซ้ำกี่ครั้งก็ได้ ไม่ลบข้อมูลเดิม (เรียกว่า *idempotent*)
- เราตั้ง script `vercel-build` ให้ Vercel รัน migrate ก่อน build ทุกครั้ง (ดู `package.json`)

### 2.4 Vercel: Account → Team (Scope) → Project → Deployment
```
บัญชี nonkunginterrub
 ├── Team "nonkunginterrub's projects"  ← โปรเจกต์จริงอยู่ที่นี่
 │     └── Project "remember-word"  → https://remember-word-seven.vercel.app
 │           ├── Deployment (commit 797144d)
 │           └── Deployment (commit 18e8e58)  ← Production ปัจจุบัน
 └── Team "My Team"
       └── Project "remember-word"  ← สร้างเกินมาโดยไม่ได้ตั้งใจ (ควรลบ)
```
- ชื่อโปรเจกต์ซ้ำกันได้ถ้าอยู่คนละ team → ต้องระบุ `--scope` ให้ถูก
- ทุกครั้งที่ push จะได้ **deployment ใหม่** พร้อม URL เฉพาะ แต่ URL หลัก (`...-seven.vercel.app`) จะชี้ไปที่ Production ล่าสุด

### 2.5 HTTP Status Code: ใช้วินิจฉัยปัญหา
| Code | ความหมาย | ในโปรเจกต์นี้ |
|---|---|---|
| 200 / 201 | สำเร็จ / สร้างสำเร็จ | ปกติ |
| 307 | Redirect | proxy พาไปหน้า `/login` เพราะยังไม่ล็อกอิน |
| 400 | ข้อมูลที่ส่งมาผิด | อีเมลผิดรูปแบบ (โค้ดตรวจเอง ไม่ต้องใช้ DB) |
| 401 | ยังไม่ล็อกอิน / รหัสผ่านผิด | ต้องใช้ DB ตรวจ |
| 409 | ข้อมูลซ้ำ | อีเมล/คำศัพท์ซ้ำ |
| 500 | เซิร์ฟเวอร์พัง | **ต้องไปดู Runtime Logs** |

---

## 3. ย้อนดูเหตุการณ์จริง: เกิดอะไร ทำไม แก้อย่างไร

### เหตุการณ์ 1: Deploy ผ่าน แต่ API ตอบ 500
**วิธีวินิจฉัย (เทคนิคแบ่งครึ่งปัญหา):**
1. เปิด `/register` → 200 ✅ แปลว่าหน้าเว็บ deploy สำเร็จ
2. ส่งอีเมลผิดรูปแบบไป API → 400 ✅ แปลว่า API ทำงาน (ขั้นนี้ยังไม่ใช้ DB)
3. ล็อกอินด้วยอีเมลที่ไม่มีอยู่จริง → **500** ❌ ควรได้ 401 → **ปัญหาอยู่ที่ส่วนที่ใช้ DB**

**สาเหตุจริง (ตรวจด้วย `vercel env ls`):**
- โปรเจกต์ยังไม่มี `JWT_SECRET`
- มี `DATABASE_URL` แล้ว (Neon เชื่อมให้) แต่**ยังไม่ได้สร้างตาราง** → query ตาราง `users` ไม่เจอ → 500

**บทเรียน:** "Deploy สำเร็จ" ≠ "แอปใช้งานได้" ต้องทดสอบส่วนที่ใช้ฐานข้อมูลทุกครั้ง

### เหตุการณ์ 2: `vercel link` เลือก team ผิด
- CLI ถามว่าจะใช้ team ไหน ผม (Claude) เลือก "My Team" ซึ่งผิด
- CLI จึง**สร้างโปรเจกต์ใหม่**ชื่อเดียวกันใน team นั้น และเชื่อม GitHub ให้ด้วย
- ตรวจพบเมื่อ `vercel integration list` แสดง team ชื่อ `nonkunginterrubs-projects` ไม่ตรงกับที่ link
- แก้โดย link ใหม่ด้วย `--scope nonkunginterrubs-projects`

**บทเรียน:** ก่อน link ให้ดู `vercel teams ls` และเปิดหน้า Vercel ดูว่าโปรเจกต์อยู่ team ไหน
ตรวจหลัง link ได้จาก `.vercel/project.json` (`orgId` = team)

### เหตุการณ์ 3: ดึง `DATABASE_URL` มาที่เครื่องไม่ได้
- `vercel env pull` ได้ `DATABASE_URL=` ว่าง เพราะเป็น Sensitive
- แทนที่จะรัน migrate ที่เครื่อง → ให้ Vercel รันเองตอน build (Vercel มีค่านี้อยู่แล้ว)
  ```json
  "vercel-build": "node db/migrate.mts && next build"
  ```
  Vercel จะเรียก `vercel-build` แทน `build` ถ้ามี script นี้ใน `package.json`

**บทเรียน:** งานที่ต้องใช้ค่าลับ ให้รันในที่ที่มีค่าลับอยู่แล้ว ไม่ต้องคัดลอกค่าลับไปมา

### เหตุการณ์ 4: CLI แก้ไฟล์ `.gitignore` ให้เอง
- `vercel link` ต่อท้าย `.env*` ทำให้กฎ `!.env.example` ที่อยู่ก่อนหน้าถูกยกเลิก
- กฎใน `.gitignore` **บรรทัดหลังชนะบรรทัดก่อน**

**บทเรียน:** หลังรันเครื่องมือใด ๆ ให้ดู `git status` / `git diff` ก่อน commit เสมอ

---

## 4. Checklist เมื่อ Deploy มีปัญหา

```
□ 1. Deploy สถานะอะไร?        vercel ls
      - Error  → ไปดู Build Logs:   vercel inspect <deployment-url> --logs
      - Ready  → ไปข้อ 2
□ 2. หน้าเว็บเปิดได้ไหม?        เปิด URL ในเบราว์เซอร์
□ 3. API ตอบ code อะไร?        ดูใน DevTools (F12) → แท็บ Network
□ 4. ถ้า 500 → ดู Runtime Logs:  vercel logs <deployment-url>
      หรือ Vercel → Project → Logs
□ 5. env ครบไหม?              vercel env ls  (ชื่อต้องตรงทุกตัวอักษร)
□ 6. แก้ env แล้ว Redeploy หรือยัง?
□ 7. ตารางในฐานข้อมูลมีไหม?    Neon Console → Tables
```

---

## 5. คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `vercel whoami` | ดูว่าล็อกอินเป็นใคร |
| `vercel teams ls` | ดู team ทั้งหมด |
| `vercel link --scope <team>` | เชื่อมโฟลเดอร์กับโปรเจกต์ |
| `vercel ls` | ดูรายการ deployment และสถานะ |
| `vercel inspect <url> --logs` | ดู build log |
| `vercel logs <url>` | ดู runtime log (error ตอนใช้งานจริง) |
| `vercel env ls` | ดูรายชื่อ env (ไม่แสดงค่า) |
| `vercel env add <ชื่อ> <environment>` | เพิ่ม env |
| `vercel env pull .env.local` | ดึง env มาไว้ที่เครื่อง (ยกเว้นค่า Sensitive) |
| `vercel rollback` | ย้อนกลับไป Production ก่อนหน้า (กรณี deploy ใหม่พัง) |

---

## 6. แบบฝึกหัด (ทำตามลำดับ)

1. **ดู deploy ปกติ:** แก้ข้อความในหน้า login (`components/AuthForm.tsx`) → commit → push
   → ดู `vercel ls` จนเป็น Ready → เปิดเว็บดูว่าข้อความเปลี่ยน
2. **อ่าน Build Log:** รัน `vercel inspect <url> --logs` หาบรรทัด `สร้างตารางเรียบร้อย`
   และบรรทัด `Compiled successfully`
3. **ใช้ Preview Deployment:** สร้าง branch ใหม่ `git checkout -b test-preview` แก้อะไรเล็กน้อย → push
   → Vercel สร้าง URL Preview แยก **ไม่กระทบเว็บจริง** → ลองเปิดดู
4. **ทำให้ build พังโดยตั้งใจ (บน branch test-preview เท่านั้น):** พิมพ์ผิดใน type เช่น `const x: number = 'a'`
   → push → ดูสถานะ Error และอ่าน log ว่าบอกอะไร → แก้กลับ
5. **ลอง Rollback:** ใน Vercel → Deployments → เลือก deployment เก่า → **Instant Rollback**
   แล้ว promote ตัวล่าสุดกลับ
6. **สร้าง Pull Request:** จาก branch test-preview → ดูว่า Vercel คอมเมนต์ลิงก์ Preview ใน PR

---

## 7. คำศัพท์

| คำ | ความหมาย |
|---|---|
| Deploy | นำโค้ดขึ้นเซิร์ฟเวอร์ให้คนอื่นใช้ได้ |
| Build | แปลงโค้ดที่เราเขียนให้เป็นไฟล์ที่พร้อมรัน |
| Runtime | ช่วงที่แอปทำงานจริงตอนผู้ใช้เข้าใช้ |
| Production | เว็บจริงที่ผู้ใช้ใช้ |
| Preview | เว็บทดลองของ branch / PR ที่ไม่ใช่ main |
| Environment Variable | ค่าตั้งค่า/ค่าลับที่อยู่นอกโค้ด |
| Migration | การสร้างหรือปรับโครงสร้างตารางในฐานข้อมูล |
| Serverless Function | โค้ดฝั่ง server ที่รันเฉพาะตอนมี request (API ของเรา) |
| Scope / Team | กลุ่มที่โปรเจกต์ใน Vercel สังกัดอยู่ |
| Rollback | ย้อนกลับไปใช้เวอร์ชันก่อนหน้า |
