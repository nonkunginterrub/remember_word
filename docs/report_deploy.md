# รายงานปัญหาการ Deploy — Remember Word

- **วันที่:** 13 ตุลาคม 2026
- **เว็บจริง:** https://remember-word-seven.vercel.app
- **GitHub:** https://github.com/nonkunginterrub/remember_word
- **Vercel:** team `nonkunginterrubs-projects` / project `remember-word`
- **ฐานข้อมูล:** Neon Postgres (`neon-blue-notebook`)
- **สถานะปัจจุบัน:** ✅ ใช้งานได้ ทดสอบ end-to-end ผ่านทั้งหมด (commit `18e8e58`)

> อยากเข้าใจแนวคิดเบื้องหลังแต่ละปัญหา อ่านต่อที่ [DEPLOY_LEARNING.md](DEPLOY_LEARNING.md)

---

## 1. สรุปสั้น

Build และ deploy ผ่าน (สถานะ **Ready**) แต่พอใช้งานจริง API ตอบ **500**
เพราะ `JWT_SECRET` ยังไม่ได้ตั้ง และฐานข้อมูลยังไม่มีตาราง
ระหว่างแก้ปัญหา Claude ใช้ `vercel link` เลือก team ผิด จึงเกิดโปรเจกต์ซ้ำขึ้นมาอีก 1 โปรเจกต์

**บทเรียนหลัก:** deploy ผ่าน ≠ แอปใช้งานได้ ต้องทดสอบส่วนที่ใช้ฐานข้อมูลทุกครั้ง

---

## 2. ลำดับเหตุการณ์

| ลำดับ | เหตุการณ์ | ผล |
|---|---|---|
| 1 | Push commit แรก (`797144d`) ขึ้น GitHub | ✅ |
| 2 | ผู้ใช้ import โปรเจกต์ใน Vercel และสร้าง Neon | ✅ deploy เป็น Ready |
| 3 | ทดสอบ `/register` | ✅ 200 |
| 4 | ทดสอบ API ด้วยอีเมลผิดรูปแบบ | ✅ 400 (ไม่ใช้ DB) |
| 5 | ทดสอบล็อกอินด้วยอีเมลที่ไม่มีจริง | ❌ **500** (ควรได้ 401) |
| 6 | ผู้ใช้หา connection string ของ Neon ไม่เจอ | ติดตั้ง Vercel CLI แทน |
| 7 | `vercel link` เลือก team "My Team" **ผิด** | ❌ เกิดโปรเจกต์ซ้ำ + เชื่อม GitHub |
| 8 | `vercel env pull` ได้ `DATABASE_URL` ว่าง | ตรวจแล้วพบว่า link ผิดโปรเจกต์ |
| 9 | Link ใหม่ไปที่ team ที่ถูกต้อง | ✅ เห็น env ของ Neon |
| 10 | เพิ่ม `JWT_SECRET` (Production + Preview) | ✅ |
| 11 | เพิ่ม script `vercel-build` ให้ migrate ตอน build แล้ว push `18e8e58` | ✅ สร้างตารางครบ 6 คำสั่ง |
| 12 | ทดสอบ end-to-end บนเว็บจริง | ✅ ผ่านทั้งหมด |
| 13 | ตรวจพบว่า push ข้อ 11 ทำให้โปรเจกต์ซ้ำ deploy ด้วย | ❌ deploy นั้น **Error** (ไม่มีฐานข้อมูล) |

---

## 3. ปัญหาที่แก้แล้ว

### 3.1 API ตอบ 500 หลัง deploy
- **อาการ:** หน้าเว็บเปิดได้ แต่สมัคร/ล็อกอินไม่ได้
- **วิธีวินิจฉัย:** ไล่ทดสอบจากส่วนที่ไม่ใช้ DB ไปส่วนที่ใช้ DB (200 → 400 → 500) จึงรู้ว่าปัญหาอยู่ที่ส่วนที่ต่อฐานข้อมูล
- **สาเหตุ:**
  1. ไม่มี `JWT_SECRET` บน Vercel
  2. Neon ใส่ `DATABASE_URL` ให้แล้ว แต่**ยังไม่ได้สร้างตาราง**
- **แก้ไข:** เพิ่ม `JWT_SECRET` และ migrate ตอน build (ดู 3.3)

### 3.2 `vercel link` เลือก team ผิด
- **สาเหตุ:** บัญชีมี 2 team CLI ถามว่าจะใช้ team ไหน และ Claude เลือก `my-team-573a1e58` ซึ่งผิด
- **ผล:** CLI สร้างโปรเจกต์ใหม่ชื่อ `remember-word` ใน "My Team" เชื่อมกับ GitHub repo และ Claude เพิ่ม `JWT_SECRET` ลงไปในโปรเจกต์นั้น
- **ตรวจพบจาก:** `vercel integration list` แสดงชื่อ team ไม่ตรงกับที่ link ไว้
- **แก้ไข:** link ใหม่ด้วย `--scope nonkunginterrubs-projects` (ยังต้องลบโปรเจกต์ซ้ำ ดูข้อ 4.1)

### 3.3 ดึง `DATABASE_URL` มารัน migrate ที่เครื่องไม่ได้
- **สาเหตุ:** Neon ตั้ง `DATABASE_URL` เป็น **Sensitive** จึงไม่มีใครดูหรือดึงค่าได้ (`vercel env pull` ได้ค่าว่าง)
- **แก้ไข:** เพิ่ม script ใน `package.json` ให้ Vercel migrate เองตอน build
  ```json
  "vercel-build": "node db/migrate.mts && next build"
  ```
  `schema.sql` ใช้ `IF NOT EXISTS` ทั้งหมด จึงรันซ้ำทุก deploy ได้โดยไม่ลบข้อมูล

### 3.4 Vercel CLI แก้ `.gitignore` เอง
- **อาการ:** CLI ต่อท้าย `.env*` หลังบรรทัด `!.env.example` จึงทำให้ `.env.example` ถูกกันไม่ให้ขึ้น GitHub อีกครั้ง และมีบรรทัดซ้ำ
- **แก้ไข:** แก้ `.gitignore` กลับ ให้เหลือ `!.env.example` แล้วตามด้วย `.vercel`

### 3.5 ปัญหาเล็กน้อยอื่น ๆ
| ปัญหา | แก้ไข |
|---|---|
| Git เตือนเรื่อง CRLF/LF ทุกไฟล์ | เพิ่ม `.gitattributes` (`* text=auto eol=lf`) |
| `git push` แสดง "Cannot prompt because user interactivity has been disabled" | push สำเร็จอยู่แล้ว ไม่มีผล |
| ผู้ใช้หา connection string ของ Neon ไม่เจอ | ใช้ Vercel CLI แทน |
| `vercel project rm` ต้องให้ยืนยันทุกครั้ง Claude จึงลบเองไม่ได้ | ผู้ใช้ต้องลบเอง (ดูข้อ 4.1) |

### 3.6 ปัญหาตอน build ก่อน deploy (แก้ก่อน push ครั้งแรก)
| ปัญหา | สาเหตุ | แก้ไข |
|---|---|---|
| Build พังที่ `/api/auth/me` | เรียก `cookies()` ไว้ใน try/catch ทำให้ Next.js 16 แยกไม่ออกว่าเป็น route ที่ต้องทำงานตอน request | ย้ายการอ่าน cookie ออกมานอก try |
| Build พังที่ `/_not-found` | Redux store สุ่มค่าระหว่าง prerender ซึ่ง Cache Components ไม่อนุญาต | ครอบ `StoreProvider` ด้วย `<Suspense>` |

---

## 4. ปัญหาที่ยังค้าง

| # | ปัญหา | ความสำคัญ | วิธีแก้ |
|---|---|---|---|
| 4.1 | **โปรเจกต์ซ้ำใน "My Team" ยังอยู่** และ deploy ล้มเหลวทุกครั้งที่ push (ล่าสุด: `remember-word-kcbhd7doy-my-team-573a1e58.vercel.app` สถานะ **Error**) | 🔴 สูง | `vercel project rm remember-word --scope my-team-573a1e58` แล้วตอบ `y` |
| 4.2 | บัญชีทดสอบ `e2e-test-1791872378697@example.com` ยังอยู่ในฐานข้อมูลจริง (ลบคำศัพท์ทดสอบแล้ว) | 🟡 ต่ำ | Neon Console → SQL Editor: `DELETE FROM users WHERE email LIKE 'e2e-test-%@example.com';` |
| 4.3 | `.env.local` ในเครื่องไม่มี `DATABASE_URL` จึงรัน `npm run dev` กับฐานข้อมูลจริงไม่ได้ | 🟡 ต่ำ | คัดลอก connection string จาก Neon Console มาใส่เอง |
| 4.4 | `npm audit` แจ้งช่องโหว่ระดับ high 5 รายการ ยังไม่ได้ตรวจ | 🟠 กลาง | รัน `npm audit` ดูรายละเอียดก่อน (ไม่ควรใช้ `--force`) |
| 4.5 | ยังไม่มีการจำกัดจำนวนครั้งล็อกอินผิด | 🟠 กลาง | ทำในเฟส 2 |

---

## 5. ผลทดสอบ end-to-end บนเว็บจริง (หลังแก้)

| ขั้นตอน | ผลที่ได้ | ผล |
|---|---|---|
| สมัครสมาชิก | 201 | ✅ |
| สมัครด้วยอีเมลซ้ำ | 409 "อีเมลนี้ถูกใช้สมัครแล้ว" | ✅ |
| เพิ่มคำ 3 คำ | 201 | ✅ |
| เพิ่มคำซ้ำ (`PERSEVERE` ซ้ำกับ `persevere`) | 409 | ✅ |
| ค้นหาด้วยภาษาไทย "ยอม" | เจอ "give up" | ✅ |
| แก้ไขคำ | 200 | ✅ |
| ดึงชุดคำของวันนี้ | 3 ข้อ คำในประโยคถูกซ่อนเป็น `_____` | ✅ |
| ตอบ `Persevere` (ตัวพิมพ์ใหญ่) และ `give  up` (ช่องว่างเกิน) | นับว่าถูก | ✅ |
| ตอบ `abundent` (สะกดผิด) | นับว่าผิด | ✅ |
| ส่งคำตอบซ้ำข้อเดิม | 409 | ✅ |
| จบรอบ | คะแนน 2/3 | ✅ |
| กล่องทบทวน | ตอบถูก → กล่อง 2 (นัด 15 ต.ค.) / ตอบผิด → กล่อง 1 (นัด 14 ต.ค.) | ✅ |
| สถิติ | streak = 1, สถานะวันนี้ = done | ✅ |
| ออกจากระบบ | `/api/auth/me` ตอบ 401 และหน้าเว็บพาไป `/login` | ✅ |

---

## 6. ข้อควรทำในการ deploy ครั้งต่อไป

1. ตรวจ `vercel teams ls` และ `--scope` **ก่อน** `vercel link` ทุกครั้ง
2. ตรวจ env ด้วย `vercel env ls` ให้ครบ (`DATABASE_URL`, `JWT_SECRET`) ก่อน deploy
3. แก้ env แล้วต้อง **Redeploy**
4. หลัง deploy ให้ทดสอบ API ที่ใช้ฐานข้อมูลทุกครั้ง ไม่ใช่แค่เปิดหน้าเว็บ
5. หลังรันเครื่องมือใด ๆ (CLI, generator) ให้ดู `git diff` ก่อน commit
6. ทดสอบการเปลี่ยนแปลงใหญ่บน branch แยก (Preview) ก่อน merge เข้า `main`
