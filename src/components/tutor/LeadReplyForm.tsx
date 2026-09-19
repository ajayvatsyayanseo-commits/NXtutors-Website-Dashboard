'use client';

import { useState, useTransition } from 'react';
import { declineLead, replyToLead } from '@/lib/actions';
import { Button, Chip, Pill } from '@/components/ui/primitives';
import { money } from '@/lib/format';

const DECLINE_REASONS = [
  { key: 'not_my_area', label: 'Not my area' },
  { key: 'slot_clash', label: 'Slot clash' },
  { key: 'budget_too_low', label: 'Budget too low' },
  { key: 'class_not_taught', label: 'I do not teach this class' },
  { key: 'other', label: 'Other' },
];

/**
 * Reply, quote, or decline — the whole lead conversion in one place.
 *
 * The draft is pre-filled and editable, never sent as written. It goes to the
 * family through the platform rather than from the tutor's own number, which is
 * what keeps the thread available if the booking is later disputed.
 *
 * "Budget too low" does not close the lead. It is the one decline a quote can
 * actually answer, so it opens a counter-offer instead.
 */
export function LeadReplyForm({
  matchId,
  draft,
  suggestedRatePaise,
}: {
  matchId: string;
  draft: string;
  suggestedRatePaise: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState(draft);
  const [rate, setRate] = useState(
    suggestedRatePaise ? String(Math.round(suggestedRatePaise / 100)) : '',
  );
  const [mode, setMode] = useState<'reply' | 'decline'>('reply');
  const [declineReason, setDeclineReason] = useState(DECLINE_REASONS[0].key);
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);

  const ratePaise = rate ? Number(rate) * 100 : undefined;

  const send = () => {
    startTransition(async () => {
      setResult(await replyToLead(matchId, body, ratePaise));
    });
  };

  const decline = () => {
    if (declineReason === 'budget_too_low') {
      // Counter-offer rather than a hard decline: the tutor is dropped back
      // into the reply box with the quote focused.
      setMode('reply');
      setResult({
        ok: true,
        message: 'Send a counter-offer instead — change the rate below and reply.',
      });
      return;
    }

    startTransition(async () => {
      setResult(await declineLead(matchId, declineReason));
    });
  };

  if (result?.ok && result.message?.startsWith('Sent')) {
    return (
      <div className="rounded-card border border-ok/40 bg-white p-4">
        <p className="text-sm font-semibold text-ok">{result.message}</p>
        <p className="mt-1 text-sm text-slate">
          The family sees your reply and quote in their app and on WhatsApp. You will be notified
          when they respond.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('reply')}
          className={`rounded-chip px-3 py-1.5 text-sm font-medium ${
            mode === 'reply' ? 'bg-accent-soft text-accent' : 'text-slate'
          }`}
        >
          Reply
        </button>
        <button
          type="button"
          onClick={() => setMode('decline')}
          className={`rounded-chip px-3 py-1.5 text-sm font-medium ${
            mode === 'decline' ? 'bg-canvas text-ink' : 'text-slate'
          }`}
        >
          Not for me
        </button>
      </div>

      {mode === 'reply' ? (
        <>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              Your reply
              <Pill tone="neutral">Draft — edit before sending</Pill>
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-card border border-line p-3 text-sm text-ink"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-medium text-ink">Your rate per class</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-slate">Rs</span>
              <input
                type="number"
                inputMode="numeric"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className="w-32 rounded-card border border-line px-3 py-2 text-sm text-ink"
                placeholder="1100"
              />
            </div>
          </label>

          {ratePaise ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {[8, 12, 16].map((count) => (
                <Chip key={count}>
                  {count} classes · {money(ratePaise * count)}
                </Chip>
              ))}
            </div>
          ) : null}

          {result && !result.ok && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {result.message}
            </p>
          )}

          {result?.ok && result.message && (
            <p role="status" className="mt-3 text-sm text-accent">
              {result.message}
            </p>
          )}

          <div className="mt-4">
            <Button full disabled={pending || body.trim().length === 0} onClick={send}>
              {pending ? 'Sending…' : 'Accept and send reply'}
            </Button>
          </div>

          <p className="mt-3 text-xs text-slate">
            Sent through NXTutors, not from your own number. The family never sees your phone
            number and you never see theirs.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate">
            Tell us why, so the engine stops sending you leads like this one.
          </p>

          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Reason</legend>
            {DECLINE_REASONS.map((option) => (
              <label key={option.key} className="flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="radio"
                  name="decline"
                  checked={declineReason === option.key}
                  onChange={() => setDeclineReason(option.key)}
                  className="h-4 w-4 accent-[#0D9488]"
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          {result && !result.ok && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {result.message}
            </p>
          )}

          <div className="mt-4">
            <Button tone="secondary" full disabled={pending} onClick={decline}>
              {pending ? 'Sending…' : 'Decline this lead'}
            </Button>
          </div>

          <p className="mt-3 text-xs text-slate">
            The family is told the category only, never your wording.
          </p>
        </>
      )}
    </div>
  );
}
