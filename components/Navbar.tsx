'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, useGetMeQuery, useLogoutMutation } from '@/store/apiSlice';
import { useAppDispatch } from '@/store/hooks';
import { resetQuiz } from '@/store/quizSlice';

const LINKS = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/words', label: 'คลังคำ' },
  { href: '/quiz', label: 'ทายคำวันนี้' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const { data: user } = useGetMeQuery(undefined, { skip: isAuthPage });
  const [logout, { isLoading }] = useLogoutMutation();

  if (isAuthPage) return null;

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      dispatch(api.util.resetApiState());
      dispatch(resetQuiz());
      router.replace('/login');
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          📚 Remember Word
        </Link>
        <nav className="nav-links">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={active ? 'nav-link active' : 'nav-link'}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="nav-user">
          {user && <span className="nav-email">{user.email}</span>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout} disabled={isLoading}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
