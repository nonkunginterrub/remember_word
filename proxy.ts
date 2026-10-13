// ตรวจ session แบบเบื้องต้นก่อนเข้าหน้าเว็บ (API ตรวจซ้ำเองทุกครั้งใน withAuth)
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

const AUTH_PAGES = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!userId && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (userId && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // ไม่รวม API, ไฟล์ของ Next.js และไฟล์ static
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)'],
};
