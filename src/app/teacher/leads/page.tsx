import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { LeadCard, Meter } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { EmptyState, InlineUpgrade, Pill, SectionHeading } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { ago, countdown, moneyRange, slotLabel } from '@/lib/format';
import { MapPinIcon } from '@/components/layout/icons';

export const dynamic = 'force-dynamic';

/**
 * The leads inbox.
 *
 * Sort order comes from the server and is deterministic: expiry ascending
 * within fit-score buckets, so the best-fit, soonest-expiring lead is always
 * first and the list does not reshuffle between loads.
 *
 * With the meter at zero the list is still shown, with everything past the
 * first row blurred. Hiding it entirely would tell a tutor there is no work,
 * which is both untrue and the opposite of a reason to upgrade.
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'new' } = await searchParams;

  const { data: leads, meta } = await requireApi<LeadCard[]>(`/tutor/leads?tab=${tab}`);

  const meter = meta.meter as (Meter & { allow: boolean; upgrade_plan: string | null }) | undefined;
  const blurBeyondFirst = Boolean(meta.blur_beyond_first);

  return (
    <div>
      <SectionHeading
        title="Leads"
        subtitle={
          meter
            ? `${meter.remaining ?? 0} lead view${meter.remaining === 1 ? '' : 's'} left this cycle`
            : undefined
        }
      />

      <Tabs
        base="/teacher/leads"
        current={tab}
        items={[
          { key: 'new', label: 'New' },
          { key: 'replied', label: 'Replied' },
          { key: 'won', label: 'Won' },
          { key: 'lost', label: 'Lost' },
        ]}
      />

      {leads.length === 0 ? (
        <EmptyState
          title={emptyTitle(tab)}
          body={tab === 'new' ? 'Tutors with a complete profile and a published weekly availability rank higher.' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead, index) => (
            <div
              key={lead.match_id}
              className={
                blurBeyondFirst && index > 0
                  ? 'pointer-events-none select-none blur-sm'
                  : undefined
              }
              aria-hidden={blurBeyondFirst && index > 0}
            >
              <LeadRow lead={lead} />
            </div>
          ))}

          {blurBeyondFirst && meter && (
            <InlineUpgrade
              meterLabel={meter.label}
              plan={meter.upgrade_plan}
              resetAt={meter.reset_at}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadCard }) {
  const expiringSoon =
    lead.expires_in_minutes !== null && lead.expires_in_minutes > 0 && lead.expires_in_minutes < 120;

  return (
    <Card tone={expiringSoon ? 'warn' : 'default'}>
      <Link href={`/teacher/leads/${lead.match_id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">
              {[lead.class_level && `Class ${lead.class_level}`, lead.board, lead.subject]
                .filter(Boolean)
                .join(' ') || 'Tutoring requirement'}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
              <MapPinIcon size={14} />
              {[lead.locality, lead.city].filter(Boolean).join(', ') || 'Location not given'}
              {lead.mode === 'online' ? ' · Online' : ' · At home'}
            </p>

            <p className="mt-1 text-sm text-slate">
              {moneyRange(lead.budget_min_paise, lead.budget_max_paise)}
              {lead.slots.length > 0 && ` · ${lead.slots.map(slotLabel).slice(0, 3).join(', ')}`}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <Pill tone={lead.fit_score >= 90 ? 'accent' : 'neutral'}>Fit {lead.fit_score}%</Pill>
            {lead.opened === false && lead.status === 'offered' && (
              <p className="mt-2">
                <Pill tone="accent">Not opened</Pill>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-slate">
          <span>Received {ago(lead.received_at)}</span>
          {lead.expires_in_minutes !== null && (
            <span className={expiringSoon ? 'font-semibold text-warn' : undefined}>
              {lead.expires_in_minutes > 0
                ? `Expires ${countdown(lead.expires_in_minutes)}`
                : 'Expired'}
            </span>
          )}
        </div>
      </Link>
    </Card>
  );
}

function emptyTitle(tab: string): string {
  return (
    {
      new: 'No new leads yet.',
      replied: 'You have not replied to any leads yet.',
      won: 'No hires yet.',
      lost: 'Nothing here.',
    }[tab] ?? 'Nothing here.'
  );
}
