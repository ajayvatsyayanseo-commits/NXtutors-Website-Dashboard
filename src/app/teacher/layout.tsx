import { requireApi } from '@/lib/api';
import type { Me } from '@/lib/types';
import { AppShell } from '@/components/layout/AppShell';
import { CalendarIcon, HomeIcon, InboxIcon, ToolIcon, TrendIcon } from '@/components/layout/icons';
import { redirect } from 'next/navigation';

/**
 * The tutor app shell: Home, Leads, Students, Studio, Growth.
 */
const TABS = [
  { href: '/teacher/dashboard', label: 'Home', icon: <HomeIcon /> },
  { href: '/teacher/leads', label: 'Leads', icon: <InboxIcon /> },
  { href: '/teacher/students', label: 'Students', icon: <CalendarIcon /> },
  { href: '/teacher/studio', label: 'Studio', icon: <ToolIcon /> },
  { href: '/teacher/growth', label: 'Growth', icon: <TrendIcon /> },
];

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const { data: me } = await requireApi<Me>('/me');

  if (me.role !== 'tutor') {
    redirect('/user/dashboard');
  }

  const subtitle = [me.entitlements.plan.name, me.user.city].filter(Boolean).join(' · ');

  return (
    <AppShell
      tabs={TABS}
      role="tutor"
      name={me.user.name}
      subtitle={subtitle}
      avatar={me.user.avatar}
      entitlements={me.entitlements}
      unread={me.unread_notifications}
      userId={me.user.user_id}
    >
      {children}
    </AppShell>
  );
}
