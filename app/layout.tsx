import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import StoreProvider from '@/store/StoreProvider';
import Navbar from '@/components/Navbar';
import Toaster from '@/components/Toaster';
import './globals.css';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Remember Word — ทบทวนคำศัพท์วันละ 10 คำ',
  description: 'บันทึกคำศัพท์และทายคำวันละ 10 คำด้วยระบบทบทวนแบบ Leitner',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        {/* Redux store สร้างตอน request (มีค่าสุ่มภายใน) จึงต้องอยู่ใน Suspense ตามกติกา Cache Components */}
        <Suspense fallback={<p className="muted center page-loading">กำลังโหลด...</p>}>
          <StoreProvider>
            <Navbar />
            <main className="container">{children}</main>
            <Toaster />
          </StoreProvider>
        </Suspense>
      </body>
    </html>
  );
}
