import Link from 'next/link';
import type { TutorHome } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { Avatar, ButtonLink, Pill, Stat, StatusPill } from '@/components/ui/primitives';
import { avatarUrl, countdown, dateLabel, money, moneyRange, timeLabel } from '@/lib/format';
import { MapPinIcon, StarIcon, VideoIcon } from '@/components/layout/icons';

/**
 * The tutor Home cards.
 *
 * Their order is decided on the server and honoured here: a tutor whose
 * verification is still pending sees that card first and cannot receive leads
 * at all, so nothing may sit above it telling them to work a queue they are not
 * in yet.
 */

export function VerificationBlockedCard({ verification }: { verification: TutorHome['verification'] }) {
  return (
    <Card label="Verification" tone="warn">
      <p className="text-sm font-semibold text-ink">
        Your profile is not visible to families yet.
      </p>
      <p className="mt-1 text-sm text-slate">
        Leads start arriving as soon as these are approved. Most are reviewed within a working day.
      </p>

      <ul className="mt-3 space-y-2">
        {verification.documents.map((doc) => (
          <li key={doc.doc_type} className="flex items-center justify-between gap-3 text-sm">
            <span className={doc.required ? 'text-ink' : 'text-slate'}>
              {doc.label}
              {doc.comment && <span className="block text-xs text-warn">{doc.comment}</span>}
            </span>
            <StatusPill status={doc.status} />
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <ButtonLink href="/teacher/growth?tab=verification" full>
          Upload documents
        </ButtonLink>
      </div>
    </Card>
  );
}

/** Today's classes, each with the action its mode calls for. */
export function TodayCard({ today, next }: { today: TutorHome['today']; next: TutorHome['next_session'] }) {
  if (today.count === 0) {
    return (
      <Card label="Today">
        <p className="text-sm text-slate">No classes today.</p>
        {next && (
          <p className="mt-2 text-sm text-ink">
            Next: {dateLabel(next.starts_at)} {timeLabel(next.starts_at)} with{' '}
            {next.student?.name ?? 'your student'}.
          </p>
        )}
        <div className="mt-3">
          <ButtonLink href="/teacher/students?tab=calendar" tone="secondary">
            Open calendar
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card
      label={`Today — ${today.count} session${today.count === 1 ? '' : 's'}`}
      action={
        <Link href="/teacher/students?tab=calendar" className="text-sm font-medium text-accent">
          Calendar
        </Link>
      }
    >
      <ul>
        {today.sessions.map((session) => (
          <li key={session.id}>
            <CardRow>
              <div className="flex min-w-0 items-start gap-3">
                <Avatar src={avatarUrl(session.student?.avatar ?? null)} name={session.student?.name ?? null} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {timeLabel(session.starts_at)} · {session.student?.name ?? 'Student'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate">
                    {session.mode === 'online' ? <VideoIcon size={14} /> : <MapPinIcon size={14} />}
                    {session.subject} · {session.mode === 'online' ? 'Online' : 'Home'}
                  </p>
                  {session.late_by_minutes !== null && (
                    <p className="mt-1 text-xs font-medium text-warn">
                      {session.late_by_minutes} min past the start time
                    </p>
                  )}
                </div>
              </div>

              <SessionAction session={session} />
            </CardRow>
          </li>
        ))}
      </ul>

      {next && (
        <p className="mt-3 text-xs text-slate">
          Next after today: {dateLabel(next.starts_at)} {timeLabel(next.starts_at)}
        </p>
      )}
    </Card>
  );
}

function SessionAction({ session }: { session: TutorHome['today']['sessions'][number] }) {
  if (session.can_check_out) {
    return (
      <ButtonLink href={`/teacher/students/session/${session.id}`} tone="primary">
        Check out
      </ButtonLink>
    );
  }

  if (session.can_check_in) {
    return (
      <ButtonLink href={`/teacher/students/session/${session.id}`} tone="primary">
        {session.mode === 'online' ? 'Start' : 'Check in'}
      </ButtonLink>
    );
  }

  return <StatusPill audience="tutor" status={session.status} />;
}

/**
 * New leads, with the reply-time figure the brief calls the single biggest
 * driver of conversion in home tutoring.
 */
export function LeadsCard({ leads }: { leads: TutorHome['leads'] }) {
  if (leads.blocked) return null;

  if (leads.new_count === 0 && !leads.first) {
    return (
      <Card label="Leads">
        <p className="text-sm text-slate">
          No new leads yet. Tutors with an intro video get 2.4× more leads.
        </p>
        <div className="mt-3">
          <ButtonLink href="/teacher/growth?tab=profile" tone="secondary">
            Improve your profile
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const lead = leads.first;

  return (
    <Card
      label={`New leads (${leads.new_count})${
        leads.avg_reply_minutes !== null ? ` · avg reply ${leads.avg_reply_minutes} min` : ''
      }`}
      action={
        <Link href="/teacher/leads" className="text-sm font-medium text-accent">
          All leads
        </Link>
      }
      tone={leads.expiring_soon > 0 ? 'warn' : 'accent'}
    >
      {lead && (
        <>
          <p className="text-sm font-medium text-ink">
            {[lead.class_level && `Class ${lead.class_level}`, lead.board, lead.subject]
              .filter(Boolean)
              .join(' ')}
          </p>
          <p className="mt-1 text-sm text-slate">
            {[lead.locality, lead.city].filter(Boolean).join(', ')}
            {lead.mode === 'online' ? ' · Online' : ' · At home'}
          </p>
          <p className="mt-1 text-sm text-slate">
            {moneyRange(lead.budget_min_paise, lead.budget_max_paise)}
            {lead.slots.length > 0 && ` · ${lead.slots.length} preferred slots`}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone="accent">Fit {lead.fit_score}%</Pill>
            {lead.expires_in_minutes !== null && lead.expires_in_minutes > 0 && (
              <Pill tone={lead.expires_in_minutes < 120 ? 'warn' : 'neutral'}>
                Expires {countdown(lead.expires_in_minutes)}
              </Pill>
            )}
          </div>

          <div className="mt-4">
            <ButtonLink href={`/teacher/leads/${lead.match_id}`} full>
              Reply now
            </ButtonLink>
          </div>
        </>
      )}

      {leads.expiring_soon > 0 && (
        <p className="mt-3 text-xs font-medium text-warn">
          {leads.expiring_soon} lead{leads.expiring_soon === 1 ? '' : 's'} expiring within the hour.
        </p>
      )}
    </Card>
  );
}

/**
 * The money card. Earned and pending are ledger sums, not stored balances, so
 * they cannot disagree with the sessions list behind them.
 */
export function ThisMonthCard({
  month,
  reliability,
  rating,
}: {
  month: TutorHome['this_month'];
  reliability: TutorHome['reliability'];
  rating: TutorHome['rating'];
}) {
  return (
    <Card
      label="This month"
      action={
        <Link href="/teacher/growth?tab=earnings" className="text-sm font-medium text-accent">
          Earnings
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Earned"
          value={money(month.earned_this_month_paise)}
          hint={`${month.sessions_done_this_month} classes confirmed`}
          tone="ok"
        />
        <Stat
          label="Pending"
          value={money(month.pending_paise)}
          hint={
            month.sessions_awaiting_confirmation > 0
              ? `${month.sessions_awaiting_confirmation} awaiting confirmation`
              : 'nothing waiting'
          }
          tone={month.pending_paise > 0 ? 'warn' : 'default'}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-sm text-slate">
        <span>Next payout {dateLabel(month.next_payout_on)}</span>
        {reliability && (
          <Link href="/teacher/growth?tab=reliability" className="font-medium text-accent">
            Reliability {reliability.score}
          </Link>
        )}
        {rating.count > 0 && (
          <span className="inline-flex items-center gap-1">
            <StarIcon filled size={14} />
            {rating.average} ({rating.count})
          </span>
        )}
      </div>
    </Card>
  );
}

/**
 * Completeness, reduced to the single highest-impact next step. A checklist of
 * seven things is ignored; one thing with a reason gets done.
 */
export function CompletenessCard({ completeness }: { completeness: TutorHome['completeness'] }) {
  if (!completeness.next_step) return null;

  return (
    <Card label={`Profile ${completeness.percent}% complete`}>
      <div className="mb-3 h-1.5 overflow-hidden rounded-chip bg-canvas">
        <div
          className="h-full rounded-chip bg-accent transition-all"
          style={{ width: `${completeness.percent}%` }}
        />
      </div>

      <p className="text-sm font-medium text-ink">{completeness.next_step.label}</p>
      <p className="mt-1 text-sm text-slate">{completeness.next_step.why}</p>

      <div className="mt-3">
        <ButtonLink href="/teacher/growth?tab=profile" tone="secondary">
          Update profile
        </ButtonLink>
      </div>
    </Card>
  );
}

export function UnmarkedHomeworkCard({ homework }: { homework: TutorHome['unmarked_homework'] }) {
  if (homework.count === 0) return null;

  return (
    <Card label="Waiting on you" tone={homework.overdue_count > 0 ? 'warn' : 'default'}>
      <p className="text-sm text-ink">
        {homework.count} submission{homework.count === 1 ? '' : 's'} to mark
        {homework.overdue_count > 0 && (
          <span className="text-warn">
            {' '}
            — {homework.overdue_count} older than 72 hours, which counts against your reliability
            score.
          </span>
        )}
      </p>
      <div className="mt-3">
        <ButtonLink href="/teacher/students" tone="secondary">
          Open students
        </ButtonLink>
      </div>
    </Card>
  );
}
