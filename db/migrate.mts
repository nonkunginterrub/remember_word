// สร้างตารางในฐานข้อมูล: npm run db:migrate
// อ่าน DATABASE_URL จาก .env.local (ได้จาก `vercel env pull .env.local`) หรือ .env
import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: ['.env.local', '.env'], quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ไม่พบ DATABASE_URL — รัน `vercel env pull .env.local` หรือสร้างไฟล์ .env.local ก่อน');
  process.exit(1);
}

const sql = neon(databaseUrl);
const schema: string = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');

const statements = schema
  .replace(/--.*$/gm, '')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log('✔', statement.split('\n')[0]);
}
console.log(`สร้างตารางเรียบร้อย (${statements.length} คำสั่ง)`);
