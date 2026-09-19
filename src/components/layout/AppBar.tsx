import Link from 'next/link';
import type { Entitlements, Role } from '@/lib/types';
import { BellIcon } from './icons';
import { AccountMenu } from './AccountMenu';

/**
 * The top bar: who you are, what your meters say, and what is unread.
 *
 * The credit chip is here rather than buried in Account because the meters are
 * the product — a family that cannot see their remaining contacts has no way to
 * plan around them, and a tutor who cannot see lead views left will burn them
 * without noticing.
 */
export function AppBar({
  name,
  subtitle,
  avatar,
  entitlements,
  unread,
  role,
  userId,
}: {
  name: string | null;
  subtitle: string | null;
  avatar: string | null;
  entitlements: Entitlements;
  unread: number;
  role: Role;
  userId: string;
}) {
  const accountHref = role === 'tutor' ? '/teacher/growth' : '/user/account';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <AccountMenu
          name={name}
          subtitle={subtitle}
          avatar={avatar}
          role={role}
          userId={userId}
        />

        <div className="ml-auto flex items-center gap-2">
          <CreditChip entitlements={entitlements} href={accountHref} />

          <Link
            href={`${accountHref}#notifications`}
            className="relative flex h-touch w-touch items-center justify-center rounded-chip text-slate transition hover:bg-canvas"
            aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-chip bg-danger px-1 text-[10px] font-semibold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * "AI 120 · Contacts 7" for a family, "Leads 22 left" for a tutor — taken
 * straight from the meters the server returned, never recomputed here.
 */
function CreditChip({ entitlements, href }: { entitlements: Entitlements; href: string }) {
  const meters = entitlements.meters.filter((m) => m.limit !== 0);

  if (meters.length === 0) {
    return (
      <Link
        href={href}
        className="hidden rounded-chip border border-line px-3 py-1.5 text-xs font-medium text-slate transition hover:bg-canvas sm:inline-flex"
      >
        {entitlements.plan.name}
      </Link>
    );
  }

  const exhausted = meters.some((m) => m.remaining !== null && m.remaining <= 0);

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-chip border px-3 py-1.5 text-xs font-medium transition ${
        exhausted
          ? 'border-danger/40 bg-danger/5 text-danger'
          : 'border-accent/40 bg-accent-soft/60 text-accent hover:bg-accent-soft'
      }`}
    >
      {meters.map((meter, index) => (
        <span key={meter.feature}>
          {index > 0 && <span className="mr-2 text-line">|</span>}
          {shortLabel(meter.label)} {meter.limit === null ? '∞' : (meter.remaining ?? 0)}
        </span>
      ))}
    </Link>
  );
}

function shortLabel(label: string): string {
  return label.replace('AI credits', 'AI').replace('Tutor contacts', 'Contacts').replace('Lead views', 'Leads');
}
