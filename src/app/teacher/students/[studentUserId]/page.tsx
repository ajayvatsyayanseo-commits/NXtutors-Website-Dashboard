import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { StudentBrief, TutorSessionRow } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { Avatar, EmptyState, Pill, SectionHeading, Stat, StatusPill } from '@/components/ui/primitives';
import { avatarUrl, dateLabel, money, timeLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

type StudentPayload = {
  student: StudentBrief | null;
  packages: Array<{
    id: string;
    subject: string | null;
    sessions_total: number;
    sessions_used: number;
    sessions_left: number;
    rate_paise: number;
    status: string;
  }>;
  sessions: TutorSessionRow[];
  homework: Array<{
    id: string;
    title: string;
    subject: string | null;
    due_at: string | null;
    status: string;
  }>;
  notes: Array<{ id: string; visibility: string; body: string; created_at: string | null }>;
};

/**
 * One student: schedule, package balance, homework, notes and progress.
 *
 * Notes marked private never leave this screen — not into the weekly summary,
 * not into an export, not into anything the family can reach. That guarantee is
 * why a tutor will write an honest note at all.
 */
export default async function StudentPage({
  params,
}: {
  params: Promise<{ studentUserId: string }>;
}) {
  const { studentUserId } = await params;
  const { data } = await requireApi<StudentPayload>(`/tutor/students/${studentUserId}`);

  const activePackage = data.packages.find((p) => p.status === 'active');

  return (
    <div className="space-y-3">
      <Link href="/teacher/students" className="text-sm font-medium text-accent">
        ← Roster
      </Link>

      <Card>
        <div className="flex items-start gap-3">
          <Avatar
            src={avatarUrl(data.student?.avatar ?? null)}
            name={data.student?.name ?? null}
            size={56}
          />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-navy">{data.student?.name ?? 'Student'}</h1>
            <p className="mt-0.5 text-sm text-slate">
              {[
                data.student?.class && `Class ${data.student.class}`,
                data.student?.board,
                data.student?.locality,
                data.student?.city,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      </Card>

      <Card label="Package">
        {data.packages.length === 0 ? (
          <p className="text-sm text-slate">No package on file.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Classes left"
                value={activePackage ? activePackage.sessions_left : 0}
                tone={activePackage && activePackage.sessions_left <= 2 ? 'warn' : 'default'}
              />
              <Stat
                label="Used"
                value={activePackage ? `${activePackage.sessions_used}/${activePackage.sessions_total}` : '—'}
              />
              <Stat label="Your rate" value={activePackage ? money(activePackage.rate_paise) : '—'} />
            </div>

            {activePackage && activePackage.sessions_left <= 2 && (
              <p className="mt-3 border-t border-line pt-3 text-sm text-warn">
                This package is nearly finished. The family sees a renewal prompt on their home
                screen with you pre-selected.
              </p>
            )}
          </>
        )}
      </Card>

      <Card label="Classes">
        {data.sessions.length === 0 ? (
          <EmptyState title="No classes yet." />
        ) : (
          <ul>
            {data.sessions.slice(0, 20).map((session) => (
              <li key={session.id}>
                <CardRow>
                  <div className="min-w-0">
                    <Link
                      href={`/teacher/students/session/${session.id}`}
                      className="text-sm font-medium text-ink"
                    >
                      {dateLabel(session.starts_at)} · {timeLabel(session.starts_at)}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate">
                      {session.subject} · {session.mode === 'online' ? 'Online' : 'At home'}
                    </p>
                  </div>
                  <StatusPill audience="tutor" status={session.status} />
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card label="Homework">
        {data.homework.length === 0 ? (
          <EmptyState title="Nothing assigned yet." body="Homework is set on the check-out sheet." />
        ) : (
          <ul>
            {data.homework.map((item) => (
              <li key={item.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate">
                      {item.subject} · due {dateLabel(item.due_at)}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card label="Your notes">
        {data.notes.length === 0 ? (
          <p className="text-sm text-slate">
            No notes yet. Private notes are only ever visible to you and NXTutors ops; shared notes
            go into the family&rsquo;s weekly summary.
          </p>
        ) : (
          <ul>
            {data.notes.map((note) => (
              <li key={note.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{note.body}</p>
                    <p className="mt-1 text-xs text-muted">{dateLabel(note.created_at)}</p>
                  </div>
                  <Pill tone={note.visibility === 'shared' ? 'accent' : 'neutral'}>
                    {note.visibility === 'shared' ? 'Shared with family' : 'Private'}
                  </Pill>
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
