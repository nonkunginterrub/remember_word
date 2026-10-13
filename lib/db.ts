import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export type Sql = NeonQueryFunction<false, false>;

let client: Sql | undefined;

/** คืนค่า SQL tagged template ของ Neon (สร้างครั้งแรกเมื่อถูกเรียก เพื่อไม่ให้ build พังเมื่อไม่มี env) */
export function getSql(): Sql {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('ยังไม่ได้ตั้งค่า DATABASE_URL (ดู .env.example)');
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

/** รหัส error ของ PostgreSQL เมื่อข้อมูลซ้ำกับ UNIQUE constraint */
const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION;
}
