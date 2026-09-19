import { requireApi } from '@/lib/api';
import type { Me } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { ButtonLink, EmptyState, InlineUpgrade, MeterBar, SectionHeading } from '@/components/ui/primitives';

export const dynamic = 'force-dynamic';

/**
 * Ask AI.
 *
 * The doubt solver itself runs in the existing NXT AI module on the PHP side
 * (POST /nxt-ai/chat), which already holds the tool allowlist, the rate limits
 * and the conversation scoping. Reimplementing that here would duplicate a
 * guarded surface for no gain, so this screen owns what it should: the meter,
 * the locked state, and the hand-off.
 */
export default async function AskPage() {
  const { data: me } = await requireApi<Me>('/me');

  const meter = me.entitlements.meters.find((m) => m.feature === 'ai.messages');
  const locked = meter ? meter.remaining !== null && meter.remaining <= 0 : false;
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? '';

  return (
    <div className="space-y-3">
      <SectionHeading
        title="Ask AI"
        subtitle="Stuck on a question? Type it or send a photo and get a worked answer."
      />

      {meter && (
        <Card label="Your AI credits">
          <MeterBar
            label={meter.label}
            used={meter.used}
            limit={meter.limit}
            remaining={meter.remaining}
          />
        </Card>
      )}

      {locked ? (
        <InlineUpgrade meterLabel={meter?.label ?? 'AI credits'} plan={null} resetAt={meter?.reset_at ?? null} />
      ) : (
        <Card label="Ask a doubt">
          <p className="text-sm text-slate">
            Answers come back step by step, with the working shown. If one still does not land, send
            the thread to your tutor — that is always free.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={`${site}/#nxt-ai`} external>
              Open the doubt solver
            </ButtonLink>
          </div>

          <p className="mt-3 text-xs text-slate">
            One credit per question. If an answer fails to generate, the credit is returned
            automatically.
          </p>
        </Card>
      )}

      <Card label="Recent threads">
        <EmptyState
          title="No questions yet."
          body="Your past doubts and their answers will be listed here so you can go back to them before a test."
        />
      </Card>
    </div>
  );
}
