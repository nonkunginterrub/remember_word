import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import { getCurrentUserId } from './auth';

type Params = Record<string, string | string[] | undefined>;

export interface RouteContext<P extends Params = Params> {
  params: Promise<P>;
}

export interface AuthedContext<P extends Params = Params> extends RouteContext<P> {
  userId: number;
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

type ParseResult<T> = { data: T; error?: undefined } | { data?: undefined; error: NextResponse };

/** อ่าน JSON body แล้วตรวจด้วย zod — คืน { data } หรือ { error: Response } */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: jsonError('รูปแบบข้อมูลไม่ถูกต้อง') };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: jsonError(result.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง') };
  }
  return { data: result.data };
}

/** ครอบ handler ที่ต้องล็อกอิน: ส่ง userId ให้ และแปลง error ที่ไม่คาดคิดเป็น 500 */
export function withAuth<P extends Params = Params>(
  handler: (request: NextRequest, context: AuthedContext<P>) => Promise<Response>,
) {
  return async (request: NextRequest, context: RouteContext<P>): Promise<Response> => {
    // อ่าน cookies() นอก try — ตอน build, Next.js ใช้การ reject ของ cookies()
    // เพื่อรู้ว่า route นี้ต้องทำงานตอน request (ห้ามดักไว้เอง)
    const userId = await getCurrentUserId();
    if (!userId) return jsonError('กรุณาเข้าสู่ระบบ', 401);
    try {
      return await handler(request, { ...context, userId });
    } catch (err) {
      console.error(err);
      return jsonError('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์', 500);
    }
  };
}

/** ครอบ handler ที่ไม่ต้องล็อกอิน เพื่อแปลง error ที่ไม่คาดคิดเป็น 500 */
export function withErrors<P extends Params = Params>(
  handler: (request: NextRequest, context: RouteContext<P>) => Promise<Response>,
) {
  return async (request: NextRequest, context: RouteContext<P>): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error(err);
      return jsonError('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์', 500);
    }
  };
}
