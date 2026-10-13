import type { Word } from '@/types';

/** แถวจากตาราง words (เลือก next_review เป็น text) */
export interface WordRow {
  id: number;
  word: string;
  meaning: string;
  example: string | null;
  box: number;
  next_review: string | null;
  correct_count: number;
  wrong_count: number;
  created_at: Date | string;
}

/** แปลงแถวจากตาราง words เป็น object ที่ส่งให้หน้าเว็บ */
export function toWord(row: WordRow): Word {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    example: row.example ?? '',
    box: row.box,
    nextReview: row.next_review ?? null,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/** escape อักขระพิเศษของ LIKE (% _ \) */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}
