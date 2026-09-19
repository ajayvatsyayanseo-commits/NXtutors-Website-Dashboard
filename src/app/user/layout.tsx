import { requireApi } from '@/lib/api';
import type { Me } from '@/lib/types';
import { AppShell } from '@/components/layout/AppShell';
import { BookIcon, HomeIcon, SparkIcon, UserIcon, UsersIcon } from '@/components/layout/icons';
import { redirect } from 'next/navigation';

/**
 * The student/parent app shell.
 *
 * Identity is resolved once here and the five tabs never change: Home, Learn,
 * Tutors, Ask AI, Account, in that order, at every breakpoint.
 */
const TABS = [
  { href: '/user/dashboard', label: 'Home', icon: <HomeIcon /> },
  { href: '/user/learn', label: 'Learn', icon: <BookIcon /> },
  { href: '/user/tutors', label: 'Tutors', icon: <UsersIcon /> },
  { href: '/user/ask', label: 'Ask AI', icon: <SparkIcon /> },
  { href: '/user/account', label: 'Account', icon: <UserIcon /> },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: me } = await requireApi<Me>('/me');

  // A tutor who lands here is sent to their own app rather than shown an
  // empty student dashboard they will read as broken data.
  if (me.role !== 'student') {
    redirect('/teacher/dashboard');
  }

  const subtitle = [me.user.for_class && `Class ${me.user.for_class}`, me.user.city]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppShell
      tabs={TABS}
      role="student"
      name={me.user.name}
      subtitle={subtitle || me.entitlements.plan.name}
      avatar={me.user.avatar}
      entitlements={me.entitlements}
      unread={me.unread_notifications}
      userId={me.user.user_id}
    >
      {children}
    </AppShell>
  );
}
