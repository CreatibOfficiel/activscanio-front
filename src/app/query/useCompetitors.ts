'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { Competitor } from '../models/Competitor';
import { authenticatedFetch } from '../utils/authenticated-fetch';
import { queryKeys } from './keys';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * How long the leaderboard is trusted without refetching.
 *
 * 60 seconds, which is longer than it looks: ratings only move when a race is
 * recorded, and every race pushes a socket event that invalidates this key
 * immediately. The staleTime is therefore the fallback for the case where the
 * socket is down, not the primary freshness mechanism. Its real job is to
 * dedupe the burst of reads that happens on every navigation, since a dozen
 * components read `allCompetitors`.
 */
const COMPETITORS_STALE_TIME = 60_000;

export function useCompetitorsQuery() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.competitors,
    queryFn: async (): Promise<Competitor[]> => {
      const res = await authenticatedFetch(getToken, `${baseUrl}/competitors`);
      if (!res.ok) throw new Error('Failed to fetch competitors');
      return res.json();
    },
    enabled: isLoaded && isSignedIn,
    staleTime: COMPETITORS_STALE_TIME,
    // The leaderboard is on screen constantly; showing the previous list while
    // a refetch runs beats collapsing it to a spinner.
    placeholderData: (previous) => previous,
  });
}

/**
 * How long invalidation requests are gathered before one refetch is issued.
 *
 * Small enough to stay imperceptible, large enough to cover the spread of a
 * single server-side event fanning out into several socket messages.
 */
const INVALIDATE_COALESCE_MS = 50;

/**
 * Invalidate the leaderboard, coalescing bursts into one request.
 *
 * Worth being precise about why the obvious version is not enough: calling
 * `invalidateQueries` three times in a tick issues three refetches. React
 * Query deduplicates a request that is already *in flight*, but an
 * invalidation of an idle query starts a new fetch each time, and it also
 * cancels-and-restarts. Measured directly against v5: three same-tick
 * invalidations produced three network calls.
 *
 * That matters here because recording one race emits `race:announcement`,
 * `race:results` and `competitor:updated` together, so the naive version
 * would keep the old behaviour of one request per event.
 *
 * So the invalidation is split: mark stale immediately with
 * `refetchType: 'none'` (cheap, idempotent, no request), and schedule a single
 * `refetchQueries` on a short timer that later calls in the same window reuse.
 * Three events, one request, and the data still lands.
 */
export function useInvalidateCompetitors() {
  const queryClient = useQueryClient();
  const pending = useRef<{
    timer: ReturnType<typeof setTimeout>;
    promise: Promise<void>;
    settle: () => void;
  } | null>(null);

  // A pending refetch must not outlive the component that scheduled it.
  // The promise is settled rather than dropped: `refreshCompetitors` awaits it,
  // so abandoning it here would leave that caller hanging forever.
  useEffect(() => {
    return () => {
      if (pending.current) {
        clearTimeout(pending.current.timer);
        pending.current.settle();
        pending.current = null;
      }
    };
  }, []);

  return useCallback(() => {
    // Mark stale now, so anything mounting in the meantime knows not to trust
    // the cached list even before the refetch lands.
    queryClient.invalidateQueries({
      queryKey: queryKeys.competitors,
      refetchType: 'none',
    });

    if (pending.current) return pending.current.promise;

    let settle!: () => void;
    const promise = new Promise<void>((resolve) => {
      settle = resolve;
    });

    const timer = setTimeout(() => {
      pending.current = null;
      queryClient
        .refetchQueries({ queryKey: queryKeys.competitors })
        .catch((err) => console.error('refreshCompetitors failed:', err))
        .finally(settle);
    }, INVALIDATE_COALESCE_MS);

    pending.current = { timer, promise, settle };
    return promise;
  }, [queryClient]);
}
