import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Credentials, WordInput } from '@/lib/validators';
import type { AnswerResult, Stats, TodayQuiz, User, Word } from '@/types';

// RTK Query: เรียก API + cache ข้อมูลจาก server
// tags ใช้บอกว่าเมื่อข้อมูลเปลี่ยน ต้องโหลดข้อมูลส่วนไหนใหม่
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Me', 'Word', 'Quiz', 'Stats'],
  endpoints: (build) => ({
    // ---------- auth ----------
    getMe: build.query<User, void>({
      query: () => 'auth/me',
      transformResponse: (res: { user: User }) => res.user,
      providesTags: ['Me'],
    }),
    register: build.mutation<{ user: User }, Credentials>({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
    }),
    login: build.mutation<{ user: User }, Credentials>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<{ ok: true }, void>({
      query: () => ({ url: 'auth/logout', method: 'POST' }),
    }),

    // ---------- words ----------
    getWords: build.query<Word[], string>({
      query: (q) => ({ url: 'words', params: q ? { q } : undefined }),
      transformResponse: (res: { words: Word[] }) => res.words,
      providesTags: ['Word'],
    }),
    addWord: build.mutation<{ word: Word }, WordInput>({
      query: (body) => ({ url: 'words', method: 'POST', body }),
      invalidatesTags: ['Word', 'Stats'],
    }),
    updateWord: build.mutation<{ word: Word }, WordInput & { id: number }>({
      query: ({ id, ...body }) => ({ url: `words/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Word', 'Quiz'],
    }),
    deleteWord: build.mutation<{ ok: true; id: number }, number>({
      query: (id) => ({ url: `words/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Word', 'Stats', 'Quiz'],
    }),

    // ---------- quiz ----------
    getTodayQuiz: build.query<TodayQuiz, void>({
      query: () => 'quiz/today',
      providesTags: ['Quiz'],
    }),
    submitAnswer: build.mutation<AnswerResult, { wordId: number; answer: string }>({
      query: (body) => ({ url: 'quiz/answer', method: 'POST', body }),
      // ไม่ invalidate 'Quiz' ระหว่างทาย เพื่อไม่ให้คำถามโหลดใหม่กลางรอบ
      invalidatesTags: ['Word', 'Stats'],
    }),
    finishQuiz: build.mutation<{ score: number; total: number }, void>({
      query: () => ({ url: 'quiz/finish', method: 'POST' }),
      invalidatesTags: ['Quiz', 'Stats'],
    }),

    // ---------- stats ----------
    getStats: build.query<Stats, void>({
      query: () => 'stats',
      providesTags: ['Stats'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetWordsQuery,
  useAddWordMutation,
  useUpdateWordMutation,
  useDeleteWordMutation,
  useGetTodayQuizQuery,
  useSubmitAnswerMutation,
  useFinishQuizMutation,
  useGetStatsQuery,
} = api;

/** ดึงข้อความ error จากผลลัพธ์ของ RTK Query */
export function getErrorMessage(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && typeof (data as { error?: unknown }).error === 'string') {
      return (data as { error: string }).error;
    }
  }
  return fallback;
}
