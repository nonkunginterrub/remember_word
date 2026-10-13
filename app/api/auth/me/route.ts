import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { jsonError, withAuth } from '@/lib/http';
import type { User } from '@/types';

export const GET = withAuth(async (_request, { userId }) => {
  const sql = getSql();
  const [user] = (await sql`SELECT id, email FROM users WHERE id = ${userId}`) as User[];
  if (!user) return jsonError('กรุณาเข้าสู่ระบบ', 401);
  return NextResponse.json({ user });
});
