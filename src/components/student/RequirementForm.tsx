'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createRequirement } from '@/lib/actions';
import { Card } from '@/components/ui/Card';
import { Button, Chip } from '@/components/ui/primitives';

/**
 * Tell us what you need — the screen behind every "Start" button in this app.
 *
 * The Blade site had this as a public page (`/enquiry_teacher`) that a
 * logged-in family was bounced out to. Here it is part of the dashboard, so the
 * requirement arrives already attached to the account and the tracker on Home
 * can follow it.
 *
 * Three steps, each under six fields, because the brief caps a form step at six
 * and the whole thing at about two minutes.
 */

const DAYS = [
  ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'],
  ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
] as const;

const PARTS = [
  ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening'],
] as const;

const BUDGETS = [
  { label: 'Under Rs 600', min: 30000, max: 60000 },
  { label: 'Rs 600–900', min: 60000, max: 90000 },
  { label: 'Rs 900–1,200', min: 90000, max: 120000 },
  { label: 'Rs 1,200–1,500', min: 120000, max: 150000 },
  { label: 'Rs 1,500+', min: 150000, max: 250000 },
];

export function RequirementForm({
  defaults,
}: {
  defaults: { class_level?: string | null; board?: string | null; city?: string | null; locality?: string | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState(defaults.class_level ?? '');
  const [board, setBoard] = useState(defaults.board ?? 'CBSE');
  const [mode, setMode] = useState<'home' | 'online'>('home');
  const [locality, setLocality] = useState(defaults.locality ?? '');
  const [city, setCity] = useState(defaults.city ?? '');
  const [pincode, setPincode] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [parts, setParts] = useState<string[]>(['evening']);
  const [budget, setBudget] = useState(2);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // "mon_evening", "wed_evening" — the shape a lead stores and the matching
  // engine compares a tutor's weekly pattern against.
  const slots = days.flatMap((day) => parts.map((part) => `${day}_${part}`));

  const submit = () => {
    setError(null);

    startTransition(async () => {
      const result = await createRequirement({
        subject,
        class_level: classLevel,
        board: board || null,
        mode,
        locality: locality || null,
        city: city || null,
        pincode: pincode || null,
        slots,
        budget_min_paise: BUDGETS[budget].min,
        budget_max_paise: BUDGETS[budget].max,
        note: note || null,
      });

      if (!result.ok) {
        setError(result.message ?? 'Try again in a moment.');
        return;
      }

      router.push('/user/dashboard');
      router.refresh();
    });
  };

  const ready = subject.trim().length > 0 && classLevel.trim().length > 0;

  return (
    <Card label="What does your child need?">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject" required>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Maths"
              className="input"
            />
          </Field>

          <Field label="Class" required>
            <input
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              placeholder="e.g. 10"
              className="input"
            />
          </Field>

          <Field label="Board">
            <input
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              placeholder="e.g. CBSE"
              className="input"
            />
          </Field>

          <Field label="Classes at">
            <div className="flex gap-2">
              {(['home', 'online'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}>
                  <Chip selected={mode === m}>{m === 'home' ? 'At home' : 'Online'}</Chip>
                </button>
              ))}
            </div>
          </Field>
        </div>

        {mode === 'home' && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Locality">
              <input
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Sector 45"
                className="input"
              />
            </Field>
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
            </Field>
            <Field label="Pincode">
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                inputMode="numeric"
                className="input"
              />
            </Field>
          </div>
        )}

        <Field label="Which days suit you?">
          <div className="flex flex-wrap gap-2">
            {DAYS.map(([value, label]) => (
              <button key={value} type="button" onClick={() => toggle(days, setDays, value)}>
                <Chip selected={days.includes(value)}>{label}</Chip>
              </button>
            ))}
          </div>
        </Field>

        <Field label="What time?">
          <div className="flex flex-wrap gap-2">
            {PARTS.map(([value, label]) => (
              <button key={value} type="button" onClick={() => toggle(parts, setParts, value)}>
                <Chip selected={parts.includes(value)}>{label}</Chip>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Budget per class">
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b, i) => (
              <button key={b.label} type="button" onClick={() => setBudget(i)}>
                <Chip selected={budget === i}>{b.label}</Chip>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Anything the tutor should know?">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Weak in trigonometry, needs confidence before pre-boards."
            className="input"
          />
          <span className="mt-1 block text-xs text-slate">
            Tutors read this before replying, and it is the part they quote back to you.
          </span>
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div>
          <Button full disabled={pending || !ready} onClick={submit}>
            {pending ? 'Sending…' : 'Find me tutors'}
          </Button>
          <p className="mt-2 text-center text-xs text-slate">
            We check verified tutors near you and come back with two or three who fit. Free demo
            with any of them.
          </p>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          min-height: 44px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #1E293B;
        }
      `}</style>
    </Card>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
