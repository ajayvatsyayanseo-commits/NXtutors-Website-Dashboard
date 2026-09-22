import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * The server-side client for the Laravel dashboard API.
 *
 * Authentication is the site's own session. The visitor's browser sends the
 * PHP session cookie to this app because both are served from the same host;
 * this module forwards that cookie verbatim on every call. There is no second
 * login, no token to store and nothing to keep in sync — which is the whole
 * point of serving the dashboard from the site's own paths.
 *
 * Every fetch runs on the server. The browser never holds an API credential and
 * never talks to Laravel directly, so a stolen client-side token is not a thing
 * that can exist here.
 */

const ORIGIN = process.env.LARAVEL_ORIGIN ?? 'http://localhost:8000';
const BASE = `${ORIGIN}/api/dashboard/v1`;

export type ApiEnvelope<T> = {
  data: T;
  meta: Record<string, unknown>;
  errors: Array<{ code: string; message: string }>;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly meta: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function forwardedHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return {
    Accept: 'application/json',
    Cookie: cookieHeader,
    // Laravel's rate limiters and audit log should see the real visitor, not
    // this server, so the forwarded-for chain is preserved.
    'X-Forwarded-For': headerStore.get('x-forwarded-for') ?? '',
    'X-Requested-With': 'XMLHttpRequest',
  };
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Seconds to cache. Dashboard reads are per-visitor, so this is off by default. */
  revalidate?: number;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, revalidate } = options;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(await forwardedHeaders()),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: revalidate === undefined ? 'no-store' : undefined,
    next: revalidate === undefined ? undefined : { revalidate },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    const error = payload?.errors?.[0];
    throw new ApiError(
      response.status,
      error?.code ?? 'request_failed',
      error?.message ?? 'Something went wrong on our side.',
      payload?.meta ?? {},
    );
  }

  if (!payload) {
    throw new ApiError(response.status, 'bad_response', 'We could not read the response.');
  }

  return payload;
}

/**
 * Fetch, or send an unauthenticated visitor to the site's login page.
 *
 * A dashboard route has nothing meaningful to render without an identity, so
 * failing over to the login screen is the honest outcome rather than showing a
 * shell full of empty states that look like the account has no data.
 */
export async function requireApi<T>(path: string, options?: RequestOptions): Promise<ApiEnvelope<T>> {
  try {
    return await api<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      const site = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? ORIGIN;
      redirect(`${site}/login`);
    }

    throw error;
  }
}

/**
 * For cards that should fail on their own without taking the screen with them.
 *
 * The brief is explicit that one card erroring must still leave the rest of
 * Home rendered, so a caller that can degrade uses this and renders an error
 * state in that card's place.
 */
export async function tryApi<T>(path: string, options?: RequestOptions): Promise<T | null> {
  try {
    const { data } = await api<T>(path, options);
    return data;
  } catch {
    return null;
  }
}
