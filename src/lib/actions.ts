'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from './api';

/**
 * Every write the dashboard performs.
 *
 * These run on the server and reuse the same cookie-forwarding client as the
 * reads, so the browser never holds an API credential and a form post cannot be
 * replayed against Laravel from outside this app.
 *
 * They all return the same {ok, message, meta} shape rather than throwing, so a
 * blocked meter or a validation failure renders inline next to the control the
 * user pressed — which is where the brief wants an upgrade prompt to appear.
 */

export type ActionResult = {
  ok: boolean;
  message?: string;
  code?: string;
  meta?: Record<string, unknown>;
};

async function run(
  fn: () => Promise<unknown>,
  revalidate: string[],
  successMessage?: string,
): Promise<ActionResult> {
  try {
    await fn();
    revalidate.forEach((path) => revalidatePath(path));
    return { ok: true, message: successMessage };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, message: error.message, code: error.code, meta: error.meta };
    }

    return {
      ok: false,
      message: 'Something went wrong on our side. Try again, or message us on WhatsApp.',
      code: 'unknown',
    };
  }
}

// -------------------------------------------------------------------- student

export async function confirmSession(sessionId: string): Promise<ActionResult> {
  return run(
    () => api(`/sessions/${sessionId}/confirm`, { method: 'POST' }),
    ['/user/learn', '/user/dashboard', `/user/learn/${sessionId}`],
    'Class confirmed. Your tutor has been paid for it.',
  );
}

export async function disputeSession(
  sessionId: string,
  reason: string,
  detail?: string,
): Promise<ActionResult> {
  return run(
    () => api(`/sessions/${sessionId}/dispute`, { method: 'POST', body: { reason, detail } }),
    ['/user/learn', `/user/learn/${sessionId}`],
    'Raised with our team. Payment for this class is held until it is resolved.',
  );
}

export async function cancelSession(sessionId: string, reason?: string): Promise<ActionResult> {
  return run(
    () => api(`/sessions/${sessionId}/cancel`, { method: 'POST', body: { reason } }),
    ['/user/learn', '/user/dashboard'],
    'Class cancelled.',
  );
}

export async function submitHomework(
  homeworkId: string,
  files: string[],
  note?: string,
): Promise<ActionResult> {
  return run(
    () => api(`/homework/${homeworkId}/submit`, { method: 'POST', body: { files, note } }),
    ['/user/learn', '/user/dashboard', `/user/learn/homework/${homeworkId}`],
    'Sent to your tutor.',
  );
}

export async function tickPlanItem(itemId: string): Promise<ActionResult> {
  return run(() => api(`/study-plan/items/${itemId}/done`, { method: 'POST' }), ['/user/learn']);
}

export async function contactMatch(matchId: string): Promise<ActionResult> {
  return run(
    () => api(`/matches/${matchId}/contact`, { method: 'POST' }),
    ['/user/tutors', '/user/dashboard'],
    'You can now message this tutor.',
  );
}

export async function rejectMatch(matchId: string, reason: string): Promise<ActionResult> {
  return run(
    () => api(`/matches/${matchId}/reject`, { method: 'POST', body: { reason } }),
    ['/user/tutors'],
    'Noted. We will find someone else.',
  );
}

export async function toggleSavedTutor(tutorUserId: string): Promise<ActionResult> {
  return run(() => api(`/tutors/${tutorUserId}/save`, { method: 'POST' }), ['/user/tutors']);
}

export async function createRequirement(body: Record<string, unknown>): Promise<ActionResult> {
  return run(
    () => api('/requirements', { method: 'POST', body }),
    ['/user/dashboard', '/user/tutors'],
    'Sent. We are finding tutors who fit.',
  );
}

// ---------------------------------------------------------------------- tutor

export async function replyToLead(
  matchId: string,
  body: string,
  ratePaise?: number,
): Promise<ActionResult> {
  return run(
    () =>
      api(`/tutor/leads/${matchId}/reply`, {
        method: 'POST',
        body: { body, rate_paise: ratePaise, ai_drafted: false },
      }),
    ['/teacher/leads', '/teacher/dashboard', `/teacher/leads/${matchId}`],
    'Sent to the family through the platform.',
  );
}

export async function declineLead(matchId: string, reason: string): Promise<ActionResult> {
  return run(
    () => api(`/tutor/leads/${matchId}/decline`, { method: 'POST', body: { reason } }),
    ['/teacher/leads', '/teacher/dashboard'],
    'Declined.',
  );
}

export async function checkInSession(
  sessionId: string,
  method: 'parent_otp' | 'geofence' | 'online_join' | 'manual',
  coords?: { lat?: number; lng?: number; accuracy_m?: number },
  code?: string,
): Promise<ActionResult> {
  return run(
    () =>
      api(`/tutor/sessions/${sessionId}/check-in`, {
        method: 'POST',
        body: { method, ...coords, ...(code ? { code } : {}) },
      }),
    ['/teacher/dashboard', '/teacher/students', `/teacher/students/session/${sessionId}`],
    'Checked in.',
  );
}

/**
 * Ask us to send the family their code again.
 *
 * The code goes to the family, never to the caller — asking for it proves
 * nothing on its own, which is what keeps it evidence.
 */
export async function resendCheckInCode(sessionId: string): Promise<ActionResult> {
  return run(
    () => api(`/tutor/sessions/${sessionId}/check-in-code`, { method: 'POST' }),
    [],
    'Sent. Ask the family to read out the 4-digit code.',
  );
}

/** The family did not turn up. The class is charged in full. */
export async function recordFamilyNoShow(sessionId: string): Promise<ActionResult> {
  return run(
    () => api(`/tutor/sessions/${sessionId}/no-show`, { method: 'POST' }),
    ['/teacher/dashboard', '/teacher/students', `/teacher/students/session/${sessionId}`],
    'Recorded. You are paid for the class in full.',
  );
}

/** The tutor did not turn up. The hold comes back and the pack gains a class. */
export async function reportTutorNoShow(sessionId: string): Promise<ActionResult> {
  return run(
    () => api(`/sessions/${sessionId}/no-show`, { method: 'POST' }),
    ['/user/learn', '/user/dashboard', `/user/learn/${sessionId}`],
    'Recorded. The fee is back in your balance and the class has been added back to your pack.',
  );
}

export async function checkOutSession(
  sessionId: string,
  payload: {
    topics: string[];
    actual_min?: number;
    confidence?: number;
    homework?: { title?: string; instructions?: string; due_at?: string };
    shared_note?: string;
  },
): Promise<ActionResult> {
  return run(
    () => api(`/tutor/sessions/${sessionId}/check-out`, { method: 'POST', body: payload }),
    ['/teacher/dashboard', '/teacher/students', `/teacher/students/session/${sessionId}`],
    'Checked out. The family has been told what you covered.',
  );
}

export async function markHomework(
  homeworkId: string,
  payload: { score?: number; grade?: string; comment?: string },
): Promise<ActionResult> {
  return run(
    () => api(`/tutor/homework/${homeworkId}/mark`, { method: 'POST', body: payload }),
    ['/teacher/students', '/teacher/dashboard'],
    'Marked. The family sees this straight away.',
  );
}

export async function addStudentNote(
  studentUserId: string,
  body: string,
  visibility: 'private' | 'shared',
): Promise<ActionResult> {
  return run(
    () => api(`/tutor/students/${studentUserId}/notes`, { method: 'POST', body: { body, visibility } }),
    [`/teacher/students/${studentUserId}`],
    visibility === 'shared' ? 'Saved and shared with the family.' : 'Saved. Only you can see this.',
  );
}

export async function setAvailability(
  slots: Array<{ weekday: number; start_time: string; end_time: string; mode?: string }>,
): Promise<ActionResult> {
  return run(
    () => api('/tutor/availability', { method: 'PUT', body: { slots } }),
    ['/teacher/students', '/teacher/dashboard'],
    'Availability updated. Matching will use it within a few minutes.',
  );
}

export async function scheduleSession(body: Record<string, unknown>): Promise<ActionResult> {
  return run(
    () => api('/tutor/sessions', { method: 'POST', body }),
    ['/teacher/students', '/teacher/dashboard'],
    'Class scheduled and the family notified.',
  );
}

// -------------------------------------------------------------------- profile

/**
 * Save one section of the caller's own profile.
 *
 * No record id is passed, and the API would ignore one if it were. The Blade
 * form this replaces took its target from `$request->id` with no ownership
 * check, so the id in a hidden field decided whose profile was rewritten.
 */
export async function updateProfile(
  section: string,
  values: Record<string, string>,
): Promise<ActionResult> {
  return run(
    () => api('/profile', { method: 'PATCH', body: { section, ...values } }),
    ['/user/account', '/teacher/growth', '/teacher/dashboard', '/user/dashboard'],
    'Saved.',
  );
}

export async function changePassword(
  currentPassword: string,
  password: string,
  passwordConfirmation: string,
): Promise<ActionResult> {
  return run(
    () =>
      api('/profile/password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        },
      }),
    [],
    'Password changed.',
  );
}

// --------------------------------------------------------------------- shared

export async function markNotificationRead(id: string): Promise<ActionResult> {
  return run(() => api(`/notifications/${id}/read`, { method: 'PATCH' }), ['/user/account', '/teacher/growth']);
}

// ------------------------------------------------------------------- messages

export async function sendMessage(threadKey: string, body: string): Promise<ActionResult> {
  return run(
    () => api('/messages', { method: 'POST', body: { thread_key: threadKey, body } }),
    ['/user/account', '/teacher/growth'],
    'Sent.',
  );
}

export async function markThreadRead(threadKey: string): Promise<ActionResult> {
  return run(
    () => api('/messages/read', { method: 'POST', body: { thread_key: threadKey } }),
    ['/user/account', '/teacher/growth'],
  );
}
