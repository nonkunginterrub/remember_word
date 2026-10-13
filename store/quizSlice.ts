import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AnswerResult } from '@/types';
import type { RootState } from './store';

export type QuizStatus = 'idle' | 'playing' | 'revealed' | 'finished';
export type QuizMode = 'type' | 'choice'; // 'choice' (4 ตัวเลือก) จะเพิ่มในเฟส 2

// state ของรอบการทายคำที่กำลังเล่นอยู่ (ข้อมูลคำถามมาจาก RTK Query)
export interface QuizState {
  setId: number | null;
  status: QuizStatus;
  currentIndex: number;
  total: number;
  results: AnswerResult[];
  mode: QuizMode;
}

const initialState: QuizState = {
  setId: null,
  status: 'idle',
  currentIndex: 0,
  total: 0,
  results: [],
  mode: 'type',
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    /** เริ่มรอบ (หรือทำต่อจากที่ค้างไว้) โดยใช้คำตอบที่ server บันทึกไว้แล้ว */
    startQuiz(state, action: PayloadAction<{ setId: number; total: number; results?: AnswerResult[] }>) {
      const { setId, total, results = [] } = action.payload;
      state.setId = setId;
      state.total = total;
      state.results = results;
      state.currentIndex = results.length;
      state.status = results.length >= total ? 'finished' : 'playing';
    },
    answerRecorded(state, action: PayloadAction<AnswerResult>) {
      if (state.status !== 'playing') return;
      state.results.push(action.payload);
      state.status = 'revealed';
    },
    nextQuestion(state) {
      if (state.status !== 'revealed') return;
      state.currentIndex += 1;
      state.status = state.currentIndex >= state.total ? 'finished' : 'playing';
    },
    setMode(state, action: PayloadAction<QuizMode>) {
      state.mode = action.payload;
    },
    resetQuiz() {
      return initialState;
    },
  },
});

export const { startQuiz, answerRecorded, nextQuestion, setMode, resetQuiz } = quizSlice.actions;
export default quizSlice.reducer;

// ---------- selectors ----------
export const selectQuiz = (state: RootState) => state.quiz;
export const selectScore = (state: RootState) => state.quiz.results.filter((r) => r.isCorrect).length;
export const selectLastResult = (state: RootState) => state.quiz.results.at(-1) ?? null;
