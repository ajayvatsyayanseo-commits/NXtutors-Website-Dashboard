import type { Role } from '@/lib/types';

/**
 * The secondary navigation: the things a Blade sidebar listed outright and the
 * five-tab shell has no room for — plan, profile, password, sign out.
 *
 * Deliberately a plain module with no 'use client' directive, because both
 * sides need it: the account menu is a client component, and the desktop rail
 * is rendered on the server. A function exported from a client module cannot be
 * called during a server render, so keeping it here is what lets one definition
 * feed both and stops the menu and the rail drifting apart.
 */
export type MenuItem = {
  label: string;
  href: string;
  external?: boolean;
  tone?: 'danger';
};

export function accountLinks(role: Role, userId: string, site: string): MenuItem[][] {
  if (role === 'tutor') {
    return [
      [
        { label: 'My plan and credits', href: '/teacher/growth?tab=plan' },
        { label: 'Profile', href: '/teacher/growth?tab=profile' },
        { label: 'Messages', href: '/teacher/growth?tab=messages' },
      ],
      [
        { label: 'Earnings and payouts', href: '/teacher/growth?tab=earnings' },
        { label: 'Verification', href: '/teacher/growth?tab=verification' },
        { label: 'Reviews', href: '/teacher/growth?tab=reviews' },
      ],
      [
        { label: 'Share your public page', href: `${site}/teacher/${userId}`, external: true },
        { label: 'Change password', href: '/teacher/growth?tab=profile' },
      ],
      [{ label: 'Sign out', href: `${site}/logout`, external: true, tone: 'danger' }],
    ];
  }

  return [
    [
      { label: 'My plan and credits', href: '/user/account?tab=plan' },
      { label: 'Wallet', href: '/user/account?tab=wallet' },
      { label: 'Messages', href: '/user/account?tab=messages' },
    ],
    [
      { label: 'Profile', href: '/user/account?tab=profile' },
      { label: 'Notifications', href: '/user/account?tab=notifications' },
      { label: 'Change password', href: '/user/account?tab=profile' },
    ],
    [
      { label: 'Find a tutor', href: '/user/tutors/new' },
      { label: 'Help', href: '/user/account?tab=help' },
    ],
    [{ label: 'Sign out', href: `${site}/logout`, external: true, tone: 'danger' }],
  ];
}
