import type { ReactNode } from 'react';
import type { Entitlements, Role } from '@/lib/types';
import { AppBar } from './AppBar';
import { TabBar, type Tab } from './TabBar';
import { accountLinks } from './accountLinks';

/**
 * One shell, two apps.
 *
 * The student and tutor dashboards differ only in their five tabs and what the
 * subtitle says; everything structural — bar, rail, content column, bottom
 * padding for the mobile tab bar — is shared, so a change to spacing or safe
 * areas cannot land in one app and be forgotten in the other.
 */
export function AppShell({
  children,
  tabs,
  name,
  subtitle,
  avatar,
  entitlements,
  unread,
  role,
  userId,
}: {
  children: ReactNode;
  tabs: Tab[];
  name: string | null;
  subtitle: string | null;
  avatar: string | null;
  entitlements: Entitlements;
  unread: number;
  role: Role;
  userId: string;
}) {
  const secondary = accountLinks(role, userId, process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '');

  return (
    <div className="min-h-screen bg-canvas">
      <AppBar
        name={name}
        subtitle={subtitle}
        avatar={avatar}
        entitlements={entitlements}
        unread={unread}
        role={role}
        userId={userId}
      />

      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-4 md:py-6">
        <TabBar tabs={tabs} secondary={secondary} />

        {/* pb-24 on mobile keeps the last card clear of the bottom tab bar */}
        <main className="min-w-0 flex-1 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
