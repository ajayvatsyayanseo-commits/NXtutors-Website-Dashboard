'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/primitives';
import { cancelAccountDeletion, requestAccountDeletion, setProfileVisibility } from '@/lib/actions';
import { dateTimeLabel } from '@/lib/format';
import type { AccountState, DeleteOption, HideOption } from '@/lib/types';

type Result = { ok: boolean; message?: string } | null;

const HIDE_CHOICES: Array<{ value: Exclude<HideOption, 'show'>; label: string }> = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: 'indefinite', label: 'until I turn it back on' },
];

const DELETE_CHOICES: Array<{ value: DeleteOption; label: string }> = [
  { value: '24h', label: 'After 24 hours' },
  { value: '3d', label: 'After 3 days' },
  { value: '7d', label: 'After 7 days' },
];

/**
 * Hide profile (tutors) and delete account (everyone).
 *
 * Deletion asks for the password and the word DELETE, then waits the delay
 * the person picked, during which one tap cancels it. Nothing more: the DPDP
 * Act requires leaving to be as easy as joining.
 */
export function AccountControls({ role, account }: { role: 'tutor' | 'student'; account: AccountState }) {
  return (
    <div className="space-y-3">
      {role === 'tutor' && !account.deletion_pending && <VisibilitySection account={account} />}
      <DeletionSection account={account} />
    </div>
  );
}

function ResultLine({ result }: { result: Result }) {
  if (!result?.message) return null;
  return (
    <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-ok' : 'text-danger'}`}>
      {result.message}
    </p>
  );
}

function VisibilitySection({ account }: { account: AccountState }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);

  const apply = (hide: HideOption) => {
    setResult(null);
    startTransition(async () => setResult(await setProfileVisibility(hide)));
  };

  const status = !account.hidden
    ? 'Visible. Families can find your profile in search and listings.'
    : account.hidden_indefinitely
      ? 'Hidden until you turn it back on.'
      : `Hidden until ${dateTimeLabel(account.hidden_until)}. It comes back automatically.`;

  return (
    <Card label="Profile visibility">
      <p className="text-sm text-slate">{status}</p>
      <p className="mt-1 text-xs text-muted">
        While hidden, your public page, listings and search results disappear. Your account, students
        and classes are not affected.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {account.hidden && (
          <Button onClick={() => apply('show')} disabled={pending}>
            Show my profile now
          </Button>
        )}
        {HIDE_CHOICES.map((choice) => (
          <Button key={choice.value} tone="secondary" onClick={() => apply(choice.value)} disabled={pending}>
            {choice.value === 'indefinite' ? 'Hide until I turn it back on' : `Hide for ${choice.label}`}
          </Button>
        ))}
      </div>
      <div className="mt-2">
        <ResultLine result={result} />
      </div>
    </Card>
  );
}

function DeletionSection({ account }: { account: AccountState }) {
  const [open, setOpen] = useState(false);
  const [after, setAfter] = useState<DeleteOption>('7d');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);

  if (account.deletion_pending) {
    return (
      <Card label="Account deletion scheduled">
        <p className="text-sm text-ink">
          Your account will be permanently deleted on <strong>{dateTimeLabel(account.delete_after)}</strong>.
          Until then it is hidden and nobody can find you on NXTutors.
        </p>
        <div className="mt-3">
          <Button
            onClick={() =>
              startTransition(async () => {
                setResult(null);
                setResult(await cancelAccountDeletion());
              })
            }
            disabled={pending}
          >
            Cancel deletion and keep my account
          </Button>
        </div>
        <div className="mt-2">
          <ResultLine result={result} />
        </div>
      </Card>
    );
  }

  const submit = () => {
    setResult(null);
    startTransition(async () => {
      const r = await requestAccountDeletion(after, confirm, password);
      setResult(r);
      if (r.ok) {
        setPassword('');
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
          <span className="block text-sm font-semibold text-danger">Delete account</span>
          <span className="mt-0.5 block text-sm text-slate">Permanently erase your account and personal data.</span>
        </span>
        <span aria-hidden className="text-slate">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="text-sm text-slate">
            <p className="font-medium text-ink">What happens</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Your account is hidden straight away.</li>
              <li>
                After the time you choose, your profile, photo, documents, subjects, reviews, enquiries,
                messages to our assistant and contact details are erased for good.
              </li>
              <li>
                Payment, invoice and class records are kept as the law requires, with your name and contact
                details removed.
              </li>
              <li>Until then you can sign in and cancel with one tap.</li>
            </ul>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-ink">When should it be deleted?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DELETE_CHOICES.map((choice) => (
                <label
                  key={choice.value}
                  className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-card border px-3 text-sm ${
                    after === choice.value ? 'border-danger bg-danger/5 text-danger' : 'border-line text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="delete-after"
                    value={choice.value}
                    checked={after === choice.value}
                    onChange={() => setAfter(choice.value)}
                  />
                  {choice.label}
                </label>
              ))}
            </div>
          </fieldset>

          {account.has_password && (
            <label className="block">
              <span className="text-sm font-medium text-ink">Your password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 min-h-touch w-full rounded-card border border-line px-3 text-sm text-ink"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-ink">
              Type <strong>DELETE</strong> to confirm
            </span>
            <input
              type="text"
              autoComplete="off"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 min-h-touch w-full rounded-card border border-line px-3 text-sm text-ink"
            />
          </label>

          <ResultLine result={result} />

          <Button
            tone="danger"
            onClick={submit}
            disabled={pending || confirm.trim() !== 'DELETE' || (account.has_password && password === '')}
          >
            {pending ? 'Scheduling…' : 'Delete my account'}
          </Button>
        </div>
      )}
    </Card>
  );
}

/** Shown on every screen while a deletion is counting down. */
export function DeletionBanner({ deleteAfter }: { deleteAfter: string | null }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);

  return (
    <div role="alert" className="mb-4 rounded-card border border-danger/30 bg-danger/5 p-3 text-sm text-ink">
      <p>
        Your account is scheduled to be deleted on <strong>{dateTimeLabel(deleteAfter)}</strong>.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          tone="secondary"
          onClick={() => startTransition(async () => setResult(await cancelAccountDeletion()))}
          disabled={pending}
        >
          Cancel deletion
        </Button>
        <ResultLine result={result} />
      </div>
    </div>
  );
}
