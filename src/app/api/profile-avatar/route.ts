import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Forwards a profile photo to the Laravel API.
 *
 * The only route handler in the app. Everything else reads and writes through
 * server components and server actions; a file upload needs a multipart stream
 * that those cannot carry without buffering it whole, so it gets a handler.
 *
 * The visitor's session cookie is forwarded exactly as it arrived, so Laravel
 * applies the same authorisation to this as to every other call — the upload
 * lands on the row the session identifies, never one named in the request.
 */
const ORIGIN = process.env.LARAVEL_ORIGIN ?? 'http://localhost:8000';

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const form = await request.formData();

  const response = await fetch(`${ORIGIN}/api/dashboard/v1/profile/avatar`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: form,
  });

  const payload = await response.json().catch(() => ({
    data: null,
    meta: {},
    errors: [{ code: 'bad_response', message: 'We could not read the response.' }],
  }));

  return NextResponse.json(payload, { status: response.status });
}
