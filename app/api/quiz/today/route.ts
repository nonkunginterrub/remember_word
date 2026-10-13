import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { withAuth } from '@/lib/http';
import { getOrCreateDailySet, loadQuestions } from '@/lib/quiz';
import { todayInTimeZone } from '@/lib/scheduler';
import type { TodayQuiz } from '@/types';

export const GET = withAuth(async (_request, { userId }) => {
  const sql = getSql();
  const today = todayInTimeZone();
  const set = await getOrCreateDailySet(sql, userId, today);

  const questions = set ? await loadQuestions(sql, userId, set) : [];
  const body: TodayQuiz = {
    empty: questions.length === 0,
    id: set?.id ?? null,
    date: today,
    total: questions.length,
    finished: Boolean(set?.finished_at),
    score: set?.score ?? null,
    questions,
  };
  return NextResponse.json(body);
});
