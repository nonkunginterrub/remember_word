'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast, selectToasts, type Toast as ToastData } from '@/store/uiSlice';

function Toast({ toast }: { toast: ToastData }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 3000);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      {toast.message}
    </div>
  );
}

export default function Toaster() {
  const toasts = useAppSelector(selectToasts);
  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
