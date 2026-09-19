import Link from 'next/link';

/**
 * Sub-navigation inside a tab, driven by a query parameter.
 *
 * Links rather than client state on purpose: each view is a server render with
 * its own URL, so a WhatsApp deep link can point at "Learn, progress" directly
 * and the back button behaves the way people expect.
 */
export function Tabs({
  base,
  param = 'tab',
  current,
  items,
}: {
  base: string;
  param?: string;
  current: string;
  items: Array<{ key: string; label: string; badge?: number }>;
}) {
  return (
    <nav className="scroll-row mb-4" aria-label="Section">
      {items.map((item) => {
        const active = item.key === current;

        return (
          <Link
            key={item.key}
            href={`${base}?${param}=${item.key}`}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-chip border px-4 py-2 text-sm font-medium transition ${
              active
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-white text-slate hover:text-ink'
            }`}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-chip px-1.5 text-[11px] font-semibold ${
                  active ? 'bg-accent text-white' : 'bg-canvas text-slate'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
