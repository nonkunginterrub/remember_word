import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UiState {
  toasts: Toast[];
}

const initialState: UiState = { toasts: [] };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(message: string, type: ToastType = 'success') {
        return { payload: { id: nanoid(), message, type } };
      },
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;

export const selectToasts = (state: RootState) => state.ui.toasts;
