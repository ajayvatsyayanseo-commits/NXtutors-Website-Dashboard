'use client';

import { useState, useTransition } from 'react';
import { reportTutorNoShow } from '@/lib/actions';
import { Button } from '@/components/ui/primitives';

/**
 * "My tutor did not turn up."
 *
 * Until this existed the only button a family had on an empty evening was
 * Cancel — which, inside the free window, charged them half the fee and paid it
 * to the tutor who had not arrived. The outcome here is the one the brief
 * writes down: the whole fee comes back and the pack gains the class.
 *
 * It asks once before it fires. A no-show is an accusation as well as a refund,
 * and it is recorded against the tutor's reliability score.
 */
export function NoShowPanel({ sessionId, tutorName }: { sessionId: string; tutorName?: string | null }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <div className="rounded-card border border-line bg-white p-4">
        <p className="text-sm font-semibold text-ink">Nobody turned up?</p>
        <p className="mt-1 text-sm text-slate">
          If {tutorName ?? 'your tutor'} did not arrive, tell us and we will put the fee back in
          your balance and add the class back to your pack.
        </p>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-accent underline"
          onClick={() => setConfirming(true)}
        >
          My tutor did not turn up
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-danger/30 bg-white p-4">
      <p className="text-sm font-semibold text-ink">
        Record this class as a no-show?
      </p>
      <p className="mt-1 text-sm text-slate">
        The full fee goes back to your balance and the class is added back to your pack. It also
        counts against {tutorName ?? 'your tutor'}&rsquo;s reliability score, so only do this if
        they really did not arrive.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await reportTutorNoShow(sessionId);
              if (!result.ok) setError(result.message ?? 'Try again in a moment.');
            })
          }
        >
          {pending ? 'Recording…' : 'Yes, they did not arrive'}
        </Button>
        <Button tone="ghost" onClick={() => setConfirming(false)}>
          Not now
        </Button>
      </div>
    </div>
  );
}
