import { requireApi, tryApi } from '@/lib/api';
import type { HomeworkCard, ProgressPayload, SessionDetail, StudyPlanPayload } from '@/lib/types';
import { SectionHeading } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import {
  HomeworkPanel,
  ProgressPanel,
  SessionsPanel,
  StudyPlanPanel,
} from '@/components/student/LearnPanels';

export const dynamic = 'force-dynamic';

/**
 * Learn: sessions, homework, study plan and progress.
 *
 * Only the panel being viewed is fetched. Loading all four on every visit would
 * pull the progress heatmap and the whole session history down on a connection
 * that is usually someone's phone data.
 */
export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'sessions' } = await searchParams;

  const homework =
    tab === 'homework'
      ? await tryApi<{ open: HomeworkCard[]; done: HomeworkCard[] }>('/homework')
      : null;

  return (
    <div>
      <SectionHeading
        title="Learn"
        subtitle="Every class, what was covered and how it is going."
      />

      <Tabs
        base="/user/learn"
        current={tab}
        items={[
          { key: 'sessions', label: 'Classes' },
          { key: 'homework', label: 'Homework' },
          { key: 'plan', label: 'Study plan' },
          { key: 'progress', label: 'Progress' },
        ]}
      />

      {tab === 'sessions' && <SessionsTab />}
      {tab === 'homework' && (
        <HomeworkPanel open={homework?.open ?? []} done={homework?.done ?? []} />
      )}
      {tab === 'plan' && <PlanTab />}
      {tab === 'progress' && <ProgressTab />}
    </div>
  );
}

async function SessionsTab() {
  const { data } = await requireApi<SessionDetail[]>('/sessions');
  return <SessionsPanel sessions={data} />;
}

async function PlanTab() {
  const { data } = await requireApi<StudyPlanPayload>('/study-plan');
  return <StudyPlanPanel plan={data} />;
}

async function ProgressTab() {
  const { data } = await requireApi<ProgressPayload>('/progress');
  return <ProgressPanel progress={data} />;
}
