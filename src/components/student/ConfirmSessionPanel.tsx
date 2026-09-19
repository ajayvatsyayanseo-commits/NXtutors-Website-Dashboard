'use client';

import { useState, useTransition } from 'react';
import { confirmSession, disputeSession } from '@/lib/actions';
import { Button } from '@/components/ui/primitives';

const REASONS = [
  { key: 'did_not_happen', label: 'The class did not happen' },
  { key: 'late_or_short', label: 'Tutor was late or the class was short' },
  { key: 'wrong_topics', label: 'Not what we agreed to cover' },
  { key: 'quality', label: 'Unhappy with the teaching' },
  { key: 'other', label: 'Something else' },
];

/**
 * Confirm or dispute, with the 24-hour auto-confirm stated up front.
 *
 * The deadline is shown rather than left implicit because silence here moves
 * money: at 24 hours the class auto-confirms and the tutor is paid. A parent
 * has to know that before it happens, not after.
 */
export function ConfirmSessionPanel({
  sessionId,
  autoConfirmsAt,
}: {
  sessionId: string;
  autoConfirmsAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'idle' | 'disputing'>('idle');
  const [reason, setReason] = useState(REASONS[0].key);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const deadline = autoConfirmsAt
    ? new Date(autoConfirmsAt).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      })
    : null;

  const submit = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? 'Try again in a moment.');
    });
  };

  if (mode === 'disputing') {
    return (
      <div className="rounded-card border border-danger/30 bg-white p-4">
        <p className="text-sm font-semibold text-ink">What went wrong?</p>
        <p className="mt-1 text-sm text-slate">
          Payment for this class is held while our team looks at it. We usually reply the same day.
        </p>

        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Reason</legend>
          {REASONS.map((option) => (
            <label key={option.key} className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="radio"
                name="reason"
                value={option.key}
                checked={reason === option.key}
                onChange={() => setReason(option.key)}
                className="h-4 w-4 accent-[#0D9488]"
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <label className="mt-3 block">
          <span className="text-sm text-slate">Anything you want to add (optional)</span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-card border border-line p-3 text-sm text-ink"
            placeholder="What happened, in your own words."
          />
        </label>

        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            tone="danger"
            disabled={pending}
            onClick={() => submit(() => disputeSession(sessionId, reason, detail || undefined))}
          >
            {pending ? 'Sending…' : 'Raise this with NXTutors'}
          </Button>
          <Button tone="ghost" onClick={() => setMode('idle')} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-warn/40 bg-white p-4">
      <p className="text-sm font-semibold text-ink">Did this class happen as recorded?</p>
      {deadline && (
        <p className="mt-1 text-sm text-slate">
          If you do nothing, it confirms automatically on {deadline} and your tutor is paid for it.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => submit(() => confirmSession(sessionId))}>
          {pending ? 'Confirming…' : 'Yes, confirm it'}
        </Button>
        <Button tone="secondary" onClick={() => setMode('disputing')} disabled={pending}>
          Something was wrong
        </Button>
      </div>
    </div>
  );
}
