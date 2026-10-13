import { describe, expect, it } from 'vitest';
import { makeStore } from '@/store/store';
import { answerRecorded, nextQuestion, resetQuiz, selectScore, startQuiz } from '@/store/quizSlice';
import type { AnswerResult } from '@/types';

const result = (wordId: number, isCorrect: boolean): AnswerResult => ({
  wordId,
  userAnswer: 'x',
  isCorrect,
  correctWord: 'x',
});

describe('quizSlice', () => {
  it('เล่นครบรอบ: playing -> revealed -> playing ... -> finished', () => {
    const store = makeStore();
    store.dispatch(startQuiz({ setId: 1, total: 2 }));
    expect(store.getState().quiz.status).toBe('playing');

    store.dispatch(answerRecorded(result(10, true)));
    expect(store.getState().quiz.status).toBe('revealed');

    store.dispatch(nextQuestion());
    expect(store.getState().quiz).toMatchObject({ status: 'playing', currentIndex: 1 });

    store.dispatch(answerRecorded(result(11, false)));
    store.dispatch(nextQuestion());
    expect(store.getState().quiz.status).toBe('finished');
    expect(selectScore(store.getState())).toBe(1);
  });

  it('ทำต่อจากที่ค้างไว้ตามคำตอบที่ server บันทึก', () => {
    const store = makeStore();
    store.dispatch(startQuiz({ setId: 1, total: 3, results: [result(1, true), result(2, true)] }));
    expect(store.getState().quiz).toMatchObject({ status: 'playing', currentIndex: 2 });
    expect(selectScore(store.getState())).toBe(2);
  });

  it('ไม่รับคำตอบซ้ำในข้อที่เฉลยแล้ว และข้ามข้อไม่ได้ถ้ายังไม่ตอบ', () => {
    const store = makeStore();
    store.dispatch(startQuiz({ setId: 1, total: 2 }));
    store.dispatch(nextQuestion()); // ยังไม่ตอบ -> ไม่เปลี่ยน
    expect(store.getState().quiz.currentIndex).toBe(0);

    store.dispatch(answerRecorded(result(1, true)));
    store.dispatch(answerRecorded(result(1, false))); // ซ้ำ -> ไม่นับ
    expect(store.getState().quiz.results).toHaveLength(1);
  });

  it('resetQuiz กลับสู่ค่าเริ่มต้น', () => {
    const store = makeStore();
    store.dispatch(startQuiz({ setId: 5, total: 1 }));
    store.dispatch(resetQuiz());
    expect(store.getState().quiz).toMatchObject({ setId: null, status: 'idle', results: [] });
  });
});
