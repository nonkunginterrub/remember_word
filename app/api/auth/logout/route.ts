import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { withErrors } from '@/lib/http';

export const POST = withErrors(async () => {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
});
