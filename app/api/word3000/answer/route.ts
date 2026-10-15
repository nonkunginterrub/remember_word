import { NextResponse } from 'next/server';
import { jsonError, parseBody, withAuth } from '@/lib/http';
import { word3000AnswerSchema } from '@/lib/validators';
import { checkWord3000Answer, WORD3000 } from '@/lib/word3000';
import type { Word3000Result } from '@/types';

// ตรวจคำตอบโหมด Oxford 3000 — ไม่บันทึกลงฐานข้อมูล
export const POST = withAuth(async (request) => {
  const { data, error } = await parseBody(request, word3000AnswerSchema);
  if (error) return error;

  const entry = WORD3000[data.id];
  if (!entry) return jsonError('ไม่พบคำศัพท์', 404);

  const userAnswer = data.answer.trim();
  const result: Word3000Result = {
    id: entry.id,
    meaning: entry.meaning,
    userAnswer,
    isCorrect: checkWord3000Answer(entry, userAnswer),
    correctWord: entry.word,
  };
  return NextResponse.json(result);
});
