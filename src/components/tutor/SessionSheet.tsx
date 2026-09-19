'use client';

import { useState, useTransition } from 'react';
import { checkInSession, checkOutSession } from '@/lib/actions';
import { Button, Chip, Pill } from '@/components/ui/primitives';

/**
 * The check-in and check-out sheet: the two minutes of tutor time that produce
 * the parent's update, the attendance record and the payment.
 *
 * Check-in offers the methods in the order the brief ranks them. Parent OTP is
 * primary because it works indoors, where GPS does not; the geo-fence is
 * secondary; "manual" is allowed — a tutor standing in a doorway with no signal
 * still has to start the class — but it is labelled as needing the parent's
 * confirmation, so nobody reaches for it by default.
 *
 * Check-out will not submit without topics. A class with no record of what was
 * covered gives the progress heatmap nothing and the parent nothing to read.
 */

const SUGGESTED_TOPICS = [
  'Revision',
  'New chapter',
  'Practice questions',
  'Doubt solving',
  'Test paper',
];

export function CheckInSheet({
  sessionId,
  mode,
}: {
  sessionId: string;
  mode: 'home' | 'online';
}) {
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<'parent_otp' | 'geofence' | 'online_join' | 'manual'>(
    mode === 'online' ? 'online_join' : 'parent_otp',
  );
  const [error, setError] = useState<string | null>(null);

  const methods =
    mode === 'online'
      ? [{ key: 'online_join' as const, label: 'We have both joined the meeting', hint: 'Recorded as an online join.' }]
      : [
          {
            key: 'parent_otp' as const,
            label: 'Parent OTP',
            hint: 'The 4-digit code the parent sees in their app or on WhatsApp.',
          },
          {
            key: 'geofence' as const,
            label: 'Location',
            hint: 'Uses your position to confirm you are at the family address.',
          },
          {
            key: 'manual' as const,
            label: 'Manual',
            hint: 'Use only if neither works. The parent is asked to confirm it.',
          },
        ];

  const submit = () => {
    setError(null);

    const send = (coords?: { lat?: number; lng?: number; accuracy_m?: number }) =>
      startTransition(async () => {
        const result = await checkInSession(sessionId, method, coords);
        if (!result.ok) setError(result.message ?? 'Try again in a moment.');
      });

    if (method === 'geofence' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          send({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy_m: Math.round(position.coords.accuracy),
          }),
        // Location refused or unavailable is not a dead end: the check-in still
        // goes through, recorded as manual so the parent is asked to confirm.
        () => {
          setMethod('manual');
          send();
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
      return;
    }

    send();
  };

  return (
    <div className="rounded-card border border-accent/40 bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">Start the class</p>

      <fieldset className="mt-3 space-y-3">
        <legend className="sr-only">Check-in method</legend>
        {methods.map((option) => (
          <label key={option.key} className="flex gap-2.5">
            <input
              type="radio"
              name="method"
              checked={method === option.key}
              onChange={() => setMethod(option.key)}
              className="mt-1 h-4 w-4 accent-[#0D9488]"
            />
            <span>
              <span className="block text-sm font-medium text-ink">{option.label}</span>
              <span className="block text-sm text-slate">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4">
        <Button full disabled={pending} onClick={submit}>
          {pending ? 'Checking in…' : 'Check in'}
        </Button>
      </div>
    </div>
  );
}

export function CheckOutSheet({
  sessionId,
  plannedMin,
  planTopics = [],
}: {
  sessionId: string;
  plannedMin: number;
  planTopics?: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [topics, setTopics] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [minutes, setMinutes] = useState(String(plannedMin));
  const [confidence, setConfidence] = useState(3);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkInstructions, setHomeworkInstructions] = useState('');
  const [noHomework, setNoHomework] = useState(false);
  const [sharedNote, setSharedNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const chips = Array.from(new Set([...planTopics, ...SUGGESTED_TOPICS]));

  const toggle = (topic: string) =>
    setTopics((current) =>
      current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic],
    );

  const allTopics = [...topics, ...(custom.trim() ? [custom.trim()] : [])];
  const homeworkChosen = noHomework || homeworkTitle.trim().length > 0;

  const submit = () => {
    setError(null);

    startTransition(async () => {
      const result = await checkOutSession(sessionId, {
        topics: allTopics,
        actual_min: Number(minutes) || plannedMin,
        confidence,
        homework: noHomework
          ? undefined
          : { title: homeworkTitle.trim(), instructions: homeworkInstructions.trim() || undefined },
        shared_note: sharedNote.trim() || undefined,
      });

      if (!result.ok) setError(result.message ?? 'Try again in a moment.');
    });
  };

  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">Finish the class</p>
      <p className="mt-1 text-sm text-slate">
        What you write here is what the family sees, within a minute.
      </p>

      <div className="mt-4">
        <p className="text-sm font-medium text-ink">
          Topics covered <span className="text-danger">*</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((topic) => (
            <button key={topic} type="button" onClick={() => toggle(topic)}>
              <Chip selected={topics.includes(topic)}>{topic}</Chip>
            </button>
          ))}
        </div>
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Or type exactly what you covered"
          className="mt-2 w-full rounded-card border border-line px-3 py-2 text-sm text-ink"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Length (min)</span>
          <input
            type="number"
            inputMode="numeric"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            className="mt-1 block w-28 rounded-card border border-line px-3 py-2 text-sm text-ink"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-ink">Student confidence</span>
          <div className="mt-1 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setConfidence(value)}
                aria-pressed={confidence === value}
                className={`h-touch w-touch rounded-card border text-sm font-semibold transition ${
                  confidence === value
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-slate'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-sm font-medium text-ink">Homework</p>

        <label className="mt-2 flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={noHomework}
            onChange={(event) => setNoHomework(event.target.checked)}
            className="h-4 w-4 accent-[#0D9488]"
          />
          No homework today
        </label>

        {!noHomework && (
          <>
            <input
              value={homeworkTitle}
              onChange={(event) => setHomeworkTitle(event.target.value)}
              placeholder="e.g. Trigonometry Exercise 8.2, questions 1–8"
              className="mt-2 w-full rounded-card border border-line px-3 py-2 text-sm text-ink"
            />
            <textarea
              value={homeworkInstructions}
              onChange={(event) => setHomeworkInstructions(event.target.value)}
              rows={2}
              placeholder="Anything the student should know before starting"
              className="mt-2 w-full rounded-card border border-line p-3 text-sm text-ink"
            />
          </>
        )}
      </div>

      <label className="mt-4 block border-t border-line pt-4">
        <span className="text-sm font-medium text-ink">Note for the family (optional)</span>
        <textarea
          value={sharedNote}
          onChange={(event) => setSharedNote(event.target.value)}
          rows={2}
          placeholder="Goes into their weekly summary."
          className="mt-1 w-full rounded-card border border-line p-3 text-sm text-ink"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {allTopics.length === 0 && (
        <p className="mt-3">
          <Pill tone="warn">Add at least one topic to finish</Pill>
        </p>
      )}

      <div className="mt-4">
        <Button full disabled={pending || allTopics.length === 0 || !homeworkChosen} onClick={submit}>
          {pending ? 'Saving…' : 'Check out'}
        </Button>
      </div>

      <p className="mt-3 text-xs text-slate">
        Checking out sends the family a confirm prompt. If they do nothing, the class auto-confirms
        after 24 hours and your payable balance rises.
      </p>
    </div>
  );
}
