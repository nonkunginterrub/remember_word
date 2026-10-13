import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import { jsonError, parseBody, withErrors } from '@/lib/http';
import { credentialsSchema } from '@/lib/validators';
import type { User } from '@/types';

export const POST = withErrors(async (request) => {
  const { data, error } = await parseBody(request, credentialsSchema);
  if (error) return error;

  const sql = getSql();
  const [user] = (await sql`
    SELECT id, email, password_hash FROM users WHERE email = ${data.email}`) as (User & {
    password_hash: string;
  })[];
  const ok = await verifyPassword(data.password, user?.password_hash);
  if (!user || !ok) return jsonError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);

  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email } });
});
