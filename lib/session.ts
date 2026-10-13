// จัดการ JWT ของ session — ใช้ได้ทั้งใน Route Handlers และ proxy.ts (ใช้แค่ jose)
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'rw_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 วัน (วินาที)

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ต้องตั้งค่า JWT_SECRET ให้ยาวอย่างน้อย 32 ตัวอักษร (ดู .env.example)');
  }
  return new TextEncoder().encode(secret);
}

export function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** คืนค่า userId ถ้า token ถูกต้อง ไม่เช่นนั้นคืน null */
export async function verifySessionToken(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const userId = Number(payload.sub);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}
