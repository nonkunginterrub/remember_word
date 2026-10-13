import { NextResponse } from 'next/server';
import { getSql, isUniqueViolation } from '@/lib/db';
import { jsonError, parseBody, withAuth } from '@/lib/http';
import { wordSchema } from '@/lib/validators';
import { toWord, type WordRow } from '@/lib/words';

type Params = { id: string };

async function parseId(params: Promise<Params>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export const PUT = withAuth<Params>(async (request, { params, userId }) => {
  const id = await parseId(params);
  if (!id) return jsonError('ไม่พบคำศัพท์', 404);

  const { data, error } = await parseBody(request, wordSchema);
  if (error) return error;

  const sql = getSql();
  try {
    const [row] = (await sql`
      UPDATE words
      SET word = ${data.word}, meaning = ${data.meaning}, example = ${data.example || null}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, word, meaning, example, box, next_review::text AS next_review,
                correct_count, wrong_count, created_at`) as WordRow[];
    if (!row) return jsonError('ไม่พบคำศัพท์', 404);
    return NextResponse.json({ word: toWord(row) });
  } catch (err) {
    if (isUniqueViolation(err)) return jsonError(`มีคำว่า "${data.word}" อยู่แล้ว`, 409);
    throw err;
  }
});

export const DELETE = withAuth<Params>(async (_request, { params, userId }) => {
  const id = await parseId(params);
  if (!id) return jsonError('ไม่พบคำศัพท์', 404);

  const sql = getSql();
  const [row] = await sql`
    DELETE FROM words WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  if (!row) return jsonError('ไม่พบคำศัพท์', 404);
  return NextResponse.json({ ok: true, id });
});
