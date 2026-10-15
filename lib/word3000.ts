// คลังคำ Oxford 3000 (A1–B2) สำหรับโหมดทายคำ — ไม่ใช้ฐานข้อมูล
import type { Word3000Level } from '@/types';
import { WORD3000_LEVELS } from './validators';
import rawWords from './data/oxford3000.json';
import { buildHint, checkAnswer, normalizeAnswer } from './scheduler';

export { WORD3000_LEVELS };

export interface Word3000Entry {
  id: number; // ลำดับในไฟล์ข้อมูล
  word: string;
  pos: string; // ชนิดของคำ เช่น "noun, verb"
  level: Word3000Level;
  meaning: string;
}

// ข้อมูลเก็บเป็น [word, pos, level, meaning] เพื่อให้ไฟล์เล็ก
export const WORD3000: Word3000Entry[] = (rawWords as [string, string, Word3000Level, string][]).map(
  ([word, pos, level, meaning], id) => ({ id, word, pos, level, meaning }),
);

/** สุ่มคำ 1 คำ (เลือกระดับได้ ถ้าไม่ระบุสุ่มจากทุกระดับ) — ไม่ซ้ำกับคำที่ส่งมาใน exclude ถ้ายังเหลือคำอื่น */
export function pickWord3000(
  level: Word3000Level | null,
  exclude: number[] = [],
  words: Word3000Entry[] = WORD3000,
  random: () => number = Math.random,
): Word3000Entry {
  const pool = level ? words.filter((w) => w.level === level) : words;
  const skip = new Set(exclude);
  const fresh = pool.filter((w) => !skip.has(w.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(random() * candidates.length)];
}

/** ตอบถูกถ้าตรงกับคำศัพท์ หรือเป็นคำอื่นในคลังที่ความหมายเหมือนกันทุกตัวอักษร */
export function checkWord3000Answer(
  entry: Word3000Entry,
  userAnswer: string,
  words: Word3000Entry[] = WORD3000,
): boolean {
  if (checkAnswer(userAnswer, entry.word)) return true;
  const answer = normalizeAnswer(userAnswer);
  return words.some((w) => w.meaning === entry.meaning && normalizeAnswer(w.word) === answer);
}

export function toWord3000Question(entry: Word3000Entry) {
  return {
    id: entry.id,
    level: entry.level,
    pos: entry.pos,
    meaning: entry.meaning,
    hint: buildHint(entry.word),
  };
}
