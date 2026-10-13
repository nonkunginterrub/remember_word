import { NextResponse } from 'next/server';
import { getSql, isUniqueViolation } from '@/lib/db';
import { jsonError, parseBody, withAuth } from '@/lib/http';
import { findDailySet } from '@/lib/quiz';
import { applyAnswer, checkAnswer, todayInTimeZone } from '@/lib/scheduler';
import { answerSchema } from '@/lib/validators';
import type { AnswerResult } from '@/types';

export const POST = withAuth(async (request, { userId }) => {
  const { data, error } = await parseBody(request, answerSchema);
  if (error) return error;

  const sql = getSql();
  const today = todayInTimeZone();
  const set = await findDailySet(sql, userId, today);
  if (!set) return jsonError('ชุดคำของวันนี้เปลี่ยนแล้ว กรุณาโหลดหน้าใหม่', 409);
  if (set.finished_at) return jsonError('ทำแบบทดสอบวันนี้เสร็จแล้ว', 409);
  if (!set.word_ids.includes(data.wordId)) return jsonError('คำนี้ไม่อยู่ในชุดของวันนี้', 400);

  const [word] = (await sql`
    SELECT id, word, box FROM words WHERE id = ${data.wordId} AND user_id = ${userId}`) as {
    id: number;
    word: string;
    box: number;
  }[];
  if (!word) return jsonError('ไม่พบคำศัพท์', 404);

  const userAnswer = data.answer.trim();
  const isCorrect = checkAnswer(userAnswer, word.word);
  const { box, nextReview } = applyAnswer(word.box, isCorrect, today);

  try {
    // บันทึกคำตอบก่อน — ถ้าตอบซ้ำจะชน UNIQUE และ transaction จะไม่อัปเดตกล่องคำ
    await sql.transaction([
      sql`
        INSERT INTO answers (daily_set_id, word_id, user_answer, is_correct)
        VALUES (${set.id}, ${word.id}, ${userAnswer}, ${isCorrect})`,
      sql`
        UPDATE words SET
          box = ${box},
          next_review = ${nextReview},
          correct_count = correct_count + ${isCorrect ? 1 : 0},
          wrong_count = wrong_count + ${isCorrect ? 0 : 1}
        WHERE id = ${word.id} AND user_id = ${userId}`,
    ]);
  } catch (err) {
    if (isUniqueViolation(err)) return jsonError('ตอบคำนี้ไปแล้ว', 409);
    throw err;
  }

  const result: AnswerResult = { wordId: word.id, userAnswer, isCorrect, correctWord: word.word };
  return NextResponse.json(result);
});
