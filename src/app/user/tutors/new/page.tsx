import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { Me } from '@/lib/types';
import { SectionHeading } from '@/components/ui/primitives';
import { RequirementForm } from '@/components/student/RequirementForm';

export const dynamic = 'force-dynamic';

/**
 * Post a requirement.
 *
 * Every "Start" and "Find a tutor" button in the student app points here. The
 * Blade site sent a logged-in family out to a public enquiry page; doing it
 * inside the dashboard means the requirement arrives attached to the account,
 * so the tracker on Home can follow it from Received through to Hired.
 *
 * The form starts pre-filled from the family's own profile — class, board and
 * locality are already known, and re-typing them is the fastest way to lose
 * someone two fields in.
 */
export default async function NewRequirementPage() {
  const { data: me } = await requireApi<Me>('/me');

  return (
    <div className="space-y-3">
      <Link href="/user/tutors" className="text-sm font-medium text-accent">
        ← Back
      </Link>

      <SectionHeading
        title="Find a tutor"
        subtitle="About two minutes. We come back with two or three verified tutors who fit."
      />

      <RequirementForm
        defaults={{
          class_level: me.user.for_class,
          board: me.user.class_type,
          city: me.user.city,
          locality: me.user.district,
        }}
      />
    </div>
  );
}
