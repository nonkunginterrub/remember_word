'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { api, getErrorMessage, useLoginMutation, useRegisterMutation } from '@/store/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { credentialsSchema, type Credentials } from '@/lib/validators';

type Mode = 'login' | 'register';

const TEXT: Record<Mode, { title: string; submit: string; switchText: string; switchLabel: string; switchHref: string }> = {
  login: {
    title: 'เข้าสู่ระบบ',
    submit: 'เข้าสู่ระบบ',
    switchText: 'ยังไม่มีบัญชี?',
    switchLabel: 'สมัครสมาชิก',
    switchHref: '/register',
  },
  register: {
    title: 'สมัครสมาชิก',
    submit: 'สมัครสมาชิก',
    switchText: 'มีบัญชีอยู่แล้ว?',
    switchLabel: 'เข้าสู่ระบบ',
    switchHref: '/login',
  },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  const text = TEXT[mode];
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof credentialsSchema>, unknown, Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: Credentials) {
    try {
      await (mode === 'login' ? login(values) : register(values)).unwrap();
      dispatch(api.util.resetApiState()); // ล้าง cache ของผู้ใช้คนก่อน
      router.replace('/');
    } catch (err) {
      setError('root', { message: getErrorMessage(err) });
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1 className="auth-title">📚 Remember Word</h1>
        <p className="muted">ทบทวนคำศัพท์วันละ 10 คำ ไม่ให้ลืม</p>
        <h2>{text.title}</h2>

        <label className="field">
          <span>อีเมล</span>
          <input type="email" autoComplete="email" {...field('email')} />
          {errors.email && <small className="error">{errors.email.message}</small>}
        </label>

        <label className="field">
          <span>รหัสผ่าน</span>
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            {...field('password')}
          />
          {errors.password && <small className="error">{errors.password.message}</small>}
        </label>

        {errors.root && <p className="alert alert-error">{errors.root.message}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังดำเนินการ...' : text.submit}
        </button>

        <p className="muted center">
          {text.switchText} <Link href={text.switchHref}>{text.switchLabel}</Link>
        </p>
      </form>
    </div>
  );
}
