'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from '@/lib/actions';
import { Button, Pill } from '@/components/ui/primitives';
import { Card } from '@/components/ui/Card';

/**
 * One editable section of a profile.
 *
 * Sections save independently, the way the Blade form did, so editing an
 * address never silently rewrites the qualification fields the user was not
 * looking at. Each one stays collapsed until opened, which keeps a long profile
 * readable on a phone instead of presenting twenty inputs at once.
 *
 * No record id is sent. The server writes the row belonging to the session,
 * which is what stops a posted id deciding whose profile gets changed.
 */

export type Field = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'select' | 'date';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  help?: string;
};

export function ProfileSection({
  section,
  title,
  description,
  fields,
  values,
}: {
  section: string;
  title: string;
  description?: string;
  fields: Field[];
  values: Record<string, string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, values[f.name] ?? ''])),
  );
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);

  const save = () => {
    setResult(null);
    startTransition(async () => {
      setResult(await updateProfile(section, form));
    });
  };

  const filled = fields.filter((f) => (values[f.name] ?? '').toString().trim() !== '').length;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-navy">{title}</span>
          {description && <span className="mt-0.5 block text-sm text-slate">{description}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Pill tone={filled === fields.length ? 'ok' : filled === 0 ? 'warn' : 'neutral'}>
            {filled}/{fields.length}
          </Pill>
          <span aria-hidden className="text-slate">
            {open ? '−' : '+'}
          </span>
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="text-sm font-medium text-ink">{field.label}</span>

              {field.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={form[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="mt-1 w-full rounded-card border border-line p-3 text-sm text-ink"
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="mt-1 min-h-touch w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
                >
                  <option value="">Not set</option>
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : 'text'}
                  value={form[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="mt-1 min-h-touch w-full rounded-card border border-line px-3 text-sm text-ink"
                />
              )}

              {field.help && <span className="mt-1 block text-xs text-slate">{field.help}</span>}
            </label>
          ))}

          {result && (
            <p
              role={result.ok ? 'status' : 'alert'}
              className={`text-sm ${result.ok ? 'text-ok' : 'text-danger'}`}
            >
              {result.ok ? 'Saved.' : result.message}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button disabled={pending} onClick={save}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <Button tone="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Change password.
 *
 * The current password is required — an unlocked phone should not be enough to
 * lock the owner out of their own account.
 */
export function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);

  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;

  const save = () => {
    setResult(null);
    startTransition(async () => {
      const r = await import('@/lib/actions').then((m) =>
        m.changePassword(current, next, confirm),
      );
      setResult(r);
      if (r.ok) {
        setCurrent('');
        setNext('');
        setConfirm('');
      }
    });
  };

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-navy">Password</span>
          <span className="mt-0.5 block text-sm text-slate">
            Change the password you sign in with.
          </span>
        </span>
        <span aria-hidden className="text-slate">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {[
            ['Current password', current, setCurrent],
            ['New password', next, setNext],
            ['Confirm new password', confirm, setConfirm],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="block">
              <span className="text-sm font-medium text-ink">{label as string}</span>
              <input
                type="password"
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                className="mt-1 min-h-touch w-full rounded-card border border-line px-3 text-sm text-ink"
              />
            </label>
          ))}

          <p className="text-xs text-slate">At least 8 characters.</p>

          {mismatch && (
            <p role="alert" className="text-sm text-danger">
              The two new passwords do not match.
            </p>
          )}

          {result && (
            <p
              role={result.ok ? 'status' : 'alert'}
              className={`text-sm ${result.ok ? 'text-ok' : 'text-danger'}`}
            >
              {result.ok ? 'Password changed.' : result.message}
            </p>
          )}

          <div className="pt-1">
            <Button
              disabled={pending || mismatch || !current || next.length < 8}
              onClick={save}
            >
              {pending ? 'Saving…' : 'Change password'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
