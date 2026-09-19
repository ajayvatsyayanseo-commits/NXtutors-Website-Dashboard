import { requireApi, tryApi } from '@/lib/api';
import type { MatchesPayload, TutorCard } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { ButtonLink, EmptyState, SectionHeading } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { MatchCard } from '@/components/student/MatchCard';
import { Avatar, Pill } from '@/components/ui/primitives';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

/**
 * Tutors: the matching engine's recommendations, and the shortlist.
 *
 * The public tutor page is never used inside the app. Everything here is the
 * in-app profile keyed by the tutor's id, which is what keeps contact details
 * off the screen and the contact meter enforceable.
 */
export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'matches' } = await searchParams;

  const { data } = await requireApi<MatchesPayload>('/matches');
  const saved = tab === 'saved' ? await tryApi<TutorCard[]>('/saved-tutors') : null;

  return (
    <div>
      <SectionHeading
        title="Tutors"
        subtitle="Verified tutors matched to what you asked for."
      />

      <Tabs
        base="/user/tutors"
        current={tab}
        items={[
          { key: 'matches', label: 'Matches', badge: data.matches.length },
          { key: 'saved', label: 'Saved', badge: data.saved.length },
        ]}
      />

      {tab === 'matches' && <MatchesTab data={data} />}

      {tab === 'saved' && (
        <div className="space-y-3">
          {!saved || saved.length === 0 ? (
            <EmptyState
              title="No saved tutors yet."
              body="Save a tutor from their card to keep a shortlist while you decide."
            />
          ) : (
            saved.map((tutor) => (
              <Card key={tutor.user_id}>
                <div className="flex items-start gap-3">
                  <Avatar src={tutor.image_url || null} name={tutor.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/user/tutors/${tutor.user_id}`}
                      className="text-sm font-semibold text-navy"
                    >
                      {tutor.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate">
                      {[tutor.city, tutor.fee_label].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {tutor.verified && <Pill tone="ok">Verified</Pill>}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MatchesTab({ data }: { data: MatchesPayload }) {
  const openLead = data.leads.find((lead) =>
    ['received', 'matching', 'matches_ready'].includes(lead.status),
  );

  if (data.matches.length === 0) {
    // "Matching" and "nothing found" are genuinely different situations and the
    // brief asks for different copy: one is a wait, the other needs ops.
    if (openLead && openLead.status === 'matching') {
      return (
        <EmptyState
          title={`Checking tutors near ${openLead.locality ?? openLead.city ?? 'you'}`}
          body="This usually takes about a minute. We will send you a WhatsApp message the moment your matches are ready."
        />
      );
    }

    if (openLead) {
      return (
        <EmptyState
          title="We are widening the search."
          body="Nobody fit your budget and slots exactly, so our team is looking further out. We will be in touch today."
        />
      );
    }

    return (
      <EmptyState
        title="Tell us what your child needs and we will find 2–3 verified tutors."
        body="The class and board, the subject, at home or online, and the slots that suit you."
        action={<ButtonLink href="/user/tutors/new">Start</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.matches.map((match) => (
        <MatchCard key={match.id} match={match} saved={data.saved.includes(match.tutor.user_id)} />
      ))}

      <p className="px-1 text-xs text-slate">
        Matches are ranked by fit against the class, board, subject, budget, distance and the slots
        you asked for. Tell us a match is wrong and the engine replaces it.
      </p>
    </div>
  );
}
