import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * The small shared pieces: buttons, pills, chips, meters, avatars and the
 * loading, empty and error states.
 *
 * Empty and error states are first-class components rather than an afterthought
 * in each screen, because the brief makes "blank white" a bug and every screen
 * has to ship all three states.
 */

// ------------------------------------------------------------------- buttons

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

const TONE: Record<ButtonTone, string> = {
  primary: 'bg-navy text-white hover:bg-navy/90 active:bg-navy',
  secondary: 'border border-line bg-white text-ink hover:bg-canvas',
  ghost: 'text-accent hover:bg-accent-soft/60',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger/5',
};

const BUTTON_BASE =
  'inline-flex min-h-touch items-center justify-center gap-2 rounded-card px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function Button({
  children,
  tone = 'primary',
  full = false,
  type = 'button',
  ...rest
}: {
  children: ReactNode;
  tone?: ButtonTone;
  full?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`${BUTTON_BASE} ${TONE[tone]} ${full ? 'w-full' : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  tone = 'primary',
  full = false,
  external = false,
}: {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  full?: boolean;
  external?: boolean;
}) {
  const className = `${BUTTON_BASE} ${TONE[tone]} ${full ? 'w-full' : ''}`;

  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

// --------------------------------------------------------------------- pills

export type PillTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';

const PILL_TONE: Record<PillTone, string> = {
  neutral: 'bg-canvas text-slate',
  accent: 'bg-accent-soft text-accent',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  danger: 'bg-danger/10 text-danger',
};

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: PillTone }) {
  return (
    <span className={`inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-medium ${PILL_TONE[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Session status, with the same colour meaning everywhere it appears.
 *
 * The colour is shared but the wording is not: a checked-out class is
 * "awaiting your confirmation" to the parent who has to act on it, and
 * "waiting for the family" to the tutor who is waiting on them. Showing one
 * side the other's sentence tells them to do something they cannot do.
 */
export function StatusPill({
  status,
  audience = 'student',
}: {
  status: string;
  audience?: 'student' | 'tutor';
}) {
  const map: Record<string, { label: string; tone: PillTone }> = {
    scheduled: { label: 'Scheduled', tone: 'neutral' },
    checked_in: { label: 'In class', tone: 'accent' },
    checked_out: {
      label: audience === 'tutor' ? 'Waiting for the family' : 'Awaiting your confirmation',
      tone: 'warn',
    },
    confirmed: { label: 'Confirmed', tone: 'ok' },
    disputed: { label: 'Disputed', tone: 'danger' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
    no_show: { label: 'No show', tone: 'danger' },
    open: { label: 'To do', tone: 'warn' },
    submitted: { label: 'Submitted', tone: 'accent' },
    marked: { label: 'Marked', tone: 'ok' },
    offered: { label: 'New', tone: 'accent' },
    viewed: { label: 'Opened', tone: 'neutral' },
    contacted: { label: 'Replied', tone: 'ok' },
    rejected: { label: 'Declined', tone: 'neutral' },
    approved: { label: 'Approved', tone: 'ok' },
    pending: { label: 'In review', tone: 'warn' },
    missing: { label: 'Not uploaded', tone: 'neutral' },
  };

  const entry = map[status] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' as PillTone };

  return <Pill tone={entry.tone}>{entry.label}</Pill>;
}

export function Chip({
  children,
  selected = false,
}: {
  children: ReactNode;
  selected?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-chip border px-3 py-1.5 text-xs ${
        selected ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-white text-slate'
      }`}
    >
      {children}
    </span>
  );
}

// -------------------------------------------------------------------- meters

/**
 * A meter bar. The remaining count leads, because that is the number a user
 * acts on; the limit is context.
 */
export function MeterBar({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}) {
  const percent = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const empty = remaining !== null && remaining <= 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-slate">{label}</span>
        <span className={`text-sm font-semibold ${empty ? 'text-danger' : 'text-ink'}`}>
          {limit === null ? 'Unlimited' : `${remaining ?? 0} left`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-chip bg-canvas">
        <div
          className={`h-full rounded-chip transition-all ${empty ? 'bg-danger' : 'bg-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {limit !== null && (
        <p className="mt-1 text-xs text-muted">
          {used} of {limit} used
        </p>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- avatar

export function Avatar({
  src,
  name,
  size = 40,
}: {
  src: string | null;
  name: string | null;
  size?: number;
}) {
  const letters = (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-chip object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-chip bg-accent-soft text-sm font-semibold text-accent"
      style={{ width: size, height: size }}
    >
      {letters}
    </span>
  );
}

// -------------------------------------------------------------- page states

/**
 * Skeletons, not spinners: the layout is already correct while the data is in
 * flight, so nothing jumps when it lands.
 */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`relative overflow-hidden rounded-card bg-canvas ${className}`} style={style}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <Skeleton className="h-3 w-24" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white px-4 py-10 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-slate">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Errors never blame the user, always offer the next action, and always carry
 * the WhatsApp fallback with enough context for support to pick it up.
 */
export function ErrorState({
  screen,
  detail,
}: {
  screen: string;
  detail?: string;
}) {
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  return (
    <div className="rounded-card border border-danger/30 bg-white px-4 py-8 text-center">
      <p className="text-base font-semibold text-ink">Something went wrong on our side.</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate">
        {detail ?? 'Try again, or message us on WhatsApp — we reply fast.'}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <ButtonLink
          href={`https://wa.me/?text=${encodeURIComponent(`Problem on the ${screen} screen`)}`}
          tone="secondary"
          external
        >
          Chat on WhatsApp
        </ButtonLink>
        <ButtonLink href={`${site}/contact`} tone="ghost" external>
          Other ways to reach us
        </ButtonLink>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- upgrade

/**
 * The only upgrade surface there is: inline, where the action was attempted,
 * naming the exact plan that unblocks it. No banners, no modals on load.
 */
export function InlineUpgrade({
  meterLabel,
  plan,
  resetAt,
}: {
  meterLabel: string;
  plan?: string | null;
  resetAt?: string | null;
}) {
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  return (
    <div className="rounded-card border border-accent/40 bg-accent-soft/40 p-4">
      <p className="text-sm font-semibold text-ink">
        You have used all of your {meterLabel.toLowerCase()}.
      </p>
      <p className="mt-1 text-sm text-slate">
        {plan
          ? `${plan} adds more straight away.`
          : 'They reset at the start of your next cycle.'}
        {resetAt && ` Resets ${new Date(resetAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`}
      </p>
      <div className="mt-3">
        <ButtonLink href={`${site}/pricing`} tone="primary" external>
          {plan ? `Upgrade to ${plan}` : 'See plans'}
        </ButtonLink>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- layout

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-navy">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** A labelled number. Used wherever the brief asks for a counter with a source. */
export function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'ok' | 'warn' | 'danger';
}) {
  const colour = {
    default: 'text-navy',
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-danger',
  }[tone];

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${colour}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate">{hint}</p>}
    </div>
  );
}
