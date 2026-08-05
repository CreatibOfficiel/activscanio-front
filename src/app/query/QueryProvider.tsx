'use client';

import { PropsWithChildren, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions,
} from '@tanstack/react-query';
import { registerQueryClientForUserCache } from '../hooks/useCurrentUserData';

/**
 * Defaults tuned for this app specifically.
 *
 * `staleTime: 30s` as the floor, not a blanket policy — each hook overrides it
 * with a value that matches how fast its data actually moves (see the
 * `staleTime` passed by `useCurrentUser`, `useCompetitors`, etc.). 30s is the
 * conservative default for anything that has not been given an explicit
 * opinion: long enough to dedupe a burst of mounts, short enough that a stale
 * read is never surprising.
 *
 * `refetchOnWindowFocus: false` is deliberate. The app holds a live socket
 * (`SocketWrapper`) that already pushes every mutation that matters — race
 * results, competitor updates, ranking recalcs — and invalidates the affected
 * keys on arrival. Refetching on focus as well would fire a second, redundant
 * request for data the socket had already refreshed. The one case the socket
 * does not cover is a connection dropped while the tab was backgrounded, which
 * `refetchOnReconnect` handles.
 *
 * `retry: 1` because the API answers in 30-200ms; a request that fails is far
 * more likely to be a real 4xx than a blip, and React Query's default of 3
 * retries with backoff would keep a broken screen spinning for seconds.
 * 401s are never retried: `authenticatedFetch` already retries once with a
 * fresh token and then throws `SessionExpiredError`, so a retry here would
 * just repeat a request that cannot succeed.
 */
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
      if (status === 401 || status === 403 || status === 404) return false;
      if (error instanceof Error && error.name === 'SessionExpiredError') {
        return false;
      }
      return failureCount < 1;
    },
  },
};

export function QueryProvider({ children }: PropsWithChildren) {
  // Created in state so the client survives re-renders but is never shared
  // between two users on the server.
  const [queryClient] = useState(() => {
    const client = new QueryClient({ defaultOptions });
    // Registered during the initializer, not in an effect: `setCachedUserData`
    // can be called from a write handler that fires before effects have run.
    registerQueryClientForUserCache(client);
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
