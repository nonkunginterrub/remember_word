// type ที่ใช้ร่วมกันระหว่าง API และหน้าเว็บ

export interface User {
  id: number;
  email: string;
}

export interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  box: number;
  nextReview: string | null; // YYYY-MM-DD, null = คำใหม่ที่ยังไม่เคยทาย
  correctCount: number;
  wrongCount: number;
  createdAt: string;
}

export interface QuestionAnswer {
  userAnswer: string;
  isCorrect: boolean;
  correctWord: string;
}

export interface AnswerResult extends QuestionAnswer {
  wordId: number;
}

export interface Question {
  wordId: number;
  meaning: string;
  example: string | null; // คำศัพท์ในประโยคถูกซ่อนเป็น _____
  hint: string;
  answer: QuestionAnswer | null; // null = ยังไม่ได้ตอบ (ไม่ส่งเฉลย)
}

export interface TodayQuiz {
  empty: boolean;
  id: number | null;
  date: string;
  total: number;
  finished: boolean;
  score: number | null;
  questions: Question[];
}

export type TodayStatus = 'not_started' | 'in_progress' | 'done';

export interface Stats {
  today: string;
  todayStatus: TodayStatus;
  streak: number;
  totalWords: number;
  newWords: number;
  dueWords: number;
  boxes: { box: number; count: number }[];
  recent: { date: string; score: number; total: number }[];
  mostMissed: { id: number; word: string; meaning: string; wrongCount: number }[];
}

export interface ApiError {
  error: string;
}
