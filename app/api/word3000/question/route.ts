import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/http';
import { pickWord3000, toWord3000Question, WORD3000_LEVELS } from '@/lib/word3000';

// สุ่มคำถามจาก Oxford 3000 — ?level=A1|A2|B1|B2 (ไม่ใส่ = ทุกระดับ), ?exclude=1,2,3 (คำที่เพิ่งทาย)
export const GET = withAuth(async (request) => {
  const params = request.nextUrl.searchParams;
  const levelParam = params.get('level');
  const level = WORD3000_LEVELS.find((l) => l === levelParam) ?? null;
  const exclude = (params.get('exclude') ?? '')
    .split(',')
    .slice(0, 100)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0);

  const entry = pickWord3000(level, exclude);
  return NextResponse.json(toWord3000Question(entry));
});
