import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { RosterRow, TutorSessionRow } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { Avatar, ButtonLink, EmptyState, Pill, SectionHeading, StatusPill } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { avatarUrl, dateLabel, timeLabel, WEEKDAYS } from '@/lib/format';

export const dynamic = 'force-dynamic';

type CalendarPayload = {
  from: string;
  to: string;
  sessions: TutorSessionRow[];
  availability: Array<{ id: string; weekday: number; start_time: string; end_time: string; mode: string }>;
};

/**
 * Students: the roster, and the week.
 *
 * The roster only ever contains students with an active or recently ended
 * package with this tutor. That is enforced by the API, not by a filter here —
 * a tutor has no business learning that a family exists unless a package
 * connects them.
 */
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'roster' } = await searchParams;

  return (
    <div>
      <SectionHeading title="Students" subtitle="Your roster, schedule and homework." />

      <Tabs
        base="/teacher/students"
        current={tab}
        items={[
          { key: 'roster', label: 'Roster' },
          { key: 'calendar', label: 'Calendar' },
        ]}
      />

      {tab === 'roster' ? <RosterTab /> : <CalendarTab />}
    </div>
  );
}

async function RosterTab() {
  const { data: roster } = await requireApi<RosterRow[]>('/tutor/students');

  if (roster.length === 0) {
    return (
      <EmptyState
        title="Your first student appears here after a family buys a package."
        body="Reply quickly to leads and complete your profile — both move you up the matching order."
        action={<ButtonLink href="/teacher/leads" tone="secondary">Open leads</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {roster.map((row) => (
        <Card key={row.student?.user_id ?? Math.random()}>
          <div className="flex items-start gap-3">
            <Avatar
              src={avatarUrl(row.student?.avatar ?? null)}
              name={row.student?.name ?? null}
              size={44}
            />

            <div className="min-w-0 flex-1">
              <Link
                href={`/teacher/students/${row.student?.user_id ?? ''}`}
                className="text-sm font-semibold text-navy"
              >
                {row.student?.name ?? 'Student'}
              </Link>

              <p className="mt-0.5 text-sm text-slate">
                {[row.student?.class && `Class ${row.student.class}`, row.subjects.join(', ')]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              <p className="mt-1 text-sm text-slate">
                {row.sessions_left} class{row.sessions_left === 1 ? '' : 'es'} left
                {row.next_session_at &&
                  ` · next ${dateLabel(row.next_session_at)} ${timeLabel(row.next_session_at)}`}
              </p>

              {row.homework_pending > 0 && (
                <p className="mt-1 text-sm text-warn">
                  {row.homework_pending} homework item{row.homework_pending === 1 ? '' : 's'} open
                </p>
              )}
            </div>

            <div className="shrink-0 text-right">
              <StatusPill audience="tutor" status={row.package_status === 'active' ? 'confirmed' : 'cancelled'} />
              {row.can_request_renewal && (
                <p className="mt-2">
                  <Pill tone="warn">Running low</Pill>
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

async function CalendarTab() {
  const { data } = await requireApi<CalendarPayload>('/tutor/calendar');

  const byDay = data.sessions.reduce<Record<string, TutorSessionRow[]>>((acc, session) => {
    const key = session.starts_at ? session.starts_at.slice(0, 10) : 'undated';
    (acc[key] ??= []).push(session);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <Card label="Your weekly availability">
        {data.availability.length === 0 ? (
          <p className="text-sm text-slate">
            You have not set a weekly pattern. Matching compares your free slots against the ones
            families ask for, so without one you are left out of most matches.
          </p>
        ) : (
          <ul className="space-y-2">
            {WEEKDAYS.map((day, index) => {
              const slots = data.availability.filter((slot) => slot.weekday === index);
              if (slots.length === 0) return null;

              return (
                <li key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0 font-medium text-ink">{day}</span>
                  <span className="text-slate">
                    {slots.map((slot) => `${slot.start_time}–${slot.end_time}`).join(', ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {Object.keys(byDay).length === 0 ? (
        <EmptyState title="Nothing scheduled in the next few weeks." />
      ) : (
        Object.entries(byDay).map(([day, sessions]) => (
          <Card key={day} label={dateLabel(`${day}T00:00:00Z`)}>
            <ul>
              {sessions.map((session) => (
                <li key={session.id}>
                  <CardRow>
                    <div className="min-w-0">
                      <Link
                        href={`/teacher/students/session/${session.id}`}
                        className="text-sm font-medium text-ink"
                      >
                        {timeLabel(session.starts_at)} · {session.student?.name ?? 'Student'}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate">
                        {session.subject} · {session.mode === 'online' ? 'Online' : 'At home'} ·{' '}
                        {session.planned_min} min
                      </p>
                    </div>
                    <StatusPill audience="tutor" status={session.status} />
                  </CardRow>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}
