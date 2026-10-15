import { describe, expect, it } from 'vitest';
import {
  checkWord3000Answer,
  pickWord3000,
  toWord3000Question,
  WORD3000,
  WORD3000_LEVELS,
  type Word3000Entry,
} from '@/lib/word3000';

describe('ข้อมูล Oxford 3000', () => {
  it('มีคำครบทุกระดับ และทุกคำมีความหมาย', () => {
    expect(WORD3000.length).toBeGreaterThanOrEqual(3000);
    for (const level of WORD3000_LEVELS) {
      expect(WORD3000.some((w) => w.level === level)).toBe(true);
    }
    for (const w of WORD3000) {
      expect(w.word.trim()).not.toBe('');
      expect(w.meaning.trim()).not.toBe('');
    }
  });

  it('id ตรงกับตำแหน่งในรายการ', () => {
    WORD3000.forEach((w, i) => expect(w.id).toBe(i));
  });
});

describe('pickWord3000', () => {
  const words: Word3000Entry[] = [
    { id: 0, word: 'cat', pos: 'noun', level: 'A1', meaning: 'แมว' },
    { id: 1, word: 'dog', pos: 'noun', level: 'A1', meaning: 'สุนัข' },
    { id: 2, word: 'abandon', pos: 'verb', level: 'B2', meaning: 'ละทิ้ง' },
  ];

  it('เลือกเฉพาะระดับที่กำหนด', () => {
    expect(pickWord3000('B2', [], words, () => 0.99).id).toBe(2);
  });

  it('ไม่เลือกคำที่อยู่ใน exclude', () => {
    expect(pickWord3000('A1', [0], words, () => 0).id).toBe(1);
  });

  it('ถ้าทุกคำถูก exclude หมด ยังสุ่มจากคำในระดับนั้นได้', () => {
    expect([0, 1]).toContain(pickWord3000('A1', [0, 1], words, () => 0).id);
  });

  it('ไม่ระบุระดับ สุ่มจากทุกคำ', () => {
    expect(pickWord3000(null, [], words, () => 0.99).id).toBe(2);
  });
});

describe('checkWord3000Answer', () => {
  const words: Word3000Entry[] = [
    { id: 0, word: 'enough', pos: 'adverb', level: 'A1', meaning: 'เพียงพอ' },
    { id: 1, word: 'sufficient', pos: 'adjective', level: 'B2', meaning: 'เพียงพอ' },
    { id: 2, word: 'big', pos: 'adjective', level: 'A1', meaning: 'ใหญ่' },
  ];

  it('ไม่สนตัวพิมพ์เล็กใหญ่และช่องว่าง', () => {
    expect(checkWord3000Answer(words[0], '  Enough ', words)).toBe(true);
  });

  it('ยอมรับคำอื่นที่ความหมายตรงกันทุกตัวอักษร', () => {
    expect(checkWord3000Answer(words[0], 'sufficient', words)).toBe(true);
  });

  it('คำที่ความหมายต่างกันถือว่าผิด', () => {
    expect(checkWord3000Answer(words[0], 'big', words)).toBe(false);
    expect(checkWord3000Answer(words[0], '', words)).toBe(false);
  });
});

describe('toWord3000Question', () => {
  it('ไม่ส่งคำเฉลยไปให้หน้าเว็บ', () => {
    const q = toWord3000Question({ id: 5, word: 'apple', pos: 'noun', level: 'A1', meaning: 'แอปเปิล' });
    expect(q).toEqual({ id: 5, level: 'A1', pos: 'noun', meaning: 'แอปเปิล', hint: 'a _ _ _ _' });
    expect(JSON.stringify(q)).not.toContain('apple');
  });
});
