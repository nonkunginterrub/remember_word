import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifySessionToken } from './session';

// ใช้เทียบเมื่อไม่พบอีเมล เพื่อให้เวลาตอบสนองใกล้เคียงกับกรณีพบอีเมล
let dummyHash: string | undefined;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
  if (!hash) {
    dummyHash ??= await bcrypt.hash('dummy-password-for-timing', 10);
    await bcrypt.compare(password, dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}

export async function setSessionCookie(userId: number): Promise<void> {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUserId(): Promise<number | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
