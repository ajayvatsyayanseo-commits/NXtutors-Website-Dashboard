import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { TutorCard as TutorProfile } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { ActionButton } from '@/components/ui/ActionButton';
import { Avatar, ButtonLink, Chip, Pill, Stat } from '@/components/ui/primitives';
import { toggleSavedTutor } from '@/lib/actions';
import { WEEKDAYS } from '@/lib/format';
import { CheckIcon, MapPinIcon, StarIcon } from '@/components/layout/icons';

export const dynamic = 'force-dynamic';

type Availability = { id: string; weekday: number; start_time: string; end_time: string; mode: string };

type Reviews = {
  count: number;
  average: number;
  breakdown: Record<string, number>;
  items: Array<{
    id: number;
    name: string | null;
    rating: number;
    expertise: number;
    patience: number;
    reliability: number;
    communication: number;
    message: string | null;
    date: string | null;
  }>;
};

type ProfilePayload = TutorProfile & {
  availability: Availability[];
  reviews: Reviews;
  verification: { verified: boolean; missing: string[] };
};

/**
 * The in-app tutor profile: everything a family needs to decide on a demo, on
 * one screen.
 *
 * No phone number and no email appear anywhere, by construction — the API never
 * sends them. That is what makes the contact credit a real limit rather than a
 * suggestion, and it is why the app never links to the public tutor page.
 */
export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ tutorUserId: string }>;
}) {
  const { tutorUserId } = await params;
  const { data: tutor } = await requireApi<ProfilePayload>(`/tutors/${tutorUserId}`);

  const byDay = tutor.availability.reduce<Record<number, Availability[]>>((acc, slot) => {
    (acc[slot.weekday] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <Link href="/user/tutors" className="text-sm font-medium text-accent">
        ← All matches
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          <Avatar src={tutor.image_url || null} name={tutor.name} size={64} />

          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-navy">
              {tutor.name}
              {tutor.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ok">
                  <CheckIcon size={14} /> Verified
                </span>
              )}
            </h1>

            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
              {tutor.reviews.count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <StarIcon filled size={14} />
                  {tutor.reviews.average} ({tutor.reviews.count} reviews)
                </span>
              )}
              {tutor.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon size={14} />
                  {[tutor.area, tutor.city].filter(Boolean).join(', ')}
                </span>
              )}
            </p>

            {tutor.fee_label && (
              <p className="mt-2 text-base font-semibold text-ink">{tutor.fee_label}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={`/user/tutors/${tutor.user_id}/demo`}>Book a free demo</ButtonLink>
          <ActionButton action={toggleSavedTutor.bind(null, tutor.user_id)} tone="secondary">
            Save
          </ActionButton>
        </div>
      </Card>

      {tutor.description && (
        <Card label="About">
          <p className="whitespace-pre-line text-sm text-ink">{tutor.description}</p>
        </Card>
      )}

      <Card label="Teaches">
        <div className="space-y-3">
          <Detail label="Subjects" values={tutor.subjects} />
          <Detail label="Classes" values={tutor.classes} />
          <Detail label="Boards" values={tutor.boards} />
          <Detail label="Mode" values={tutor.teaching_modes} />
        </div>

        {(tutor.education || tutor.experience_years !== null) && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
            {tutor.experience_years !== null && (
              <Stat label="Experience" value={`${tutor.experience_years} yrs`} />
            )}
            {tutor.education && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Qualification</p>
                <p className="mt-1 text-sm font-medium text-ink">{tutor.education}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {tutor.reliability && (
        <Card label="Reliability">
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Overall" value={tutor.reliability.score} />
            <Stat label="Punctuality" value={tutor.reliability.punctuality} />
            <Stat label="Response" value={tutor.reliability.response} />
            <Stat label="Completion" value={tutor.reliability.completion} />
          </div>
          <p className="mt-3 text-xs text-slate">
            Computed nightly from checked-in classes, reply times and completed sessions over the
            last 30 days. It is the same number our matching engine uses.
          </p>
        </Card>
      )}

      <Card label="Availability — next 14 days">
        {tutor.availability.length === 0 ? (
          <p className="text-sm text-slate">
            This tutor has not published a weekly pattern yet. Book a demo and we will find a slot
            that works.
          </p>
        ) : (
          <ul className="space-y-2">
            {WEEKDAYS.map((day, index) =>
              byDay[index] ? (
                <li key={day} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-sm font-medium text-ink">{day}</span>
                  <span className="flex flex-wrap gap-2">
                    {byDay[index].map((slot) => (
                      <Chip key={slot.id}>
                        {slot.start_time}–{slot.end_time}
                        {slot.mode !== 'any' ? ` · ${slot.mode}` : ''}
                      </Chip>
                    ))}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </Card>

      <Card label={`Reviews (${tutor.reviews.count})`}>
        {tutor.reviews.count === 0 ? (
          <p className="text-sm text-slate">
            No reviews yet. From launch, reviews come only from families who completed classes with
            this tutor.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(tutor.reviews.breakdown).map(([key, value]) => (
                <Stat key={key} label={key} value={value || '—'} />
              ))}
            </div>

            <ul className="mt-4 border-t border-line">
              {tutor.reviews.items.slice(0, 6).map((review) => (
                <li key={review.id}>
                  <CardRow>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{review.name ?? 'A parent'}</p>
                      {review.message && (
                        <p className="mt-1 text-sm text-slate">{review.message}</p>
                      )}
                    </div>
                    <Pill tone="accent">{review.rating}/5</Pill>
                  </CardRow>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

function Detail({ label, values }: { label: string; values: string[] }) {
  if (!values || values.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {values.map((value) => (
          <Chip key={value}>{value}</Chip>
        ))}
      </div>
    </div>
  );
}
