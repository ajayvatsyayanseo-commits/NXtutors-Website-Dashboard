'use client';

import { useState, useTransition } from 'react';
import type { ActionResult } from '@/lib/actions';
import { Button, InlineUpgrade } from './primitives';

/**
 * A button that runs a server action and reports the outcome where it happened.
 *
 * A meter refusing the action is not treated as an error: it renders the inline
 * upgrade naming the plan that unblocks it, next to the control the user
 * pressed. That is the only upgrade surface in the product — no banners, no
 * modals on load.
 */
export function ActionButton({
  action,
  children,
  tone = 'primary',
  full = false,
  confirm,
  successNote,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  full?: boolean;
  /** Shown before running, for anything involving money or an irreversible step. */
  confirm?: string;
  successNote?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const run = () => {
    if (confirm && !window.confirm(confirm)) return;

    startTransition(async () => {
      setResult(await action());
    });
  };

  const gate = result?.code === 'meter_exhausted'
    ? (result.meta?.gate as
        | { label: string; upgrade_plan: string | null; reset_at: string | null }
        | undefined)
    : undefined;

  return (
    <div className={full ? 'w-full' : undefined}>
      <Button tone={tone} full={full} disabled={pending} onClick={run}>
        {pending ? 'Working…' : children}
      </Button>

      {gate && (
        <div className="mt-3">
          <InlineUpgrade
            meterLabel={gate.label}
            plan={gate.upgrade_plan}
            resetAt={gate.reset_at}
          />
        </div>
      )}

      {result && !result.ok && !gate && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {result.message}
        </p>
      )}

      {result?.ok && successNote && result.message && (
        <p role="status" className="mt-2 text-sm text-ok">
          {result.message}
        </p>
      )}
    </div>
  );
}
