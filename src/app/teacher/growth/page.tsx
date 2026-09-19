import { requireApi, tryApi } from '@/lib/api';
import type { EarningsPayload, GrowthPayload, Profile } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import {
  Avatar,
  ButtonLink,
  EmptyState,
  MeterBar,
  Pill,
  SectionHeading,
  Stat,
  StatusPill,
} from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { PasswordSection, ProfileSection } from '@/components/account/ProfileForm';
import { AvatarUpload } from '@/components/account/AvatarUpload';
import { PlanGrid, type PlanOption } from '@/components/account/PlanGrid';
import { MessageThreads, type Thread } from '@/components/account/MessageThreads';
import {
  ABOUT_FIELDS,
  ADDRESS_FIELDS,
  DOCUMENT_FIELDS,
  PERSONAL_FIELDS,
  QUALIFICATION_FIELDS,
} from '@/components/account/sections';
import { dateLabel, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Growth: earnings, reliability, verification, reviews, plan and analytics.
 *
 * The reliability score is shown with its three components and the events that
 * moved it, because it is the number that decides where a tutor ranks in
 * matching. A score a tutor can see but not explain is one they cannot improve.
 */
export default async function GrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'earnings' } = await searchParams;

  const { data: growth } = await requireApi<GrowthPayload>('/tutor/growth');

  return (
    <div>
      <SectionHeading title="Growth" subtitle="Earnings, standing and what improves them." />

      <Tabs
        base="/teacher/growth"
        current={tab}
        items={[
          { key: 'earnings', label: 'Earnings' },
          { key: 'reliability', label: 'Reliability' },
          { key: 'verification', label: 'Verification' },
          { key: 'reviews', label: 'Reviews', badge: growth.reviews.count },
          { key: 'messages', label: 'Messages' },
          { key: 'plan', label: 'Plan' },
          { key: 'profile', label: 'Profile' },
        ]}
      />

      {tab === 'earnings' && <EarningsTab />}
      {tab === 'reliability' && <ReliabilityTab growth={growth} />}
      {tab === 'verification' && <VerificationTab growth={growth} />}
      {tab === 'reviews' && <ReviewsTab growth={growth} />}
      {tab === 'messages' && <MessagesTab />}
      {tab === 'plan' && <PlanTab growth={growth} />}
      {tab === 'profile' && <ProfileTab growth={growth} />}
    </div>
  );
}

async function EarningsTab() {
  const earnings = await tryApi<EarningsPayload>('/tutor/earnings');

  if (!earnings) {
    return <EmptyState title="Earnings are not available right now." />;
  }

  return (
    <div className="space-y-3">
      <Card label="This month">
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Earned"
            value={money(earnings.earned_this_month_paise)}
            hint={`${earnings.sessions_done_this_month} classes confirmed`}
            tone="ok"
          />
          <Stat
            label="Held"
            value={money(earnings.pending_paise)}
            hint={`${earnings.sessions_awaiting_confirmation} awaiting confirmation`}
            tone="warn"
          />
          <Stat label="Payable now" value={money(earnings.payable_paise)} />
          <Stat
            label="Commission"
            value={money(earnings.commission_this_month_paise)}
            hint="platform fee on confirmed classes"
          />
        </div>

        <p className="mt-4 border-t border-line pt-3 text-sm text-slate">
          A class is payable once the family confirms it, or 24 hours after you check out — whichever
          comes first. Held money belongs to a class that has happened but is not confirmed yet.
        </p>
      </Card>

      <Card label="Payouts">
        {earnings.payouts.length === 0 ? (
          <p className="text-sm text-slate">
            No payouts yet. The next one is scheduled for {dateLabel(earnings.next_payout_on)}.
          </p>
        ) : (
          <ul>
            {earnings.payouts.map((payout) => (
              <li key={payout.id}>
                <CardRow>
                  <div>
                    <p className="text-sm font-medium text-ink">{money(payout.amount_paise)}</p>
                    <p className="mt-0.5 text-sm text-slate">
                      {dateLabel(payout.period_start)} to {dateLabel(payout.period_end)}
                    </p>
                  </div>
                  <StatusPill status={payout.status} />
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card label="Every entry">
        {earnings.entries.length === 0 ? (
          <p className="text-sm text-slate">Nothing yet.</p>
        ) : (
          <ul>
            {earnings.entries.slice(0, 30).map((entry) => (
              <li key={entry.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{entry.description}</p>
                    <p className="mt-0.5 text-sm text-slate">{dateLabel(entry.occurred_at)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {entry.direction === 'debit' ? '−' : '+'}
                    {money(entry.amount_paise)}
                  </span>
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function MessagesTab() {
  const threads = (await tryApi<Thread[]>('/messages')) ?? [];
  return <MessageThreads threads={threads} />;
}

function ReliabilityTab({ growth }: { growth: GrowthPayload }) {
  const score = growth.reliability;

  if (!score) {
    return (
      <EmptyState
        title="Not enough activity yet."
        body="Your reliability score appears once you have taken classes and replied to leads."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card label="Reliability score">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-navy">{score.score}</span>
          <span className="text-sm text-slate">out of 100</span>
        </div>

        <div className="mt-4 space-y-4">
          <Component label="Punctuality" weight="40%" value={score.punctuality} hint="Checked in within 10 minutes of the start time." />
          <Component label="Lead response" weight="30%" value={score.response} hint="Replied to leads before they expired." />
          <Component label="Completion" weight="30%" value={score.completion} hint="Classes completed rather than cancelled, and homework marked on time." />
        </div>

        <p className="mt-4 border-t border-line pt-3 text-xs text-slate">
          Recomputed nightly over the last 30 days ({dateLabel(score.window_start)} to{' '}
          {dateLabel(score.window_end)}). This is the same number our matching engine uses to rank
          you.
        </p>
      </Card>

      {score.top_events.length > 0 && (
        <Card label="What pulled it down">
          <ul>
            {score.top_events.map((event, index) => (
              <li key={index}>
                <CardRow>
                  <span className="text-sm text-ink">
                    {event.kind === 'late_check_in'
                      ? `Checked in ${String(event.minutes_late)} min late`
                      : 'A lead expired without a reply'}
                  </span>
                  <span className="shrink-0 text-sm text-slate">
                    {dateLabel(String(event.at ?? ''))}
                  </span>
                </CardRow>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Component({
  label,
  weight,
  value,
  hint,
}: {
  label: string;
  weight: string;
  value: number;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">
          {label} <span className="text-muted">({weight})</span>
        </span>
        <span className="text-sm font-semibold text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-chip bg-canvas">
        <div
          className={`h-full rounded-chip ${value >= 80 ? 'bg-accent' : value >= 60 ? 'bg-warn' : 'bg-danger'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate">{hint}</p>
    </div>
  );
}

function VerificationTab({ growth }: { growth: GrowthPayload }) {
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  return (
    <div className="space-y-3">
      <Card label="Verification" tone={growth.verification.verified ? 'default' : 'warn'}>
        <p className="text-sm text-ink">
          {growth.verification.verified
            ? 'You are verified. Your profile is visible to families and you receive leads.'
            : 'Your profile is not visible to families until the required documents are approved.'}
        </p>

        <ul className="mt-3">
          {growth.verification.documents.map((doc) => (
            <li key={doc.doc_type}>
              <CardRow>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {doc.label}
                    {!doc.required && <span className="text-muted"> · optional</span>}
                  </p>
                  {doc.comment && <p className="mt-0.5 text-sm text-warn">{doc.comment}</p>}
                  {doc.reviewed_at && (
                    <p className="mt-0.5 text-xs text-muted">
                      Reviewed {dateLabel(doc.reviewed_at)}
                    </p>
                  )}
                </div>
                <StatusPill status={doc.status} />
              </CardRow>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <ButtonLink href={`${site}/teacher/profile`} tone="secondary" external>
            Upload a document
          </ButtonLink>
        </div>

        <p className="mt-3 text-xs text-slate">
          Documents are stored privately and are never shown on your public profile.
        </p>
      </Card>
    </div>
  );
}

function ReviewsTab({ growth }: { growth: GrowthPayload }) {
  if (growth.reviews.count === 0) {
    return (
      <EmptyState
        title="No reviews yet."
        body="Families can review you after four confirmed classes. Reviews come only from classes recorded in the ledger."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card label="How families rate you">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Overall" value={growth.reviews.average} hint={`${growth.reviews.count} reviews`} />
          {Object.entries(growth.reviews.breakdown).map(([key, value]) => (
            <Stat key={key} label={key} value={value || '—'} />
          ))}
        </div>
      </Card>

      <Card label="Reviews">
        <ul>
          {growth.reviews.items.map((review) => (
            <li key={review.id}>
              <CardRow>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{review.name ?? 'A parent'}</p>
                  {review.message && <p className="mt-1 text-sm text-slate">{review.message}</p>}
                  {review.date && <p className="mt-1 text-xs text-muted">{review.date}</p>}
                </div>
                <Pill tone="accent">{review.rating}/5</Pill>
              </CardRow>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

async function PlanTab({ growth }: { growth: GrowthPayload }) {
  const plans = (await tryApi<PlanOption[]>('/plans')) ?? [];

  return (
    <div className="space-y-3">
      <Card label="Your plan">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-navy">{growth.plan.plan.name}</p>
            <p className="mt-0.5 text-sm text-slate">
              {growth.plan.plan.price > 0
                ? `Rs ${growth.plan.plan.price} every 30 days`
                : 'Free plan'}
              {growth.plan.plan.renews_on && ` · renews ${dateLabel(growth.plan.plan.renews_on)}`}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 border-t border-line pt-4">
          {growth.plan.meters.map((meter) => (
            <MeterBar
              key={meter.feature}
              label={meter.label}
              used={meter.used}
              limit={meter.limit}
              remaining={meter.remaining}
            />
          ))}
        </div>
      </Card>

      <PlanGrid plans={plans} currentPlanName={growth.plan.plan.name} role="tutor" />

      <Card label="How you are doing">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Leads received" value={growth.analytics.leads_received} />
          <Stat label="Replied" value={growth.analytics.leads_replied} hint={growth.analytics.reply_rate !== null ? `${growth.analytics.reply_rate}% of leads` : undefined} />
          <Stat label="Hired" value={growth.analytics.leads_won} hint={growth.analytics.win_rate !== null ? `${growth.analytics.win_rate}% of replies` : undefined} />
          <Stat label="Classes completed" value={growth.analytics.sessions_completed} />
          <Stat label="Cancelled" value={growth.analytics.sessions_cancelled} />
          <Stat label="Lead views used" value={growth.analytics.lead_views_used} />
        </div>

        <p className="mt-4 border-t border-line pt-3 text-sm text-slate">
          Replying faster is the single biggest thing that moves the hire rate. Most families book
          the first tutor who answers.
        </p>
      </Card>
    </div>
  );
}

/**
 * The tutor profile, editable in place — the Blade form, section for section,
 * with the completeness checklist above it so the two are read together.
 */
async function ProfileTab({ growth }: { growth: GrowthPayload }) {
  const { data } = await requireApi<{
    profile: Profile;
    avatar_url: string | null;
    courses: { count: number; structured: Array<Record<string, unknown>> };
  }>('/profile');

  const values = data.profile as unknown as Record<string, string | null>;
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  return (
    <div className="space-y-3">
      <Card label={`Profile ${growth.completeness.percent}% complete`}>
        <div className="mb-4 h-1.5 overflow-hidden rounded-chip bg-canvas">
          <div
            className="h-full rounded-chip bg-accent"
            style={{ width: `${growth.completeness.percent}%` }}
          />
        </div>

        <ul>
          {growth.completeness.checks.map((check) => (
            <li key={check.field}>
              <CardRow>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${check.done ? 'text-muted' : 'text-ink'}`}>
                    {check.label}
                  </p>
                  {!check.done && <p className="mt-0.5 text-sm text-slate">{check.why}</p>}
                </div>
                {check.done ? <Pill tone="ok">Done</Pill> : <Pill tone="warn">To do</Pill>}
              </CardRow>
            </li>
          ))}
        </ul>
      </Card>

      <Card label="Photo">
        <div className="flex items-center gap-4">
          <Avatar src={data.avatar_url} name={data.profile.name} size={64} />
          <AvatarUpload />
        </div>
      </Card>

      <ProfileSection
        section="personal"
        title="Personal information"
        fields={PERSONAL_FIELDS}
        values={values}
      />

      <ProfileSection
        section="about"
        title="How you teach"
        description="What a parent reads before deciding on a demo."
        fields={ABOUT_FIELDS}
        values={values}
      />

      <ProfileSection
        section="qualification"
        title="Qualification and experience"
        fields={QUALIFICATION_FIELDS}
        values={values}
      />

      <ProfileSection
        section="address"
        title="Where you teach"
        description="Home tuition is matched on distance from here."
        fields={ADDRESS_FIELDS}
        values={values}
      />

      <ProfileSection
        section="documents"
        title="Identity document"
        description="Stored privately for verification. Never shown on your public profile."
        fields={DOCUMENT_FIELDS}
        values={values}
      />

      <PasswordSection />

      <Card label="Subjects and classes">
        <p className="text-sm text-slate">
          {data.courses.count > 0
            ? `${data.courses.count} subject and class combinations on file.`
            : 'No subjects on file. A tutor with no subjects receives no leads at all.'}
        </p>
        <div className="mt-3">
          <ButtonLink href={`${site}/teacher/profile`} tone="secondary" external>
            Manage subjects
          </ButtonLink>
        </div>
        <p className="mt-3 text-xs text-slate">
          The subject picker still lives on the main site: it writes to two different course tables
          that the public listings read, and splitting that in two is a change worth doing on its
          own rather than alongside this.
        </p>
      </Card>

      <Card label="Share your profile">
        <p className="text-sm text-slate">
          Your public page is what a family sees before they have an account. Send it to anyone
          asking for a tutor, and ask families you already teach for a review — verified reviews are
          the single thing that moves a card in the listings.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href={`${site}/teacher/${data.profile.user_id}`} tone="secondary" external>
            Open your public page
          </ButtonLink>
          <ButtonLink href={`${site}/teacher/${data.profile.user_id}`} tone="ghost" external>
            Ask for a review
          </ButtonLink>
        </div>
      </Card>

      <Card label="Signed in">
        <p className="text-sm text-slate">
          You use one NXTutors account here and on the main site, so signing out here signs you out
          of both.
        </p>
        <div className="mt-3">
          <ButtonLink href={`${site}/logout`} tone="secondary" external>
            Sign out
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
