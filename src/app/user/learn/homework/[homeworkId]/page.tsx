import Link from 'next/link';
import { requireApi } from '@/lib/api';
import type { HomeworkCard } from '@/lib/types';
import { Card, CardRow } from '@/components/ui/Card';
import { Pill, SectionHeading, StatusPill } from '@/components/ui/primitives';
import { dateTimeLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

type HomeworkDetail = HomeworkCard & {
  attachments: string[];
  submissions: Array<{ id: string; files: string[]; note: string | null; submitted_at: string | null }>;
  marks: Array<{
    id: string;
    score: number | null;
    grade: string | null;
    comment: string | null;
    marked_at: string | null;
  }>;
};

/**
 * One homework item: what was set, what was sent back, and how it was marked.
 *
 * Uploaded work is served by short-lived signed URLs, so nothing here is a
 * public link — a copied address stops working within fifteen minutes.
 */
export default async function HomeworkPage({
  params,
}: {
  params: Promise<{ homeworkId: string }>;
}) {
  const { homeworkId } = await params;
  const { data: homework } = await requireApi<HomeworkDetail>(`/homework/${homeworkId}`);

  return (
    <div className="space-y-3">
      <Link href="/user/learn?tab=homework" className="text-sm font-medium text-accent">
        ← All homework
      </Link>

      <SectionHeading
        title={homework.title}
        subtitle={[homework.subject, homework.tutor?.name].filter(Boolean).join(' · ')}
        action={
          homework.overdue ? <Pill tone="warn">Overdue</Pill> : <StatusPill status={homework.status} />
        }
      />

      <Card label="What to do">
        <p className="whitespace-pre-line text-sm text-ink">
          {homework.instructions ?? 'No extra instructions were given.'}
        </p>
        {homework.due_at && (
          <p className="mt-3 border-t border-line pt-3 text-sm text-slate">
            Due {dateTimeLabel(homework.due_at)}
          </p>
        )}
      </Card>

      <Card label="What you sent">
        {homework.submissions.length === 0 ? (
          <p className="text-sm text-slate">
            Nothing submitted yet. Take clear photos of each page — your tutor marks the working, not
            just the answer.
          </p>
        ) : (
          <ul>
            {homework.submissions.map((submission) => (
              <li key={submission.id}>
                <CardRow>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {submission.files.length} page{submission.files.length === 1 ? '' : 's'}
                    </p>
                    {submission.note && (
                      <p className="mt-0.5 text-sm text-slate">{submission.note}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm text-slate">
                    {dateTimeLabel(submission.submitted_at)}
                  </span>
                </CardRow>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {homework.marks.length > 0 && (
        <Card label="How it was marked">
          <ul>
            {homework.marks.map((mark) => (
              <li key={mark.id}>
                <CardRow>
                  <div className="min-w-0">
                    {mark.comment && <p className="text-sm text-ink">{mark.comment}</p>}
                    <p className="mt-1 text-xs text-muted">{dateTimeLabel(mark.marked_at)}</p>
                  </div>
                  {mark.score !== null && <Pill tone="ok">{mark.score}%</Pill>}
                </CardRow>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
