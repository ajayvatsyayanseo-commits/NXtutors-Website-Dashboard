import Link from 'next/link';
import type { Match } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { ActionButton } from '@/components/ui/ActionButton';
import { Avatar, ButtonLink, Pill } from '@/components/ui/primitives';
import { contactMatch, toggleSavedTutor } from '@/lib/actions';
import { CheckIcon, MapPinIcon, StarIcon } from '@/components/layout/icons';

/**
 * One match, with the engine's reasons for making it.
 *
 * The reasons are rendered exactly as the engine supplied them and are never
 * assembled here from the tutor's fields. The live site's six identical review
 * lines are what happens when a card writes its own justification; a reason a
 * parent cannot act on is worse than no reason.
 */
export function MatchCard({ match, saved }: { match: Match; saved: boolean }) {
  const tutor = match.tutor;
  const contacted = match.status === 'contacted';

  return (
    <Card tone={match.rank === 1 ? 'accent' : 'default'}>
      <div className="flex items-start gap-3">
        <Avatar src={tutor.image_url || null} name={tutor.name} size={56} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/user/tutors/${tutor.user_id}`} className="text-base font-semibold text-navy">
              {tutor.name}
            </Link>
            {tutor.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-ok">
                <CheckIcon size={14} /> Verified
              </span>
            )}
            <Pill tone="accent">Fit {match.fit_score}%</Pill>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
            {tutor.review_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <StarIcon filled size={14} />
                {tutor.rating} ({tutor.review_count})
              </span>
            )}
            {tutor.city && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon size={14} />
                {tutor.city}
              </span>
            )}
            {tutor.experience_years !== null && <span>{tutor.experience_years} yrs experience</span>}
            {tutor.fee_label && <span>{tutor.fee_label}</span>}
          </p>

          {tutor.subjects.length > 0 && (
            <p className="mt-1 text-sm text-slate">{tutor.subjects.slice(0, 4).join(' · ')}</p>
          )}
        </div>
      </div>

      {match.reasons.length > 0 && (
        <div className="mt-3 rounded-card bg-canvas p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Why this match
          </p>
          <ul className="mt-2 space-y-1.5">
            {match.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-accent">
                  <CheckIcon size={14} />
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tutor.reliability && (
        <p className="mt-3 text-sm text-slate">
          Reliability {tutor.reliability.score}/100 — punctuality {tutor.reliability.punctuality},
          response {tutor.reliability.response}, completion {tutor.reliability.completion}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ButtonLink href={`/user/tutors/${tutor.user_id}`}>Book a free demo</ButtonLink>

        {contacted ? (
          <Pill tone="ok">Contacted</Pill>
        ) : (
          <ActionButton action={contactMatch.bind(null, match.id)} tone="secondary">
            Contact (1 credit)
          </ActionButton>
        )}

        <ActionButton action={toggleSavedTutor.bind(null, tutor.user_id)} tone="ghost">
          {saved ? 'Saved' : 'Save'}
        </ActionButton>
      </div>

      <p className="mt-3 text-xs text-slate">
        Contacting a tutor costs one credit, once — however many messages follow. Their phone number
        stays private; messages go through NXTutors.
      </p>
    </Card>
  );
}
