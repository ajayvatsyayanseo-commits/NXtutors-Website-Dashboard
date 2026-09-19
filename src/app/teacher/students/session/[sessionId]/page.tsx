import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireApi } from '@/lib/api';
import type { CalendarPayloadShape } from './types';
import { Card, CardRow } from '@/components/ui/Card';
import { Avatar, SectionHeading, StatusPill } from '@/components/ui/primitives';
import { CheckInSheet, CheckOutSheet } from '@/components/tutor/SessionSheet';
import { avatarUrl, dateTimeLabel, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * The session sheet: check in, teach, check out.
 *
 * The session is read from the tutor's own calendar rather than by id alone, so
 * a session belonging to another tutor is simply not found here.
 */
export default async function SessionSheetPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const { data } = await requireApi<CalendarPayloadShape>('/tutor/calendar');
  const session = data.sessions.find((row) => row.id === sessionId);

  if (!session) {
    notFound();
  }

  return (
    <div className="space-y-3">
      <Link href="/teacher/students?tab=calendar" className="text-sm font-medium text-accent">
        ← Calendar
      </Link>

      <SectionHeading
        title={`${session.subject ?? 'Class'} · ${session.student?.name ?? 'Student'}`}
        subtitle={dateTimeLabel(session.starts_at)}
        action={<StatusPill audience="tutor" status={session.status} />}
      />

      <Card>
        <div className="flex items-start gap-3">
          <Avatar
            src={avatarUrl(session.student?.avatar ?? null)}
            name={session.student?.name ?? null}
            size={44}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">{session.student?.name ?? 'Student'}</p>
            <p className="mt-0.5 text-sm text-slate">
              {[session.student?.class && `Class ${session.student.class}`, session.student?.board]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <ul className="mt-3 border-t border-line pt-1">
          <li>
            <CardRow>
              <span className="text-sm text-slate">Where</span>
              <span className="text-sm font-medium text-ink">
                {session.mode === 'online' ? 'Online' : session.address ?? 'At the family home'}
              </span>
            </CardRow>
          </li>
          <li>
            <CardRow>
              <span className="text-sm text-slate">Planned length</span>
              <span className="text-sm font-medium text-ink">{session.planned_min} min</span>
            </CardRow>
          </li>
          <li>
            <CardRow>
              <span className="text-sm text-slate">You earn</span>
              <span className="text-sm font-medium text-ink">
                {session.fee_paise > 0 ? money(session.fee_paise) : 'Free demo'}
              </span>
            </CardRow>
          </li>
        </ul>
      </Card>

      {session.status === 'scheduled' && (
        <CheckInSheet sessionId={session.id} mode={session.mode} />
      )}

      {session.status === 'checked_in' && (
        <CheckOutSheet sessionId={session.id} plannedMin={session.planned_min} />
      )}

      {['checked_out', 'confirmed'].includes(session.status) && (
        <Card label="Done">
          <p className="text-sm text-slate">
            {session.status === 'confirmed'
              ? 'The family confirmed this class and it has been added to your payable balance.'
              : 'Checked out. The family has 24 hours to confirm, after which it confirms automatically.'}
          </p>
        </Card>
      )}
    </div>
  );
}
