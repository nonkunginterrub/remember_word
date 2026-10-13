'use client';

import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store';

export default function StoreProvider({ children }: { children: ReactNode }) {
  // useState(initializer) สร้าง store เพียงครั้งเดียวตลอดอายุของ component
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
