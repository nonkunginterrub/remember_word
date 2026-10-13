import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ — Remember Word' };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
