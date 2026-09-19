import type { ReactNode } from 'react';

/**
 * The card: a label, a body and optional actions.
 *
 * Every Home card is one of these, which is what lets the card order stay fixed
 * and absent cards collapse without the layout shifting after load.
 */
export function Card({
  label,
  action,
  children,
  tone = 'default',
  className = '',
}: {
  label?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'accent' | 'warn' | 'danger';
  className?: string;
}) {
  const toneRing = {
    default: 'border-line',
    accent: 'border-accent/40',
    warn: 'border-warn/40',
    danger: 'border-danger/40',
  }[tone];

  return (
    <section className={`rounded-card border bg-white p-4 shadow-card ${toneRing} ${className}`}>
      {(label || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {label && (
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function CardRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0 ${className}`}>
      {children}
    </div>
  );
}
