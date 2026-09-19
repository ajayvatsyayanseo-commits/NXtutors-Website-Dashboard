import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { LeadDetail } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { Pill, SectionHeading } from '@/components/ui/primitives';
import { LeadReplyForm } from '@/components/tutor/LeadReplyForm';
import { ago, countdown, dateLabel, money, moneyRange, slotLabel } from '@/lib/format';
import { CheckIcon } from '@/components/layout/icons';

export const dynamic = 'force-dynamic';

/**
 * A lead, in full, and the reply that converts it.
 *
 * Loading this screen is what spends a lead view — once per lead, ever.
 * Re-opening it is free, which is why the "charged" flag is shown rather than
 * left implicit: a tutor with three views a month needs to know which of their
 * taps cost one.
 */
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const { data: lead } = await requireApi<LeadDetail>(`/tutor/leads/${matchId}`);

  const meter = lead.entitlements.meters.find((m) => m.feature === 'leads.view');
  const expiring = lead.expires_in_minutes !== null && lead.expires_in_minutes > 0;

  return (
    <div className="space-y-3">
      <Link href="/teacher/leads" className="text-sm font-medium text-accent">
        ← All leads
      </Link>

      <SectionHeading
        title={
          [lead.class_level && `Class ${lead.class_level}`, lead.board, lead.subject]
            .filter(Boolean)
            .join(' ') || 'Tutoring requirement'
        }
        subtitle={`Received ${ago(lead.received_at)}`}
        action={<Pill tone={lead.fit_score >= 90 ? 'accent' : 'neutral'}>Fit {lead.fit_score}%</Pill>}
      />

      <Card label="The requirement">
        <ul>
          <Row label="Location">
            {[lead.locality, lead.city].filter(Boolean).join(', ') || 'Not given'}
          </Row>
          <Row label="Mode">{lead.mode === 'online' ? 'Online' : 'At the family home'}</Row>
          <Row label="Budget">{moneyRange(lead.budget_min_paise, lead.budget_max_paise)} per class</Row>
          <Row label="Preferred slots">
            {lead.slots.length > 0 ? lead.slots.map(slotLabel).join(', ') : 'Flexible'}
          </Row>
          {lead.start_by && <Row label="Wants to start by">{dateLabel(lead.start_by)}</Row>}
          <Row label="Source">{sourceLabel(lead.source)}</Row>
        </ul>

        {lead.note && (
          <div className="mt-3 rounded-card bg-canvas p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">
              What the family said
            </p>
            <p className="mt-1.5 text-sm text-ink">&ldquo;{lead.note}&rdquo;</p>
          </div>
        )}
      </Card>

      {lead.reasons && lead.reasons.length > 0 && (
        <Card label="Why you were matched">
          <ul className="space-y-1.5">
            {lead.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-accent">
                  <CheckIcon size={14} />
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {lead.schedule_conflicts.length > 0 && (
        <Card label="Heads up" tone="warn">
          <p className="text-sm text-ink">
            You already have {lead.schedule_conflicts.length} class
            {lead.schedule_conflicts.length === 1 ? '' : 'es'} in the slots this family asked for.
          </p>
          <ul className="mt-2 space-y-1">
            {lead.schedule_conflicts.map((clash) => (
              <li key={clash.session_id} className="text-sm text-slate">
                {dateLabel(clash.starts_at)} · {clash.subject}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-slate">
            You can still reply — just offer a slot you can actually keep.
          </p>
        </Card>
      )}

      {lead.replies.length > 0 && (
        <Card label="Your replies so far">
          <ul>
            {lead.replies.map((reply) => (
              <li key={reply.id}>
                <CardRow>
                  <p className="min-w-0 text-sm text-ink">{reply.body}</p>
                  <span className="shrink-0 text-xs text-slate">{ago(reply.sent_at)}</span>
                </CardRow>
              </li>
            ))}
          </ul>

          {lead.existing_quote && (
            <p className="mt-3 border-t border-line pt-3 text-sm text-slate">
              You quoted {money(lead.existing_quote.rate_paise)} per class. Changing it sends the
              family a new quote; they see both.
            </p>
          )}
        </Card>
      )}

      <LeadReplyForm
        matchId={lead.match_id}
        draft={lead.reply_draft}
        suggestedRatePaise={lead.suggested_rate_paise}
      />

      <p className="px-1 text-xs text-slate">
        {lead.charged ? 'This opened used 1 of your lead views. ' : 'Re-opening this lead is free. '}
        {meter && `${meter.remaining ?? 0} left this cycle.`}
        {expiring && ` This lead expires ${countdown(lead.expires_in_minutes)}.`}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li>
      <CardRow>
        <span className="text-sm text-slate">{label}</span>
        <span className="max-w-[60%] text-right text-sm font-medium text-ink">{children}</span>
      </CardRow>
    </li>
  );
}

function sourceLabel(source: string | undefined): string {
  return (
    {
      whatsapp: 'WhatsApp — the family messaged us',
      web: 'The NXTutors website',
      enquiry: 'An enquiry form',
      demo_form: 'A demo class request',
    }[source ?? ''] ?? 'NXTutors'
  );
}
