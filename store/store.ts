import { configureStore } from '@reduxjs/toolkit';
import { api } from './apiSlice';
import quizReducer from './quizSlice';
import uiReducer from './uiSlice';

// สร้าง store ใหม่ทุกครั้ง (ต่อ request ฝั่ง server / ครั้งเดียวต่อแท็บฝั่ง browser)
// ห้ามใช้ store แบบตัวแปร global เพราะ server จะแชร์ state ข้ามผู้ใช้
export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      quiz: quizReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
