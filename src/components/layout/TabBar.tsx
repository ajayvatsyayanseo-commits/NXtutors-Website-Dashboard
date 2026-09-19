'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Five tabs, labels always visible, in the same order at every breakpoint.
 *
 * Icon-only tabs are deliberately not an option: support staff talk families
 * and tutors through this app over the phone, and "tap Learn" only works if the
 * word Learn is on the screen. For the same reason the order never changes
 * between mobile and desktop — it becomes a left rail, not a different menu.
 */

export type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function TabBar({
  tabs,
  secondary = [],
}: {
  tabs: Tab[];
  /**
   * The once-a-month items — plan, profile, password, sign out. They are in the
   * account menu on every screen size; on a desktop rail there is room to list
   * them outright, so nobody has to open a menu to discover the app has them.
   */
  secondary?: Array<Array<{ label: string; href: string; external?: boolean; tone?: 'danger' }>>;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <>
      {/* Mobile: bottom bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-2xl">
          {tabs.map((tab) => (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive(tab.href) ? 'page' : undefined}
                className={`flex h-tab flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  isActive(tab.href) ? 'text-accent' : 'text-slate'
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop and tablet landscape: the same five items as a left rail */}
      <nav
        aria-label="Main"
        className="sticky top-16 hidden h-fit w-56 shrink-0 md:block"
      >
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={isActive(tab.href) ? 'page' : undefined}
                className={`flex min-h-touch items-center gap-3 rounded-card px-3 text-sm font-medium transition ${
                  isActive(tab.href)
                    ? 'bg-accent-soft text-accent'
                    : 'text-slate hover:bg-white hover:text-ink'
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>

        {secondary.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Your account
            </p>

            <ul className="mt-2 space-y-0.5">
              {secondary.flat().map((item) =>
                item.external ? (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className={`flex min-h-touch items-center rounded-card px-3 text-sm transition hover:bg-white ${
                        item.tone === 'danger' ? 'text-danger' : 'text-slate hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex min-h-touch items-center rounded-card px-3 text-sm text-slate transition hover:bg-white hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}
