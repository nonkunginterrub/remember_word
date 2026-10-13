import { describe, expect, it } from 'vitest';
import {
  addDays,
  applyAnswer,
  buildHint,
  checkAnswer,
  computeStreak,
  maskWord,
  pickDailyWords,
  todayInTimeZone,
  type SchedulableWord,
} from '@/lib/scheduler';

describe('todayInTimeZone', () => {
  it('ใช้วันที่ตามเวลาไทย (UTC+7)', () => {
    // 2026-10-13 18:30 UTC = 2026-10-14 01:30 ในไทย
    expect(todayInTimeZone(new Date('2026-10-13T18:30:00Z'))).toBe('2026-10-14');
    expect(todayInTimeZone(new Date('2026-10-13T16:59:00Z'))).toBe('2026-10-13');
  });
});

describe('addDays', () => {
  it('บวกข้ามเดือนและปีได้', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('applyAnswer', () => {
  const today = '2026-10-13';

  it('ตอบถูก เลื่อนขึ้น 1 กล่อง และเว้นระยะตามกล่อง', () => {
    expect(applyAnswer(1, true, today)).toEqual({ box: 2, nextReview: '2026-10-15' });
    expect(applyAnswer(3, true, today)).toEqual({ box: 4, nextReview: '2026-10-20' });
  });

  it('กล่องสูงสุดคือ 5', () => {
    expect(applyAnswer(5, true, today)).toEqual({ box: 5, nextReview: '2026-10-27' });
  });

  it('ตอบผิด กลับไปกล่อง 1 และทบทวนพรุ่งนี้', () => {
    expect(applyAnswer(4, false, today)).toEqual({ box: 1, nextReview: '2026-10-14' });
  });
});

describe('pickDailyWords', () => {
  const today = '2026-10-13';
  const noRandom = () => 0;

  it('เลือกคำที่ถึงกำหนดก่อน เรียงจากกล่องต่ำ แล้วตามด้วยคำใหม่', () => {
    const words: SchedulableWord[] = [
      { id: 1, box: 3, nextReview: '2026-10-12' },
      { id: 2, box: 1, nextReview: '2026-10-13' },
      { id: 3, box: 2, nextReview: '2026-10-20' }, // ยังไม่ถึงกำหนด
      { id: 4, box: 1, nextReview: null, createdAt: '2026-10-02' },
      { id: 5, box: 1, nextReview: null, createdAt: '2026-10-01' },
    ];
    expect(pickDailyWords(words, today, 4, noRandom)).toEqual([2, 1, 5, 4]);
  });

  it('ถ้าคำถึงกำหนดและคำใหม่ไม่พอ ให้เติมจากคำที่เหลือ', () => {
    const words: SchedulableWord[] = [
      { id: 1, box: 2, nextReview: '2026-10-20' },
      { id: 2, box: 3, nextReview: '2026-10-25' },
      { id: 3, box: 1, nextReview: '2026-10-13' },
    ];
    const ids = pickDailyWords(words, today, 10, noRandom);
    expect(ids[0]).toBe(3);
    expect([...ids].sort()).toEqual([1, 2, 3]);
  });

  it('ได้ไม่เกินจำนวนที่กำหนด และไม่มีคำซ้ำ', () => {
    const words: SchedulableWord[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, box: 1, nextReview: null }));
    const ids = pickDailyWords(words, today);
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
  });

  it('ไม่มีคำเลย ได้ array ว่าง', () => {
    expect(pickDailyWords([], today)).toEqual([]);
  });
});

describe('checkAnswer', () => {
  it('ไม่สนตัวพิมพ์เล็กใหญ่และช่องว่าง', () => {
    expect(checkAnswer('  Persevere ', 'persevere')).toBe(true);
    expect(checkAnswer('give   up', 'Give up')).toBe(true);
  });

  it('คำตอบผิดหรือว่างถือว่าผิด', () => {
    expect(checkAnswer('persever', 'persevere')).toBe(false);
    expect(checkAnswer('   ', 'persevere')).toBe(false);
  });
});

describe('computeStreak', () => {
  const today = '2026-10-13';

  it('นับวันติดกันถึงวันนี้', () => {
    expect(computeStreak(['2026-10-13', '2026-10-12', '2026-10-11', '2026-10-09'], today)).toBe(3);
  });

  it('วันนี้ยังไม่ทำ นับถึงเมื่อวาน', () => {
    expect(computeStreak(['2026-10-12', '2026-10-11'], today)).toBe(2);
  });

  it('ขาดเกิน 1 วัน streak เป็น 0', () => {
    expect(computeStreak(['2026-10-10'], today)).toBe(0);
    expect(computeStreak([], today)).toBe(0);
  });
});

describe('maskWord / buildHint', () => {
  it('ซ่อนคำในประโยคตัวอย่างโดยไม่สนตัวพิมพ์', () => {
    expect(maskWord('Persevere and you will persevere.', 'persevere')).toBe('_____ and you will _____.');
    expect(maskWord('', 'x')).toBe('');
    expect(maskWord(null, 'x')).toBe(null);
  });

  it('คำใบ้แสดงตัวแรกและจำนวนตัวอักษร', () => {
    expect(buildHint('apple')).toBe('a _ _ _ _');
    expect(buildHint('give up')).toBe('g _ _ _   _ _');
  });
});
