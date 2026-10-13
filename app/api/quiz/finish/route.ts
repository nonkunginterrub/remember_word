import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { jsonError, withAuth } from '@/lib/http';
import { findDailySet, loadQuestions } from '@/lib/quiz';
import { todayInTimeZone } from '@/lib/scheduler';

export const POST = withAuth(async (_request, { userId }) => {
  const sql = getSql();
  const today = todayInTimeZone();
  const set = await findDailySet(sql, userId, today);
  if (!set) return jsonError('ยังไม่มีชุดคำของวันนี้', 404);

  const questions = await loadQuestions(sql, userId, set);
  if (questions.some((q) => !q.answer)) return jsonError('ยังตอบไม่ครบทุกข้อ', 400);

  const score = questions.filter((q) => q.answer?.isCorrect).length;
  if (!set.finished_at) {
    await sql`
      UPDATE daily_sets SET score = ${score}, finished_at = now()
      WHERE id = ${set.id} AND finished_at IS NULL`;
  }
  return NextResponse.json({ score, total: questions.length });
});
