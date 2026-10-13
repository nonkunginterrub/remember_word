# แผนโปรเจกต์ Remember Word — เว็บบันทึกคำศัพท์และทายคำวันละ 10 คำ

## 1. เป้าหมาย
- บันทึกคำศัพท์ใหม่ (คำ, ความหมาย, ตัวอย่างประโยค)
- ทุกวันระบบเลือกคำมาให้ทาย **10 คำ** เพื่อทบทวน ไม่ให้ลืม
- คำที่ตอบผิดบ่อยจะถูกนำมาทบทวนถี่ขึ้น คำที่จำได้แล้วจะเว้นระยะห่างออกไป (Spaced Repetition)
- ดูสถิติความก้าวหน้าและจำนวนวันที่ทบทวนติดต่อกัน (Streak)
- **Front-end ด้วย Next.js + Redux Toolkit, Deploy บน Vercel, เก็บข้อมูลใน PostgreSQL**

## 2. สถาปัตยกรรม
```
 เบราว์เซอร์ (มือถือ / คอม)
   React Components ── Redux Store (Redux Toolkit)
                          ├─ slices      : state ฝั่ง UI (รอบทายคำ, ธีม)
                          └─ RTK Query   : เรียก API + cache ข้อมูลจาก server
        │ fetch /api/*
        ▼
 ┌──────────────── Vercel (Next.js App Router) ────────────────┐
 │  app/(pages)        → หน้าเว็บ (Server + Client Components)  │
 │  app/api/*/route.ts → Route Handlers (API, Node.js runtime)  │
 │  middleware         → ตรวจล็อกอินก่อนเข้าหน้าที่ต้องล็อกอิน      │
 └──────────────────────────┬──────────────────────────────────┘
                            │ SQL (DATABASE_URL)
                            ▼
          PostgreSQL บน Neon (ติดตั้งผ่าน Vercel Marketplace)
```
> - Front-end และ API อยู่ในโปรเจกต์ Next.js เดียวกัน deploy ครั้งเดียวจบ
> - "Vercel Postgres" เดิมย้ายไปเป็น **Neon** ใน Vercel Marketplace แล้ว ติดตั้งจากแท็บ
>   Storage ของโปรเจกต์ใน Vercel ระบบจะใส่ `DATABASE_URL` ให้อัตโนมัติ (มีแพ็กเกจฟรี)

## 3. เทคโนโลยี
| ส่วน | เลือกใช้ | เหตุผล |
|---|---|---|
| Framework | **Next.js (App Router)** — เขียนด้วย **TypeScript** (`.ts` / `.tsx`, strict mode) | หน้าเว็บ + API ในที่เดียว, Vercel รองรับเต็มที่ |
| State management | **Redux Toolkit** + `react-redux` | จัดการ state เป็นระบบ, ใช้ Redux DevTools ดีบักได้ |
| เรียก API / cache | **RTK Query** (มากับ Redux Toolkit) | ไม่ต้องเขียน loading/error เอง, refetch อัตโนมัติเมื่อข้อมูลเปลี่ยน |
| ฟอนต์ | Sarabun ผ่าน `next/font/google` | โหลดเร็ว ไม่กระพริบ |
| สไตล์ | CSS Modules (หรือ Tailwind CSS ถ้าต้องการ) | มากับ Next.js |
| ฐานข้อมูล | PostgreSQL (Neon) + `@neondatabase/serverless` | serverless, ไม่มีปัญหา connection เต็ม |
| ล็อกอิน | `bcryptjs` (hash รหัสผ่าน) + JWT ใน HttpOnly cookie (`jose`) | ข้อมูลแต่ละคนแยกกัน |
| ตรวจ input | `zod` | ใช้ schema เดียวกันทั้งฟอร์มและ API |
| ฟอร์ม | `react-hook-form` | ฟอร์มเพิ่ม/แก้ไขคำ |
| กราฟ | `recharts` | หน้าสถิติ |
| ทดสอบ | Vitest + React Testing Library | ทดสอบ scheduler, reducers, components |
| รันเครื่องตัวเอง | `npm run dev` (ดึง env ด้วย `vercel env pull`) | |

## 4. ฐานข้อมูล (PostgreSQL Schema)
```sql
-- ผู้ใช้
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- คำศัพท์ + สถานะ Spaced Repetition
CREATE TABLE words (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word          TEXT NOT NULL,
  meaning       TEXT NOT NULL,
  example       TEXT,
  box           SMALLINT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  next_review   DATE,                 -- NULL = คำใหม่ที่ยังไม่เคยทาย
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, word)
);
CREATE INDEX idx_words_review ON words (user_id, next_review);

-- ชุดคำประจำวัน (1 ชุดต่อผู้ใช้ต่อวัน)
CREATE TABLE daily_sets (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_date   DATE NOT NULL,          -- ใช้วันที่ตามเวลาไทย (Asia/Bangkok)
  word_ids    INT[] NOT NULL,
  score       SMALLINT,               -- NULL = ยังทายไม่เสร็จ
  finished_at TIMESTAMPTZ,
  UNIQUE (user_id, quiz_date)
);

-- ประวัติคำตอบรายคำ (ใช้ทำสถิติ)
CREATE TABLE answers (
  id           SERIAL PRIMARY KEY,
  daily_set_id INT NOT NULL REFERENCES daily_sets(id) ON DELETE CASCADE,
  word_id      INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_answer  TEXT,
  is_correct   BOOLEAN NOT NULL,
  answered_at  TIMESTAMPTZ DEFAULT now()
);
```

**ระยะห่างการทบทวนของแต่ละกล่อง (Leitner)**

| กล่อง | ทบทวนอีกครั้งใน |
|---|---|
| 1 | 1 วัน |
| 2 | 2 วัน |
| 3 | 4 วัน |
| 4 | 7 วัน |
| 5 | 14 วัน |

- ตอบถูก → เลื่อนขึ้น 1 กล่อง | ตอบผิด → กลับไปกล่อง 1 → คำนวณ `next_review` ใหม่

## 5. วิธีเลือกคำ 10 คำต่อวัน (ทำฝั่ง API)
1. ถ้าวันนี้มี `daily_sets` อยู่แล้ว → ส่งชุดเดิมกลับไป (เปิดซ้ำได้ชุดเดิม)
2. เลือกคำที่ `next_review <= วันนี้` เรียงจาก `box` ต่ำสุด
3. ถ้าไม่ครบ 10 → เติมคำใหม่ (`next_review IS NULL`)
4. ถ้ายังไม่ครบ → สุ่มจากคำที่เหลือ (`ORDER BY random()`)
5. บันทึกลง `daily_sets`

## 6. API (Next.js Route Handlers ใน `app/api`)
| Method | Path | หน้าที่ |
|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | ล็อกอิน (ตั้ง cookie) |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน |
| GET | `/api/words?q=` | รายการคำ / ค้นหา |
| POST | `/api/words` | เพิ่มคำ |
| PUT | `/api/words/[id]` | แก้ไขคำ |
| DELETE | `/api/words/[id]` | ลบคำ |
| GET | `/api/quiz/today` | ดึง/สร้างชุด 10 คำของวันนี้ |
| POST | `/api/quiz/answer` | ส่งคำตอบ 1 คำ → ตรวจ + อัปเดตกล่อง |
| POST | `/api/quiz/finish` | จบรอบ บันทึกคะแนน |
| GET | `/api/stats` | สถิติ, streak, จำนวนคำในแต่ละกล่อง |

ทุก endpoint (ยกเว้น register/login) ต้องตรวจ cookie และกรองข้อมูลด้วย `user_id` เสมอ
คำตอบที่ถูกต้องจะ**ไม่ถูกส่งไปหน้าเว็บก่อนตอบ** — ตรวจที่ server เพื่อกันการโกง

## 7. State Management ด้วย Redux Toolkit

### 7.1 แบ่งหน้าที่ของ state
| ประเภท state | เก็บที่ | ตัวอย่าง |
|---|---|---|
| ข้อมูลจาก server | **RTK Query** (`apiSlice`) | รายการคำ, ชุดคำวันนี้, สถิติ, ผู้ใช้ปัจจุบัน |
| state ฝั่ง UI ที่ใช้หลายหน้า | **slice** ปกติ | ความคืบหน้ารอบทายคำ, ธีม, การแจ้งเตือน (toast) |
| state เฉพาะ component | `useState` | ค่าที่พิมพ์ในช่อง input, เปิด/ปิด modal |

### 7.2 RTK Query — `apiSlice`
```js
// store/apiSlice.ts
export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Me', 'Word', 'Quiz', 'Stats'],
  endpoints: (b) => ({
    getMe:        b.query({ query: () => 'auth/me', providesTags: ['Me'] }),
    login:        b.mutation({ query: (body) => ({ url: 'auth/login', method: 'POST', body }), invalidatesTags: ['Me'] }),
    getWords:     b.query({ query: (q = '') => `words?q=${q}`, providesTags: ['Word'] }),
    addWord:      b.mutation({ /* POST */ invalidatesTags: ['Word', 'Stats'] }),
    updateWord:   b.mutation({ /* PUT  */ invalidatesTags: ['Word'] }),
    deleteWord:   b.mutation({ /* DELETE */ invalidatesTags: ['Word', 'Stats'] }),
    getTodayQuiz: b.query({ query: () => 'quiz/today', providesTags: ['Quiz'] }),
    submitAnswer: b.mutation({ /* POST quiz/answer */ }),
    finishQuiz:   b.mutation({ /* POST quiz/finish */ invalidatesTags: ['Quiz', 'Stats'] }),
    getStats:     b.query({ query: () => 'stats', providesTags: ['Stats'] }),
  }),
});
```
→ เพิ่ม/ลบคำแล้ว หน้าคลังคำและหน้าสถิติจะ refetch ให้อัตโนมัติผ่าน tags

### 7.3 Slices
**`quizSlice`** — ควบคุมรอบการทาย
```js
initialState = {
  status: 'idle',        // 'idle' | 'playing' | 'revealed' | 'finished'
  currentIndex: 0,       // ข้อที่กำลังทาย (0-9)
  results: [],           // [{ wordId, userAnswer, isCorrect, correctWord }]
  mode: 'type',          // 'type' (พิมพ์ตอบ) | 'choice' (4 ตัวเลือก)
}
actions: startQuiz, answerRecorded, nextQuestion, finishQuiz, resetQuiz, setMode
selectors: selectCurrentIndex, selectScore, selectProgress (เช่น 3/10)
```
**`uiSlice`** — ธีม (light/dark), toast แจ้งเตือน

### 7.4 การใช้ Redux กับ Next.js App Router
- สร้าง store แบบ **ต่อ request** ด้วยฟังก์ชัน `makeStore()` (ห้ามใช้ store ตัวแปร global
  เพราะ server จะแชร์ state ข้ามผู้ใช้)
- `StoreProvider.tsx` เป็น Client Component (`'use client'`) สร้าง store ครั้งเดียวด้วย `useState(makeStore)`
  แล้วครอบไว้ใน `app/layout.tsx`
- ใช้ `useSelector` / `useDispatch` / hooks ของ RTK Query ได้เฉพาะใน **Client Components**
- Server Components ใช้สำหรับ layout และส่วนที่ไม่ต้องมี state
- เปิดใช้ Redux DevTools เฉพาะตอน development

## 8. หน้าจอ (Pages / Routes)
| Route | หน้า | ฟังก์ชัน |
|---|---|---|
| `/login`, `/register` | 🔐 ล็อกอิน / สมัคร | อีเมล + รหัสผ่าน |
| `/` | 🏠 Dashboard | ทบทวนวันนี้แล้วหรือยัง, Streak, จำนวนคำ, ปุ่ม "เริ่มทายคำวันนี้" |
| `/words` | ➕ คลังคำ | เพิ่ม/แก้ไข/ลบ/ค้นหาคำ, นำเข้า/ส่งออก CSV |
| `/quiz` | 🎯 ทายคำ | แสดงความหมาย → พิมพ์คำศัพท์ (หรือเลือก 4 ตัวเลือก), เฉลยทันที, แถบความคืบหน้า |
| `/quiz/result` | 🏆 สรุปผล | คะแนน, คำที่ผิด, ปุ่มกลับหน้าแรก |
| `/stats` | 📊 สถิติ | กราฟคะแนนรายวัน, คำในแต่ละกล่อง, คำที่ผิดบ่อยที่สุด |

middleware ตรวจ cookie — ถ้ายังไม่ล็อกอินจะพาไป `/login`

## 9. โครงสร้างไฟล์
```
remember_word/
├── app/
│   ├── layout.tsx                  # ฟอนต์ Sarabun + <StoreProvider>
│   ├── globals.css
│   ├── page.tsx                    # Dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── words/page.tsx
│   ├── quiz/
│   │   ├── page.tsx
│   │   └── result/page.tsx
│   ├── stats/page.tsx
│   └── api/                       # Route Handlers
│       ├── auth/{register,login,logout,me}/route.ts
│       ├── words/route.ts         # GET, POST
│       ├── words/[id]/route.ts    # PUT, DELETE
│       ├── quiz/{today,answer,finish}/route.ts
│       └── stats/route.ts
├── components/                    # WordForm, WordList, QuizCard, ProgressBar,
│                                  # StatCard, Navbar, Toast ...
├── store/
│   ├── store.ts                   # makeStore()
│   ├── StoreProvider.tsx          # 'use client'
│   ├── hooks.ts                   # useAppDispatch, useAppSelector
│   ├── apiSlice.ts                # RTK Query
│   ├── quizSlice.ts
│   └── uiSlice.ts
├── lib/                           # ใช้ฝั่ง server
│   ├── db.ts                      # เชื่อม Neon ด้วย DATABASE_URL
│   ├── auth.ts                    # hash รหัสผ่าน, สร้าง/ตรวจ JWT
│   ├── scheduler.ts               # Leitner + เลือก 10 คำ (pure function)
│   └── validators.ts              # zod schemas (ใช้ร่วมกับฟอร์ม)
├── proxy.ts                       # ป้องกันหน้าที่ต้องล็อกอิน (Next.js 16 เปลี่ยนชื่อจาก middleware)
├── db/
│   ├── schema.sql
│   └── migrate.mts
├── tests/
│   ├── scheduler.test.ts
│   ├── quizSlice.test.ts
│   └── components/QuizCard.test.tsx
├── .env.example                   # DATABASE_URL=, JWT_SECRET=
├── tsconfig.json                  # path alias @/
├── next.config.ts
└── package.json
```

## 10. Environment Variables
| ชื่อ | ที่มา |
|---|---|
| `DATABASE_URL` | ได้อัตโนมัติเมื่อเชื่อม Neon ผ่าน Vercel Marketplace |
| `JWT_SECRET` | สุ่มสตริงยาว ๆ เอง แล้วตั้งค่าใน Vercel → Settings → Environment Variables |

ในเครื่องตัวเองใช้ `vercel env pull .env.local` เพื่อดึงค่ามา (ห้าม commit `.env*` ขึ้น Git)
ห้ามตั้งชื่อตัวแปรลับขึ้นต้นด้วย `NEXT_PUBLIC_` เพราะจะถูกส่งไปหน้าเว็บ

## 11. ขั้นตอน Deploy บน Vercel
1. สร้างโปรเจกต์: `npx create-next-app@latest remember_word` (เลือก TypeScript, App Router, ESLint)
2. ติดตั้งแพ็กเกจ: `npm i @reduxjs/toolkit react-redux @neondatabase/serverless bcryptjs jose zod react-hook-form recharts`
3. สร้าง repo บน GitHub แล้ว push โค้ด
4. vercel.com → **Add New Project** → เลือก repo (Vercel ตรวจเจอ Next.js อัตโนมัติ)
5. **Storage → Create Database → Neon (Postgres)** → Connect กับโปรเจกต์
6. เพิ่ม `JWT_SECRET` ใน Environment Variables
7. `vercel env pull .env.local` แล้ว `npm run db:migrate` เพื่อสร้างตาราง
8. Deploy — หลังจากนี้ push ไป `main` = deploy อัตโนมัติ, ทุก Pull Request ได้ Preview URL

## 12. ลำดับการพัฒนา (Milestones)
**เฟส 1 — MVP ออนไลน์**
- [x] สร้างโปรเจกต์ Next.js, ตั้งค่าฟอนต์ Sarabun, layout, Navbar
- [x] ตั้งค่า Redux Toolkit: `makeStore`, `StoreProvider`, `apiSlice`, `quizSlice`, `uiSlice`
- [x] `schema.sql` + migrate script (รอเชื่อม Neon จริง)
- [x] `lib/scheduler.ts` + test (Leitner และเลือก 10 คำ)
- [x] API auth + หน้าล็อกอิน/สมัคร + proxy
- [x] API คลังคำ (CRUD) + หน้า `/words`
- [x] API ทายคำ + หน้า `/quiz` (พิมพ์ตอบ) + `/quiz/result`
- [x] Dashboard แสดง streak, กล่อง Leitner, คะแนนล่าสุด, คำที่ผิดบ่อย
- [x] รองรับมือถือ (responsive) + โหมดมืดตามระบบ
- [ ] เชื่อม Neon และทดสอบกับฐานข้อมูลจริง
- [ ] Deploy ขึ้น Vercel ครั้งแรก

**เฟส 2 — ใช้งานสะดวกขึ้น**
- [ ] โหมดเลือก 4 ตัวเลือก และโหมดสลับ (ให้คำศัพท์ → ตอบความหมาย)
- [ ] นำเข้า/ส่งออก CSV
- [ ] หน้าสถิติพร้อมกราฟ (recharts)
- [ ] ออกเสียงคำด้วย Web Speech API
- [ ] โหมดมืด (เก็บใน `uiSlice` + จำค่าไว้ใน localStorage)
- [ ] จำกัดจำนวนครั้งล็อกอินผิด (rate limit)

**เฟส 3 — ขั้นสูง (ทางเลือก)**
- [ ] PWA ติดตั้งบนมือถือได้
- [ ] แจ้งเตือนทุกวันด้วย Vercel Cron Jobs + Web Push / อีเมล
- [ ] ล็อกอินด้วย Google (Auth.js)
- [ ] Optimistic update ใน RTK Query (ลบ/แก้คำแล้ว UI เปลี่ยนทันที)

## 13. เกณฑ์ว่าเสร็จ (เฟส 1)
- เปิดเว็บผ่าน URL ของ Vercel ได้ ทั้งบนคอมและมือถือ
- ล็อกอินบนเครื่องหนึ่ง เพิ่มคำ แล้วไปอีกเครื่องเห็นคำเดียวกัน
- แต่ละวัน (ตามเวลาไทย) ได้คำ 10 คำ หรือเท่าที่มี ถ้ามีน้อยกว่า 10 คำ และเปิดซ้ำได้ชุดเดิม
- ตอบผิดแล้ววันรุ่งขึ้นคำนั้นกลับมาให้ทายอีก
- ผู้ใช้คนหนึ่งมองไม่เห็นคำของผู้ใช้อื่น
- เพิ่ม/ลบคำแล้ว Dashboard และสถิติอัปเดตเองโดยไม่ต้องรีเฟรชหน้า
