/**
 * Formatting for an Indian audience, in one place.
 *
 * Money arrives as integer paise and is rendered in the Indian grouping
 * (Rs 1,20,000, not Rs 120,000). Times arrive as UTC and are rendered in IST,
 * because every user of this product is in one timezone and showing them
 * anything else would be a bug they could not diagnose.
 */

const IST = 'Asia/Kolkata';

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

/** Rs 1,320 — paise in, rupees out, never a fraction of a rupee on screen. */
export function money(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return '—';
  return `Rs ${rupeeFormatter.format(Math.round(paise / 100))}`;
}

/** "Rs 900–1,200" for a budget band, which is how families think about fees. */
export function moneyRange(min: number | null, max: number | null): string {
  if (!min && !max) return 'Not set';
  if (min && max) return `Rs ${rupeeFormatter.format(min / 100)}–${rupeeFormatter.format(max / 100)}`;
  return money(min ?? max);
}

export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: IST,
  });
}

export function timeLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
}

export function dateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  return `${dateLabel(iso)} · ${timeLabel(iso)}`;
}

/**
 * "Today 5:00 PM", "Tomorrow 5:00 PM", "Sat 12 Sep · 5:00 PM".
 *
 * Relative for the two days people actually plan around, absolute after that:
 * "in 9 days" is not something anyone can act on.
 */
export function whenLabel(iso: string | null | undefined): string {
  if (!iso) return '—';

  const date = new Date(iso);
  const today = istDateKey(new Date());
  const target = istDateKey(date);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (target === today) return `Today ${timeLabel(iso)}`;
  if (target === istDateKey(tomorrow)) return `Tomorrow ${timeLabel(iso)}`;
  if (target === istDateKey(yesterday)) return `Yesterday ${timeLabel(iso)}`;

  return dateTimeLabel(iso);
}

function istDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: IST });
}

/** "in 2h 15m" / "in 40 min" / "40 min ago" — the countdown on expiring things. */
export function countdown(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '';

  const past = minutes < 0;
  const abs = Math.abs(minutes);

  const text =
    abs < 60
      ? `${abs} min`
      : abs < 60 * 24
        ? `${Math.floor(abs / 60)}h ${abs % 60}m`
        : `${Math.floor(abs / (60 * 24))}d`;

  return past ? `${text} ago` : `in ${text}`;
}

/** "mon_evening" as it is written in a lead, made readable. */
export function slotLabel(slot: string): string {
  const [day, part] = slot.split('_');
  const days: Record<string, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
    fri: 'Fri', sat: 'Sat', sun: 'Sun',
  };
  return [days[day] ?? day, part].filter(Boolean).join(' ');
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Relative time for notification and activity lists. */
export function ago(iso: string | null | undefined): string {
  if (!iso) return '';

  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))}d ago`;

  return dateLabel(iso);
}

/**
 * Avatars are stored as bare filenames on the Laravel public disk; a few rows
 * already hold a full URL. Both have to work, and a missing one has to return
 * something rather than a broken image.
 */
export function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;

  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';
  return `${origin}/uploads/${avatar}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
