import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { withAuth } from '@/lib/http';
import { MAX_BOX, computeStreak, todayInTimeZone } from '@/lib/scheduler';
import type { Stats } from '@/types';

export const GET = withAuth(async (_request, { userId }) => {
  const sql = getSql();
  const today = todayInTimeZone();

  const [boxRows, [counts], history, [todaySet], mostMissed] = (await Promise.all([
    sql`
      SELECT box, count(*)::int AS count FROM words
      WHERE user_id = ${userId} GROUP BY box`,
    sql`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE next_review IS NULL)::int AS new_words,
             count(*) FILTER (WHERE next_review <= ${today})::int AS due
      FROM words WHERE user_id = ${userId}`,
    sql`
      SELECT quiz_date::text AS date, score, cardinality(word_ids) AS total
      FROM daily_sets
      WHERE user_id = ${userId} AND finished_at IS NOT NULL
      ORDER BY quiz_date DESC LIMIT 400`,
    sql`
      SELECT finished_at FROM daily_sets
      WHERE user_id = ${userId} AND quiz_date = ${today}`,
    sql`
      SELECT id, word, meaning, wrong_count FROM words
      WHERE user_id = ${userId} AND wrong_count > 0
      ORDER BY wrong_count DESC, word LIMIT 5`,
  ])) as [
    { box: number; count: number }[],
    { total: number; new_words: number; due: number }[],
    { date: string; score: number; total: number }[],
    { finished_at: Date | null }[],
    { id: number; word: string; meaning: string; wrong_count: number }[],
  ];

  const boxes = Array.from({ length: MAX_BOX }, (_, i) => ({
    box: i + 1,
    count: boxRows.find((r) => r.box === i + 1)?.count ?? 0,
  }));

  const stats: Stats = {
    today,
    todayStatus: !todaySet ? 'not_started' : todaySet.finished_at ? 'done' : 'in_progress',
    streak: computeStreak(
      history.map((h) => h.date),
      today,
    ),
    totalWords: counts.total,
    newWords: counts.new_words,
    dueWords: counts.due,
    boxes,
    recent: history.slice(0, 7),
    mostMissed: mostMissed.map((w) => ({
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      wrongCount: w.wrong_count,
    })),
  };
  return NextResponse.json(stats);
});
