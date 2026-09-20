import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApi } from '@/lib/api';
import type { SessionDetail } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { Avatar, Pill, SectionHeading, StatusPill } from '@/components/ui/primitives';
import { ConfirmSessionPanel } from '@/components/student/ConfirmSessionPanel';
import { NoShowPanel } from '@/components/student/NoShowPanel';
import { avatarUrl, dateTimeLabel, money, timeLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * One class, in full.
 *
 * The attendance events are printed as recorded — method, timestamp, whether
 * the device was offline — rather than summarised into "attended". A parent
 * paying for home tuition is entitled to see how the platform knows the tutor
 * was there, and "trust us" is not an answer.
 */
export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  // A session id that is not this family's returns 404 from the API, and this
  // screen says the same thing rather than leaking that the row exists.
  const response = await requireApi<SessionDetail>(`/sessions/${sessionId}`);

  if (!response.data) {
    notFound();
  }

  const session = response.data;

  return (
    <div className="space-y-3">
      <Link href="/user/learn" className="text-sm font-medium text-accent">
        ← All classes
      </Link>

      <SectionHeading
        title={`${session.subject ?? 'Class'} · ${dateTimeLabel(session.starts_at)}`}
        subtitle={session.tutor?.name ? `With ${session.tutor.name}` : undefined}
        action={<StatusPill status={session.status} />}
      />

      {session.can_confirm && (
        <ConfirmSessionPanel sessionId={session.id} autoConfirmsAt={session.auto_confirms_at} />
      )}

      {/* A class that was never started: the evening the family lost. */}
      {session.status === 'scheduled' && session.starts_at && new Date(session.starts_at) < new Date() && (
        <NoShowPanel sessionId={session.id} tutorName={session.tutor?.name} />
      )}

      <Card label="What was covered">
        {session.topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {session.topics.map((topic) => (
              <Pill key={topic} tone="accent">
                {topic}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate">
            Topics are recorded at check-out. This class has not been checked out yet.
          </p>
        )}

        {session.confidence !== null && (
          <p className="mt-3 text-sm text-slate">
            Your tutor rated confidence in this topic {session.confidence} out of 5.
          </p>
        )}
      </Card>

      <Card label="The record">
        <ul>
          <li>
            <CardRow>
              <span className="text-sm text-slate">Tutor</span>
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Avatar src={avatarUrl(session.tutor?.avatar ?? null)} name={session.tutor?.name ?? null} size={24} />
                {session.tutor?.name ?? '—'}
              </span>
            </CardRow>
          </li>
          <li>
            <CardRow>
              <span className="text-sm text-slate">Mode</span>
              <span className="text-sm font-medium text-ink">
                {session.mode === 'online' ? 'Online' : session.address ?? 'At home'}
              </span>
            </CardRow>
          </li>
          <li>
            <CardRow>
              <span className="text-sm text-slate">Length</span>
              <span className="text-sm font-medium text-ink">
                {session.actual_min ?? session.planned_min} min
                {session.actual_min && session.actual_min !== session.planned_min
                  ? ` (planned ${session.planned_min})`
                  : ''}
              </span>
            </CardRow>
          </li>
          <li>
            <CardRow>
              <span className="text-sm text-slate">Fee</span>
              <span className="text-sm font-medium text-ink">
                {session.fee_paise > 0 ? money(session.fee_paise) : 'Free demo'}
              </span>
            </CardRow>
          </li>
        </ul>
      </Card>

      {session.events && session.events.length > 0 && (
        <Card label="Attendance, exactly as recorded">
          <ul>
            {session.events.map((event, index) => (
              <li key={`${event.kind}-${index}`}>
                <CardRow>
                  <div>
                    <p className="text-sm font-medium text-ink">{eventLabel(event.kind)}</p>
                    <p className="mt-0.5 text-sm text-slate">
                      {methodLabel(event.method)}
                      {event.accuracy_m !== null && ` · GPS accurate to ${event.accuracy_m} m`}
                      {event.offline && ' · recorded offline, synced later'}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-slate">{timeLabel(event.at)}</span>
                </CardRow>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-slate">
            These entries cannot be edited. They are what your tutor&rsquo;s attendance and
            reliability score are calculated from.
          </p>
        </Card>
      )}
    </div>
  );
}

function eventLabel(kind: string): string {
  return (
    {
      check_in: 'Class started',
      check_out: 'Class finished',
      confirm: 'You confirmed it',
      auto_confirm: 'Auto-confirmed after 24 hours',
      dispute: 'You raised an issue',
      no_show: 'Recorded as a no-show',
      cancel: 'Cancelled',
    }[kind] ?? kind.replace(/_/g, ' ')
  );
}

function methodLabel(method: string | null): string {
  return (
    {
      parent_otp: 'Verified by your OTP',
      geofence: 'Verified by location at your address',
      online_join: 'Both joined the meeting link',
      manual: 'Entered manually by the tutor — needs your confirmation',
      app: 'Recorded in the app',
      parent: 'By you',
      system: 'By NXTutors',
      timer_24h: 'By the 24-hour timer',
    }[method ?? ''] ?? 'Recorded in the app'
  );
}
