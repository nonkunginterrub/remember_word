// logic ฝั่ง server ของแบบทดสอบประจำวัน
import type { Question } from '@/types';
import type { Sql } from './db';
import { buildHint, maskWord, pickDailyWords } from './scheduler';

export interface DailySetRow {
  id: number;
  word_ids: number[];
  score: number | null;
  finished_at: Date | string | null;
}

/** ดึงชุดคำของวันนี้ ถ้ายังไม่มีให้สร้างใหม่ — คืน null ถ้าผู้ใช้ยังไม่มีคำเลย */
export async function getOrCreateDailySet(
  sql: Sql,
  userId: number,
  today: string,
): Promise<DailySetRow | null> {
  const existing = await findDailySet(sql, userId, today);
  if (existing) return existing;

  const words = (await sql`
    SELECT id, box, next_review::text AS next_review, created_at
    FROM words WHERE user_id = ${userId}`) as {
    id: number;
    box: number;
    next_review: string | null;
    created_at: Date;
  }[];
  if (words.length === 0) return null;

  const ids = pickDailyWords(
    words.map((w) => ({ id: w.id, box: w.box, nextReview: w.next_review, createdAt: w.created_at })),
    today,
  );

  // ON CONFLICT กันกรณีเปิดหลายแท็บพร้อมกัน
  await sql`
    INSERT INTO daily_sets (user_id, quiz_date, word_ids)
    VALUES (${userId}, ${today}, ${ids}::int[])
    ON CONFLICT (user_id, quiz_date) DO NOTHING`;
  return findDailySet(sql, userId, today);
}

export async function findDailySet(sql: Sql, userId: number, today: string): Promise<DailySetRow | null> {
  const [set] = (await sql`
    SELECT id, word_ids, score, finished_at
    FROM daily_sets WHERE user_id = ${userId} AND quiz_date = ${today}`) as DailySetRow[];
  return set ?? null;
}

/** โหลดคำถามของชุด พร้อมคำตอบที่ตอบไปแล้ว (ไม่ส่งเฉลยของข้อที่ยังไม่ได้ตอบ) */
export async function loadQuestions(sql: Sql, userId: number, set: DailySetRow): Promise<Question[]> {
  const [words, answers] = (await Promise.all([
    sql`
      SELECT id, word, meaning, example FROM words
      WHERE user_id = ${userId} AND id = ANY(${set.word_ids}::int[])`,
    sql`
      SELECT word_id, user_answer, is_correct FROM answers
      WHERE daily_set_id = ${set.id}`,
  ])) as [
    { id: number; word: string; meaning: string; example: string | null }[],
    { word_id: number; user_answer: string | null; is_correct: boolean }[],
  ];

  const wordById = new Map(words.map((w) => [w.id, w]));
  const answerByWordId = new Map(answers.map((a) => [a.word_id, a]));

  // เรียงตามลำดับใน word_ids และข้ามคำที่ถูกลบไปแล้ว
  return set.word_ids.flatMap((id) => {
    const w = wordById.get(id);
    if (!w) return [];
    const a = answerByWordId.get(id);
    return [
      {
        wordId: w.id,
        meaning: w.meaning,
        example: maskWord(w.example, w.word),
        hint: buildHint(w.word),
        answer: a ? { userAnswer: a.user_answer ?? '', isCorrect: a.is_correct, correctWord: w.word } : null,
      },
    ];
  });
}
