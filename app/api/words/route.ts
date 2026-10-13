import { NextResponse } from 'next/server';
import { getSql, isUniqueViolation } from '@/lib/db';
import { jsonError, parseBody, withAuth } from '@/lib/http';
import { wordSchema } from '@/lib/validators';
import { escapeLike, toWord, type WordRow } from '@/lib/words';

export const GET = withAuth(async (request, { userId }) => {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
  const pattern = `%${escapeLike(q)}%`;
  const sql = getSql();
  const rows = (await sql`
    SELECT id, word, meaning, example, box, next_review::text AS next_review,
           correct_count, wrong_count, created_at
    FROM words
    WHERE user_id = ${userId}
      AND (${q}::text = '' OR word ILIKE ${pattern} OR meaning ILIKE ${pattern})
    ORDER BY created_at DESC, id DESC`) as WordRow[];
  return NextResponse.json({ words: rows.map(toWord) });
});

export const POST = withAuth(async (request, { userId }) => {
  const { data, error } = await parseBody(request, wordSchema);
  if (error) return error;

  const sql = getSql();
  try {
    const [row] = (await sql`
      INSERT INTO words (user_id, word, meaning, example)
      VALUES (${userId}, ${data.word}, ${data.meaning}, ${data.example || null})
      RETURNING id, word, meaning, example, box, next_review::text AS next_review,
                correct_count, wrong_count, created_at`) as WordRow[];
    return NextResponse.json({ word: toWord(row) }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) return jsonError(`มีคำว่า "${data.word}" อยู่แล้ว`, 409);
    throw err;
  }
});
