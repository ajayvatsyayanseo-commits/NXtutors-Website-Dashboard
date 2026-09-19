'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/lib/actions';
import { Card } from '@/components/ui/Card';
import { Avatar, Button, EmptyState, Pill } from '@/components/ui/primitives';
import { ago, avatarUrl } from '@/lib/format';

export type Thread = {
  thread_key: string;
  subject: string | null;
  with: { user_id: string; name: string | null; avatar: string | null } | null;
  last_message: string;
  last_at: string | null;
  unread: number;
  messages: Array<{ id: string; body: string; mine: boolean; at: string | null; read: boolean }>;
};

/**
 * The message list the Blade sidebar promised and never delivered — its entry
 * pointed at `javascript:void(0)`.
 *
 * No phone number appears anywhere in it, on purpose. A tutor's number reaching
 * a parent is what makes the contact credit unenforceable, and keeping the
 * exchange here is also what leaves something to read back when a booking is
 * disputed.
 */
export function MessageThreads({ threads }: { threads: Thread[] }) {
  const [openKey, setOpenKey] = useState<string | null>(threads[0]?.thread_key ?? null);

  if (threads.length === 0) {
    return (
      <EmptyState
        title="No messages yet."
        body="Messages with your tutor appear here. Phone numbers stay private on both sides."
      />
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const open = thread.thread_key === openKey;

        return (
          <Card key={thread.thread_key}>
            <button
              type="button"
              onClick={() => setOpenKey(open ? null : thread.thread_key)}
              aria-expanded={open}
              className="flex w-full items-start gap-3 text-left"
            >
              <Avatar
                src={avatarUrl(thread.with?.avatar ?? null)}
                name={thread.with?.name ?? null}
                size={40}
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">
                    {thread.with?.name ?? 'NXTutors'}
                  </span>
                  {thread.subject && <Pill>{thread.subject}</Pill>}
                  {thread.unread > 0 && <Pill tone="accent">{thread.unread} new</Pill>}
                </span>
                <span className="mt-0.5 block truncate text-sm text-slate">
                  {thread.last_message}
                </span>
              </span>

              <span className="shrink-0 text-xs text-muted">{ago(thread.last_at)}</span>
            </button>

            {open && <ThreadPanel thread={thread} />}
          </Card>
        );
      })}
    </div>
  );
}

function ThreadPanel({ thread }: { thread: Thread }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    setError(null);

    startTransition(async () => {
      const result = await sendMessage(thread.thread_key, body);

      if (!result.ok) {
        setError(result.message ?? 'Try again in a moment.');
        return;
      }

      setBody('');
      router.refresh();
    });
  };

  return (
    <div className="mt-4 border-t border-line pt-4">
      <ul className="space-y-2">
        {thread.messages.map((message) => (
          <li
            key={message.id}
            className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}
          >
            <span
              className={`max-w-[85%] rounded-card px-3 py-2 text-sm ${
                message.mine ? 'bg-accent-soft text-ink' : 'bg-canvas text-ink'
              }`}
            >
              {message.body}
              <span className="mt-1 block text-[11px] text-muted">{ago(message.at)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a message"
          className="w-full rounded-card border border-line p-3 text-sm text-ink"
        />

        {error && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-2">
          <Button disabled={pending || body.trim().length === 0} onClick={send}>
            {pending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
