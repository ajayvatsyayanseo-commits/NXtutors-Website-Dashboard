import Link from 'next/link';
import type { StudentHome } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { ButtonLink, Pill, Stat } from '@/components/ui/primitives';
import { money, whenLabel } from '@/lib/format';

/**
 * The remaining Home cards, in the order the brief fixes them:
 * homework, this week, Ask AI, tracker, renewal.
 *
 * Each returns null when it has nothing to say, so an absent card collapses
 * instead of rendering an empty box — that is what keeps the layout from
 * shifting once the data lands.
 */

export function HomeworkDueCard({ homework }: { homework: StudentHome['homework'] }) {
  if (homework.count === 0) return null;

  return (
    <Card
      label="Homework due"
      action={
        <Link href="/user/learn?tab=homework" className="text-sm font-medium text-accent">
          All homework
        </Link>
      }
      tone={homework.overdue_count > 0 ? 'warn' : 'default'}
    >
      <ul>
        {homework.items.map((item) => (
          <li key={item.id}>
            <CardRow>
              <div className="min-w-0">
                <Link href={`/user/learn/homework/${item.id}`} className="block truncate text-sm font-medium text-ink">
                  {item.title}
                </Link>
                <p className="mt-0.5 text-sm text-slate">
                  {item.subject} · {item.due_label}
                </p>
              </div>
              {item.overdue ? <Pill tone="warn">Overdue</Pill> : <Pill tone="accent">Upload</Pill>}
            </CardRow>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-slate">
        {homework.count} item{homework.count === 1 ? '' : 's'}
        {homework.overdue_count > 0 && ` · ${homework.overdue_count} overdue`}
      </p>
    </Card>
  );
}

/**
 * Counters only, each traceable to a session or attempt row. The brief is
 * blunt about this: a number on this screen that no one can check is worse
 * than no number.
 */
export function ThisWeekCard({
  week,
  summary,
}: {
  week: StudentHome['this_week'];
  summary: StudentHome['latest_summary'];
}) {
  if (week.scheduled === 0 && week.tests_taken === 0 && week.homework_done === 0) return null;

  return (
    <Card label="This week">
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Attendance"
          value={`${week.attended}/${week.scheduled}`}
          hint="classes checked in"
        />
        <Stat
          label="Tests"
          value={week.tests_taken === 0 ? '—' : `${week.tests_taken}`}
          hint={week.test_average !== null ? `${week.test_average}% average` : 'none taken'}
        />
        <Stat label="Homework" value={`${week.homework_done}`} hint="marked" />
      </div>

      {summary && (
        <Link
          href="/user/learn?tab=progress"
          className="mt-4 flex items-center justify-between gap-3 rounded-card bg-accent-soft/50 px-3 py-3 text-sm font-medium text-accent"
        >
          <span>
            {summary.unread ? 'Your weekly summary is ready' : 'Read this week&rsquo;s summary'}
          </span>
          <span aria-hidden>&rarr;</span>
        </Link>
      )}
    </Card>
  );
}

export function AskAiCard({ remaining }: { remaining: number | null }) {
  const locked = remaining !== null && remaining <= 0;

  return (
    <Card label="Ask AI">
      <p className="text-sm text-slate">
        {locked
          ? 'You have used all of your AI credits for this cycle.'
          : 'Type your doubt or send a photo of the question.'}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <ButtonLink href="/user/ask" tone={locked ? 'secondary' : 'primary'}>
          {locked ? 'See plans' : 'Ask a doubt'}
        </ButtonLink>
        <span className="text-xs text-slate">
          {remaining === null ? 'Unlimited' : `${remaining} left`}
        </span>
      </div>
    </Card>
  );
}

/**
 * The requirement tracker: Received, Matching, Matches ready, Demo booked,
 * Demo done, Hired — with the one action that moves the family forward.
 */
export function TrackerCard({ requirement }: { requirement: StudentHome['requirements'][number] }) {
  return (
    <Card label={`Open requirement · ${requirement.subject ?? 'Tutoring'}`} tone="accent">
      <p className="text-sm text-slate">
        {[
          requirement.class_level && `Class ${requirement.class_level}`,
          requirement.board,
          requirement.mode === 'online' ? 'Online' : 'At home',
          requirement.locality,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <ol className="mt-4 space-y-2">
        {requirement.steps.map((step) => (
          <li key={step.key} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border text-[10px] ${
                step.state === 'done'
                  ? 'border-ok bg-ok text-white'
                  : step.state === 'current'
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-white text-muted'
              }`}
            >
              {step.state === 'done' ? '✓' : ''}
            </span>
            <span className={step.state === 'pending' ? 'text-muted' : 'font-medium text-ink'}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {requirement.match_count > 0 && (
        <p className="mt-3 text-sm text-slate">
          {requirement.match_count} tutor{requirement.match_count === 1 ? '' : 's'} fit your budget and slots.
        </p>
      )}

      {requirement.next_action && (
        <div className="mt-4">
          <ButtonLink href={requirement.next_action.href} full>
            {requirement.next_action.label}
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}

/**
 * Appears at two classes left, with the same tutor pre-selected — one tap to
 * keep the schedule running rather than discovering it stopped.
 */
export function RenewalCard({ renewal }: { renewal: NonNullable<StudentHome['renewal']> }) {
  return (
    <Card label="Running low" tone="warn">
      <p className="text-sm text-ink">
        <strong className="font-semibold">
          {renewal.sessions_left === 0
            ? 'No classes left'
            : `${renewal.sessions_left} class${renewal.sessions_left === 1 ? '' : 'es'} left`}
        </strong>{' '}
        with {renewal.tutor?.name ?? 'your tutor'}
        {renewal.subject ? ` for ${renewal.subject}` : ''}.
      </p>

      <p className="mt-2 text-sm text-slate">
        {money(renewal.suggested_amount_paise)} for {renewal.suggested_sessions} classes at{' '}
        {money(renewal.rate_paise)} each. Held until each class is completed; unused classes are
        refunded as credit.
      </p>

      <div className="mt-4">
        <ButtonLink href={`/user/account?renew=${renewal.package_id}`} full>
          Renew with {renewal.tutor?.name?.split(' ')[0] ?? 'this tutor'}
        </ButtonLink>
      </div>
    </Card>
  );
}

export function UpcomingSessionsCard({ sessions }: { sessions: StudentHome['upcoming_sessions'] }) {
  if (sessions.length === 0) return null;

  return (
    <Card
      label="Coming up"
      action={
        <Link href="/user/learn" className="text-sm font-medium text-accent">
          All classes
        </Link>
      }
    >
      <ul>
        {sessions.slice(0, 4).map((session) => (
          <li key={session.id}>
            <CardRow>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {whenLabel(session.starts_at)}
                </p>
                <p className="mt-0.5 text-sm text-slate">
                  {session.subject} · {session.tutor?.name ?? 'Tutor'} ·{' '}
                  {session.mode === 'online' ? 'Online' : 'At home'}
                </p>
              </div>
            </CardRow>
          </li>
        ))}
      </ul>
    </Card>
  );
}
