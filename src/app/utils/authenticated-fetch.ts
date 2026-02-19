import { apiFetch } from './api-fetch';

/**
 * Error thrown when a session is irrecoverably expired (retry with fresh token also got 401).
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

type GetTokenFn = (opts?: { skipCache?: boolean }) => Promise<string | null>;

// Single-refresh promise: when multiple requests fail with 401 at the same time,
// only one token refresh is performed and all waiters share the result.
let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(getToken: GetTokenFn): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = getToken({ skipCache: true }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Wrapper around `apiFetch` that automatically retries once on 401
 * by forcing a fresh Clerk token via `getToken({ skipCache: true })`.
 *
 * If the retry also returns 401, throws `SessionExpiredError`.
 */
export async function authenticatedFetch(
  getToken: GetTokenFn,
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await apiFetch(input, { ...init, headers });

  if (response.status === 401) {
    // Force a fresh token and retry once
    const freshToken = await refreshToken(getToken);
    if (!freshToken) {
      throw new SessionExpiredError();
    }

    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${freshToken}`);

    const retryResponse = await apiFetch(input, { ...init, headers: retryHeaders });

    if (retryResponse.status === 401) {
      throw new SessionExpiredError();
    }

    return retryResponse;
  }

  return response;
}
