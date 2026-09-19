import { requireApi, tryApi } from '@/lib/api';
import type { Me } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { ButtonLink, EmptyState, MeterBar, Pill, SectionHeading } from '@/components/ui/primitives';
import { ago } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Artefact = {
  id: string;
  tool: string;
  title: string | null;
  version: number;
  created_at: string | null;
};

/**
 * Studio: the AI tools sold on the tutor plans.
 *
 * Each tool is gated by the plan that includes it, and the cost is stated
 * before anything is generated — the brief is specific that credits are debited
 * per generation, not per token, and that the tutor sees the price first.
 *
 * The generators themselves arrive with the Studio agents. What ships here is
 * the surface: what each tool costs, whether this plan has it, and the artefacts
 * already produced.
 */
const TOOLS = [
  {
    key: 'lesson_plan',
    name: 'Lesson plan',
    description:
      'Objectives, a teaching sequence, worked examples and checks for understanding, built from the chapter and the topics this student is weakest on.',
    credits: 5,
    plans: ['Tutor Pro', 'Tutor Premium', 'Tutor Featured'],
  },
  {
    key: 'worksheet',
    name: 'Worksheet',
    description: 'A practice sheet at a difficulty mix you choose, with or without answers, exported as an A4 PDF in your name.',
    credits: 5,
    plans: ['Tutor Pro', 'Tutor Premium', 'Tutor Featured'],
  },
  {
    key: 'demo_script',
    name: 'Demo class script',
    description: 'A plan for the free demo, built from the requirement and what the parent actually wrote.',
    credits: 3,
    plans: ['Tutor Premium', 'Tutor Featured'],
  },
  {
    key: 'profile_builder',
    name: 'Profile builder',
    description:
      'Rewrites your headline, bio and subject descriptions from a short interview. It never invents a credential — every claim maps to a field you filled in.',
    credits: 8,
    plans: ['Tutor Pro', 'Tutor Premium', 'Tutor Featured'],
  },
  {
    key: 'reply_template',
    name: 'Reply templates',
    description: 'Saved replies with the parent name, subject, slot and rate filled in for you.',
    credits: 0,
    plans: ['Tutor Pro', 'Tutor Premium', 'Tutor Featured'],
  },
];

export default async function StudioPage() {
  const { data: me } = await requireApi<Me>('/me');
  const artefacts = await tryApi<Artefact[]>('/tutor/artefacts');

  const planName = me.entitlements.plan.name;
  const aiMeter = me.entitlements.meters.find((m) => m.feature === 'ai.messages');

  return (
    <div className="space-y-3">
      <SectionHeading
        title="Studio"
        subtitle="Tools that produce something you can edit, save and send."
      />

      {aiMeter && (
        <Card label="Your AI credits">
          <MeterBar
            label={aiMeter.label}
            used={aiMeter.used}
            limit={aiMeter.limit}
            remaining={aiMeter.remaining}
          />
        </Card>
      )}

      {TOOLS.map((tool) => {
        const included = tool.plans.includes(planName);

        return (
          <Card key={tool.key} tone={included ? 'default' : 'default'}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{tool.name}</p>
                <p className="mt-1 text-sm text-slate">{tool.description}</p>
              </div>
              {included ? (
                <Pill tone="accent">
                  {tool.credits === 0 ? 'Included' : `${tool.credits} credits`}
                </Pill>
              ) : (
                <Pill tone="neutral">Not on your plan</Pill>
              )}
            </div>

            <div className="mt-3">
              {included ? (
                <ButtonLink href={`/teacher/studio/${tool.key}`} tone="secondary">
                  Open {tool.name.toLowerCase()}
                </ButtonLink>
              ) : (
                <p className="text-sm text-slate">
                  Available on {tool.plans[0]} and above.{' '}
                  <a
                    href={`${process.env.NEXT_PUBLIC_SITE_ORIGIN ?? ''}/pricing`}
                    className="font-medium text-accent"
                  >
                    See plans
                  </a>
                </p>
              )}
            </div>
          </Card>
        );
      })}

      <Card label="What you have made">
        {!artefacts || artefacts.length === 0 ? (
          <EmptyState
            title="Nothing yet."
            body="Everything a tool produces is saved here, editable, and can be attached to a class or sent as homework."
          />
        ) : (
          <ul>
            {artefacts.map((artefact) => (
              <li key={artefact.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {artefact.title ?? artefact.tool.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-sm text-slate">
                      v{artefact.version} · {ago(artefact.created_at)}
                    </p>
                  </div>
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-xs text-slate">
        Credits are charged per generation, never per word, and the cost is shown before you start.
        A generation that fails or that you cancel refunds the credit automatically.
      </p>
    </div>
  );
}
