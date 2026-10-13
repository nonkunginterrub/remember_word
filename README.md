# 📚 Remember Word

เว็บบันทึกคำศัพท์และทายคำวันละ 10 คำ ด้วยระบบทบทวนแบบ Leitner (Spaced Repetition)

**Stack:** Next.js 16 (App Router, TypeScript) · Redux Toolkit + RTK Query · PostgreSQL (Neon) · Deploy บน Vercel

รายละเอียดการออกแบบทั้งหมดอยู่ใน [PLAN.md](PLAN.md)

## เริ่มใช้งานในเครื่อง

```bash
npm install
cp .env.example .env.local     # แล้วใส่ DATABASE_URL และ JWT_SECRET
npm run db:migrate             # สร้างตารางในฐานข้อมูล
npm run dev                    # เปิด http://localhost:3000
```

ถ้าเชื่อมโปรเจกต์กับ Vercel แล้ว ใช้ `vercel env pull .env.local` แทนการกรอกเองได้

## คำสั่งที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` | รันโหมดพัฒนา |
| `npm test` | รัน unit tests (Vitest) |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
| `npm run typecheck` | ตรวจ type ด้วย TypeScript |
| `npm run build` | build สำหรับ production |
| `npm run db:migrate` | สร้าง/อัปเดตตาราง (รันซ้ำได้) |
| `npm run vercel-build` | ใช้บน Vercel เท่านั้น: migrate ฐานข้อมูลแล้ว build (Vercel เรียกให้อัตโนมัติ) |

## Deploy ขึ้น Vercel

1. push โค้ดขึ้น GitHub
2. vercel.com → **Add New Project** → เลือก repo
3. แท็บ **Storage → Create Database → Neon (Postgres)** → Connect กับโปรเจกต์ (ได้ `DATABASE_URL` อัตโนมัติ)
4. **Settings → Environment Variables** เพิ่ม `JWT_SECRET` (ยาว ≥ 32 ตัวอักษร)
5. Deploy — ตอน build บน Vercel จะรัน `db/migrate.mts` สร้างตารางให้อัตโนมัติ (script `vercel-build`)
   หลังจากนี้ push ไป `main` จะ deploy อัตโนมัติ

## โครงสร้างโปรเจกต์

```
app/                หน้าเว็บ + API (app/api/**/route.ts)
components/         React components
store/              Redux Toolkit (store, apiSlice, quizSlice, uiSlice)
lib/                logic ฝั่ง server + scheduler (Leitner)
types/              type ที่ใช้ร่วมกันระหว่าง API และหน้าเว็บ
db/                 schema.sql + migrate.mts
proxy.ts            ตรวจล็อกอินก่อนเข้าหน้าเว็บ (Next.js 16 เปลี่ยนชื่อจาก middleware)
tests/              Vitest
```
