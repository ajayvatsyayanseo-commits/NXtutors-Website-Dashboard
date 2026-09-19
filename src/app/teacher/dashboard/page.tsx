import { requireApi } from '@/lib/api';
import type { TutorHome } from '@/lib/types';
import {
  CompletenessCard,
  LeadsCard,
  ThisMonthCard,
  TodayCard,
  UnmarkedHomeworkCard,
  VerificationBlockedCard,
} from '@/components/tutor/HomeCards';

export const dynamic = 'force-dynamic';

/**
 * Tutor Home: what to do next, and how the month is going.
 *
 * One GET, and the order below is the contract. Verification first when it is
 * blocking, because nothing else on this screen is actionable until it clears.
 */
export default async function TutorHomePage() {
  const { data: home } = await requireApi<TutorHome>('/tutor/home');

  return (
    <div className="space-y-3">
      {!home.can_receive_leads && <VerificationBlockedCard verification={home.verification} />}

      <TodayCard today={home.today} next={home.next_session} />

      <LeadsCard leads={home.leads} />

      <ThisMonthCard
        month={home.this_month}
        reliability={home.reliability}
        rating={home.rating}
      />

      <UnmarkedHomeworkCard homework={home.unmarked_homework} />

      <CompletenessCard completeness={home.completeness} />
    </div>
  );
}
