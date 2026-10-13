// ระบบทบทวนแบบ Leitner + การเลือกคำประจำวัน (pure functions — ไม่แตะฐานข้อมูล)

export const DAILY_WORD_COUNT = 10;
export const MAX_BOX = 5;
export const TIME_ZONE = 'Asia/Bangkok';

// กล่อง -> จำนวนวันก่อนทบทวนครั้งถัดไป
export const BOX_INTERVALS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

export interface SchedulableWord {
  id: number;
  box: number;
  nextReview: string | null;
  createdAt?: string | Date;
}

/** วันที่ปัจจุบันตามเวลาไทย ในรูปแบบ YYYY-MM-DD */
export function todayInTimeZone(now: Date = new Date(), timeZone: string = TIME_ZONE): string {
  // en-CA ให้รูปแบบ YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** บวกจำนวนวันให้วันที่รูปแบบ YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** ตอบถูก -> เลื่อนขึ้น 1 กล่อง, ตอบผิด -> กลับกล่อง 1 แล้วคำนวณวันทบทวนครั้งถัดไป */
export function applyAnswer(
  box: number,
  isCorrect: boolean,
  today: string,
): { box: number; nextReview: string } {
  const newBox = isCorrect ? Math.min((box || 1) + 1, MAX_BOX) : 1;
  return { box: newBox, nextReview: addDays(today, BOX_INTERVALS[newBox]) };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * เลือก id คำสำหรับวันนี้
 * 1) คำที่ถึงกำหนดทบทวน (nextReview <= today) เรียงจากกล่องต่ำสุด แล้ววันที่ค้างนานสุด
 * 2) คำใหม่ที่ยังไม่เคยทาย (nextReview = null) เรียงตามลำดับที่เพิ่ม
 * 3) ถ้ายังไม่ครบ สุ่มจากคำที่เหลือ
 */
export function pickDailyWords(
  words: SchedulableWord[],
  today: string,
  count: number = DAILY_WORD_COUNT,
  random: () => number = Math.random,
): number[] {
  const due = words
    .filter((w): w is SchedulableWord & { nextReview: string } => !!w.nextReview && w.nextReview <= today)
    .sort((a, b) => a.box - b.box || a.nextReview.localeCompare(b.nextReview) || a.id - b.id);

  const fresh = words
    .filter((w) => !w.nextReview)
    .sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime() || a.id - b.id,
    );

  const picked: SchedulableWord[] = [...due, ...fresh].slice(0, count);
  if (picked.length < count) {
    const used = new Set(picked.map((w) => w.id));
    const rest = shuffle(
      words.filter((w) => !used.has(w.id)),
      random,
    );
    picked.push(...rest.slice(0, count - picked.length));
  }
  return picked.map((w) => w.id);
}

/** ปรับข้อความให้เทียบกันได้: ตัดช่องว่างหัวท้าย, รวมช่องว่างซ้ำ, ตัวพิมพ์เล็ก */
export function normalizeAnswer(text: unknown): string {
  return String(text ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function checkAnswer(userAnswer: string, correctWord: string): boolean {
  const answer = normalizeAnswer(userAnswer);
  return answer.length > 0 && answer === normalizeAnswer(correctWord);
}

/**
 * จำนวนวันที่ทำแบบทดสอบเสร็จติดต่อกัน
 * นับถึงวันนี้ หรือถึงเมื่อวาน ถ้าวันนี้ยังไม่ได้ทำ (streak ยังไม่ขาด)
 */
export function computeStreak(finishedDates: string[], today: string): number {
  const done = new Set(finishedDates);
  let day = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** ซ่อนคำศัพท์ในประโยคตัวอย่าง เพื่อไม่ให้เฉลยคำตอบ */
export function maskWord(sentence: string | null | undefined, word: string): string | null {
  if (!sentence) return sentence ?? null;
  if (!word.trim()) return sentence;
  return sentence.replace(new RegExp(escapeRegExp(word.trim()), 'gi'), '_____');
}

/** คำใบ้: ตัวอักษรแรก + จำนวนตัวอักษร เช่น "p _ _ _ _" */
export function buildHint(word: string): string {
  const chars = [...word.trim()];
  return chars.map((c, i) => (i === 0 || c === ' ' ? c : '_')).join(' ');
}
