'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Role } from '@/lib/types';
import { Avatar } from '@/components/ui/primitives';
import { avatarUrl } from '@/lib/format';
import { accountLinks } from './accountLinks';

/**
 * The account menu behind the avatar.
 *
 * The five tabs are fixed by the brief and never change, which is right for the
 * things a tutor does every day but wrong for the things they do once a month —
 * plan, profile, password, sign out. Burying those inside Growth makes them
 * unfindable: nobody looking for "My Plan" guesses "Growth".
 *
 * So they live here, in the same place the Blade dashboard put them, and the
 * tab bar stays five items wide.
 */
export function AccountMenu({
  name,
  subtitle,
  avatar,
  role,
  userId,
}: {
  name: string | null;
  subtitle: string | null;
  avatar: string | null;
  role: Role;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  // Close on an outside click or Escape, the way every menu is expected to.
  useEffect(() => {
    if (!open) return;

    const onClick = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = accountLinks(role, userId, site);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-w-0 items-center gap-3 rounded-card px-1 py-1 text-left transition hover:bg-canvas"
      >
        <Avatar src={avatarUrl(avatar)} name={name} size={36} />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-navy">
            {name ?? 'Your account'}
          </span>
          {subtitle && <span className="block truncate text-xs text-slate">{subtitle}</span>}
        </span>
        <span aria-hidden className="text-xs text-slate">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-1 w-64 animate-slide-up overflow-hidden rounded-card border border-line bg-white shadow-card"
        >
          {items.map((group, index) => (
            <div key={index} className={index > 0 ? 'border-t border-line' : undefined}>
              {group.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    className={`block px-4 py-3 text-sm transition hover:bg-canvas ${
                      item.tone === 'danger' ? 'text-danger' : 'text-ink'
                    }`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-sm text-ink transition hover:bg-canvas"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
