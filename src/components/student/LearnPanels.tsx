import Link from 'next/link';
import type {
  HomeworkCard,
  ProgressPayload,
  SessionDetail,
  StudyPlanPayload,
} from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { ButtonLink, EmptyState, Pill, Stat, StatusPill } from '@/components/ui/primitives';
import { dateLabel, timeLabel, whenLabel } from '@/lib/format';

/**
 * The four Learn panels: sessions, homework, study plan and progress.
 *
 * Their common thread is evidence. Every figure shown here is one the family
 * can open and check — a session row carries the check-in method and time, a
 * heatmap cell carries the ids of the classes and tests behind it. The live
 * site shipped six identical reviews and a 4.8 on every card; numbers with no
 * source behind them are exactly what this replaces.
 */

export function SessionsPanel({ sessions }: { sessions: SessionDetail[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState title="Your classes and homework will appear here after the first session." />
    );
  }

  const weeks = groupByWeek(sessions);
  const confirmable = sessions.filter((s) => s.can_confirm);

  return (
    <div className="space-y-3">
      {confirmable.length > 0 && (
        <Card label="Waiting for you" tone="warn">
          <p className="text-sm text-ink">
            {confirmable.length} class{confirmable.length === 1 ? '' : 'es'} finished and{' '}
            {confirmable.length === 1 ? 'is' : 'are'} waiting for you to confirm.{' '}
            {confirmable.some((s) => s.needs_your_confirmation)
              ? 'Classes checked in with your code confirm automatically 24 hours after they end; the others wait for your answer.'
              : `If you do nothing, ${confirmable.length === 1 ? 'it' : 'they'} auto-confirm 24 hours after the class ended.`}
          </p>
        </Card>
      )}

      {weeks.map(([week, rows]) => (
        <Card key={week} label={week}>
          <ul>
            {rows.map((session) => (
              <li key={session.id}>
                <CardRow>
                  <div className="min-w-0">
                    <Link
                      href={`/user/learn/${session.id}`}
                      className="block text-sm font-medium text-ink"
                    >
                      {dateLabel(session.starts_at)} · {timeLabel(session.starts_at)}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate">
                      {session.subject} · {session.tutor?.name ?? 'Tutor'} ·{' '}
                      {session.actual_min ?? session.planned_min} min
                    </p>
                    {session.topics.length > 0 && (
                      <p className="mt-1 text-sm text-slate">
                        Covered: {session.topics.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <StatusPill status={session.status} />
                    {session.can_confirm && (
                      <p className="mt-2">
                        <ButtonLink href={`/user/learn/${session.id}`} tone="secondary">
                          Confirm
                        </ButtonLink>
                      </p>
                    )}
                  </div>
                </CardRow>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

export function HomeworkPanel({
  open,
  done,
}: {
  open: HomeworkCard[];
  done: HomeworkCard[];
}) {
  if (open.length === 0 && done.length === 0) {
    return <EmptyState title="Homework your tutor sets will appear here." />;
  }

  return (
    <div className="space-y-3">
      <Card label={`To do (${open.length})`}>
        {open.length === 0 ? (
          <p className="text-sm text-slate">Nothing outstanding. Well done.</p>
        ) : (
          <ul>
            {open.map((item) => (
              <li key={item.id}>
                <CardRow>
                  <div className="min-w-0">
                    <Link
                      href={`/user/learn/homework/${item.id}`}
                      className="block text-sm font-medium text-ink"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate">
                      {item.subject} · {item.tutor?.name ?? 'Tutor'} · {item.due_label}
                    </p>
                  </div>
                  {item.overdue ? (
                    <Pill tone="warn">Overdue</Pill>
                  ) : (
                    <StatusPill status={item.status} />
                  )}
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {done.length > 0 && (
        <Card label={`Marked (${done.length})`}>
          <ul>
            {done.map((item) => (
              <li key={item.id}>
                <CardRow>
                  <div className="min-w-0">
                    <Link
                      href={`/user/learn/homework/${item.id}`}
                      className="block text-sm font-medium text-ink"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate">
                      {item.subject} · {item.tutor?.name ?? 'Tutor'}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </CardRow>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function StudyPlanPanel({ plan }: { plan: StudyPlanPayload }) {
  if (!plan) {
    return (
      <EmptyState
        title="No study plan yet."
        body="Ask your tutor to set one, so classes and self-study line up week by week."
        action={<ButtonLink href="/user/learn?tab=sessions" tone="secondary">Back to classes</ButtonLink>}
      />
    );
  }

  const bySubject = plan.items.reduce<Record<string, typeof plan.items>>((acc, item) => {
    const key = item.subject ?? 'General';
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <Card label={`Week of ${dateLabel(plan.week_start)}`}>
        <div className="flex items-center justify-between gap-3">
          <Stat
            label="Done"
            value={`${plan.progress.done}/${plan.progress.total}`}
            hint={plan.tutor ? `Set by ${plan.tutor.name}` : undefined}
          />
          <div className="w-32">
            <div className="h-1.5 overflow-hidden rounded-chip bg-canvas">
              <div
                className="h-full rounded-chip bg-accent"
                style={{
                  width: `${plan.progress.total ? (plan.progress.done / plan.progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {Object.entries(bySubject).map(([subject, items]) => (
        <Card key={subject} label={subject}>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.done ? 'text-muted line-through' : 'text-ink'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate">
                      <span>{item.kind === 'in_class' ? 'In class' : 'Self study'}</span>
                      {item.chapter && <span>· {item.chapter}</span>}
                      {item.due_at && <span>· {dateLabel(item.due_at)}</span>}
                    </p>
                    {item.edited_by && (
                      <p className="mt-1 text-xs text-accent">Edited by {item.edited_by}</p>
                    )}
                  </div>
                  {item.done ? <Pill tone="ok">Done</Pill> : <Pill>To do</Pill>}
                </CardRow>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

/**
 * The chapter heatmap. Colour comes from recorded evidence only, and the count
 * of evidence items is shown next to each cell so a parent can see that a
 * confident-looking green is backed by four classes and not by one.
 */
export function ProgressPanel({ progress }: { progress: ProgressPayload }) {
  if (progress.heatmap.length === 0 && progress.summaries.length === 0) {
    return <EmptyState title="Progress appears after the first completed class." />;
  }

  return (
    <div className="space-y-3">
      {progress.heatmap.map((subject) => (
        <Card key={subject.subject} label={`${subject.subject} — by chapter`}>
          <ul className="space-y-2">
            {subject.chapters.map((cell) => {
              const evidenceCount = Object.values(cell.evidence ?? {}).flat().length;

              return (
                <li key={cell.chapter} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-sm text-ink">{cell.chapter}</span>

                  <span className="h-2.5 flex-1 overflow-hidden rounded-chip bg-canvas">
                    <span
                      className="block h-full rounded-chip"
                      style={{
                        width: `${cell.score ?? 0}%`,
                        backgroundColor: heatColour(cell.score),
                      }}
                    />
                  </span>

                  <span className="w-10 shrink-0 text-right text-sm font-semibold text-ink">
                    {cell.score ?? '—'}
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs text-muted">
                    {evidenceCount} source{evidenceCount === 1 ? '' : 's'}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs text-slate">
            Each score is computed from recorded classes, homework marks and test attempts — nothing
            here is an estimate.
          </p>
        </Card>
      ))}

      {progress.summaries.map((summary) => (
        <Card
          key={summary.id}
          label={`Weekly summary · ${dateLabel(summary.week_start)} to ${dateLabel(summary.week_end)}`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(summary.counters).map(([key, value]) => (
              <Stat key={key} label={key.replace(/_/g, ' ')} value={String(value)} />
            ))}
          </div>

          {summary.narrative && (
            <p className="mt-4 border-t border-line pt-3 text-sm text-ink">{summary.narrative}</p>
          )}

          {summary.narrative_locked && (
            <p className="mt-4 border-t border-line pt-3 text-sm text-slate">
              The written summary is part of the Premium plan. The counters above are shown on every
              plan.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

/** Red below 50, amber to 70, teal above. One scale, used nowhere else. */
function heatColour(score: number | null): string {
  if (score === null) return '#CBD5E1';
  if (score < 50) return '#B91C1C';
  if (score < 70) return '#B45309';
  return '#0D9488';
}

function groupByWeek(sessions: SessionDetail[]): Array<[string, SessionDetail[]]> {
  const groups = new Map<string, SessionDetail[]>();

  for (const session of sessions) {
    const label = session.starts_at ? weekLabel(session.starts_at) : 'Undated';
    const list = groups.get(label) ?? [];
    list.push(session);
    groups.set(label, list);
  }

  return Array.from(groups.entries());
}

function weekLabel(iso: string): string {
  const date = new Date(iso);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));

  const now = new Date();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const diffWeeks = Math.round((thisMonday.getTime() - monday.getTime()) / (7 * 86400000));

  if (diffWeeks === 0) return 'This week';
  if (diffWeeks === 1) return 'Last week';

  return `Week of ${dateLabel(monday.toISOString())}`;
}

export { whenLabel };
