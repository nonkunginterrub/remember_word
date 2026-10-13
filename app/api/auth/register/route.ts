import { NextResponse } from 'next/server';
import { getSql, isUniqueViolation } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { jsonError, parseBody, withErrors } from '@/lib/http';
import { credentialsSchema } from '@/lib/validators';
import type { User } from '@/types';

export const POST = withErrors(async (request) => {
  const { data, error } = await parseBody(request, credentialsSchema);
  if (error) return error;

  const sql = getSql();
  const passwordHash = await hashPassword(data.password);
  let user: User;
  try {
    [user] = (await sql`
      INSERT INTO users (email, password_hash) VALUES (${data.email}, ${passwordHash})
      RETURNING id, email`) as User[];
  } catch (err) {
    if (isUniqueViolation(err)) return jsonError('อีเมลนี้ถูกใช้สมัครแล้ว', 409);
    throw err;
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ user }, { status: 201 });
});
