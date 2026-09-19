import { requireApi } from '@/lib/api';
import type { StudentHome } from '@/lib/types';
import { NextSessionCard } from '@/components/student/NextSessionCard';
import {
  AskAiCard,
  HomeworkDueCard,
  RenewalCard,
  ThisWeekCard,
  TrackerCard,
  UpcomingSessionsCard,
} from '@/components/student/HomeCards';
import { Card } from '@/components/ui/Card';
import { ButtonLink, EmptyState } from '@/components/ui/primitives';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Student / parent Home.
 *
 * Everything on this screen comes from one GET /home call, which is what keeps
 * it inside its budget on a mid-range Android over 4G. The card order is fixed
 * and decided here, not by the data arriving: next session, homework, this
 * week, Ask AI, tracker, renewal.
 *
 * Home has two shapes and the server picks between them. A family with no
 * hired tutor sees the requirement tracker first; a family with one sees Today.
 */
export default async function StudentHomePage() {
  const { data: home } = await requireApi<StudentHome>('/home');

  const aiMeter = home.entitlements.meters.find((m) => m.feature === 'ai.messages');
  const hasNothing =
    !home.next_session &&
    home.homework.count === 0 &&
    home.requirements.length === 0 &&
    home.wallet.active_packages === 0;

  if (hasNothing) {
    return <FirstRun name={home.profile.name} />;
  }

  return (
    <div className="space-y-3">
      {home.next_session && <NextSessionCard session={home.next_session} />}

      <HomeworkDueCard homework={home.homework} />

      <ThisWeekCard week={home.this_week} summary={home.latest_summary} />

      <AskAiCard remaining={aiMeter?.remaining ?? 0} />

      {home.requirements.map((requirement) => (
        <TrackerCard key={requirement.id} requirement={requirement} />
      ))}

      {home.renewal && <RenewalCard renewal={home.renewal} />}

      <UpcomingSessionsCard sessions={home.upcoming_sessions} />

      {home.wallet.held_paise > 0 && (
        <Card label="Held for upcoming classes">
          <p className="text-sm text-slate">
            <strong className="font-semibold text-ink">{money(home.wallet.held_paise)}</strong> is
            held against classes that have been scheduled but not yet taught. It is released to your
            tutor as each class is completed and confirmed.
          </p>
          <div className="mt-3">
            <ButtonLink href="/user/account?tab=wallet" tone="secondary">
              Open wallet
            </ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * First run: no requirement, no tutor, nothing to show. The one thing this
 * screen has to do is get the family to tell us what they need.
 */
function FirstRun({ name }: { name: string | null }) {
  return (
    <div className="space-y-3">
      <Card label={`Welcome${name ? `, ${name.split(' ')[0]}` : ''}`}>
        <EmptyState
          title="Tell us what your child needs and we will find 2–3 verified tutors."
          body="It takes about two minutes: the class and board, the subject, whether you want classes at home or online, and the slots that suit you."
          action={<ButtonLink href="/user/tutors/new">Start</ButtonLink>}
        />
      </Card>

      <Card label="Meanwhile">
        <ul className="space-y-3 text-sm">
          <li>
            <a href="/user/ask" className="font-medium text-accent">
              Ask AI a doubt
            </a>
            <span className="text-slate"> — free questions every day on your plan.</span>
          </li>
          <li>
            <a href="/user/tutors" className="font-medium text-accent">
              Browse verified tutors
            </a>
            <span className="text-slate"> — see who teaches near you before you commit.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
