import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

// ใช้ hooks เหล่านี้แทน useDispatch / useSelector เพื่อให้ได้ type ของ store
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
