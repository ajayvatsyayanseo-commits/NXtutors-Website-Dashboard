import type { TutorSessionRow } from '@/lib/types';

/**
 * The calendar payload, as this route reads it.
 *
 * The session sheet deliberately loads the calendar rather than a session by
 * id: the calendar endpoint is already scoped to the signed-in tutor, so there
 * is no id to authorise separately and no way to reach another tutor's class.
 */
export type CalendarPayloadShape = {
  from: string;
  to: string;
  sessions: TutorSessionRow[];
  availability: Array<{
    id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    mode: string;
  }>;
};
