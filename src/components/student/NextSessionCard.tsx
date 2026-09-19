import Link from 'next/link';
import type { SessionCard } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Avatar, ButtonLink, Pill } from '@/components/ui/primitives';
import { avatarUrl, countdown, whenLabel } from '@/lib/format';
import { CheckIcon, MapPinIcon, VideoIcon } from '@/components/layout/icons';

/**
 * The first card on Home, and the answer to "when is the next class".
 *
 * A class starting within the hour shows a live countdown; for an online class
 * the Join button only becomes real ten minutes before the start, which the
 * server decides — the client is not trusted to time-gate a paid session.
 */
export function NextSessionCard({ session }: { session: SessionCard }) {
  const soon = session.starts_in_minutes !== null && session.starts_in_minutes <= 60 && session.starts_in_minutes > -90;

  return (
    <Card label="Next session" tone={soon ? 'accent' : 'default'}>
      <div className="flex items-start gap-3">
        <Avatar src={avatarUrl(session.tutor?.avatar ?? null)} name={session.tutor?.name ?? null} size={44} />

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-navy">
            {whenLabel(session.starts_at)} · {session.subject ?? 'Class'}
          </p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate">
            <span>{session.tutor?.name ?? 'Your tutor'}</span>
            {session.tutor?.verified && (
              <span className="inline-flex items-center gap-1 text-ok">
                <CheckIcon size={14} /> Verified
              </span>
            )}
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
            {session.mode === 'online' ? <VideoIcon size={16} /> : <MapPinIcon size={16} />}
            <span>{session.mode === 'online' ? 'Online class' : session.address ?? 'At home'}</span>
          </p>

          {soon && (
            <p className="mt-2">
              <Pill tone="accent">Starts {countdown(session.starts_in_minutes)}</Pill>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {session.can_join && session.meeting_url ? (
          <ButtonLink href={session.meeting_url} external>
            Join class
          </ButtonLink>
        ) : null}

        <Link
          href={`/user/learn/${session.id}`}
          className="inline-flex min-h-touch items-center rounded-card border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-canvas"
        >
          Session details
        </Link>

        <Link
          href={`/user/tutors/${session.tutor?.user_id ?? ''}`}
          className="inline-flex min-h-touch items-center rounded-card px-4 text-sm font-semibold text-accent transition hover:bg-accent-soft/60"
        >
          Message tutor
        </Link>
      </div>
    </Card>
  );
}
