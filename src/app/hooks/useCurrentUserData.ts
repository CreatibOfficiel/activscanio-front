'use client';

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersRepository, UserData } from '../repositories/UsersRepository';
import { queryKeys } from '../query/keys';

/**
 * How long `/users/me` is trusted without refetching.
 *
 * 5 minutes because this payload is close to static: role, sport preference,
 * onboarding flag and the linked character. Nothing here changes without the
 * user themselves triggering it, and every one of those writes already pushes
 * the fresh record into the cache via `setCachedUserData`. A shorter window
 * would buy refetches nobody is waiting for.
 */
const CURRENT_USER_STALE_TIME = 5 * 60_000;

/**
 * The signed-in user, shared by every caller.
 *
 * Previously a hand-rolled module cache with a pub/sub set. That version had
 * no in-flight deduplication: the cache was only written once a response
 * landed, so N components mounting cold produced N requests — which is exactly
 * how /profile ended up firing `/users/me` twice, 12ms apart. React Query
 * dedupes on the key itself, so concurrent mounts now share one request.
 */
export function useCurrentUserData() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<UserData | null> => {
      const token = await getToken();
      if (!token) return null;
      return UsersRepository.getMe(token);
    },
    // Clerk has to resolve before a token exists; querying earlier would just
    // resolve to null and cache an empty user.
    enabled: isLoaded && isSignedIn,
    staleTime: CURRENT_USER_STALE_TIME,
  });

  return {
    userData: query.data ?? null,
    // Matches the old contract: false once we have an answer, and false when
    // there is nobody to fetch for, never a spinner that cannot end.
    loading: query.isPending && isLoaded && !!isSignedIn,
  };
}

/**
 * Push a freshly written user into the cache.
 *
 * Kept as a hook-free export because callers use it from inside async write
 * handlers. It needs a QueryClient, so the module-level singleton set by
 * `CurrentUserCacheBridge` is what it writes through.
 */
export function setCachedUserData(data: UserData | null): void {
  queryClientRef?.setQueryData(queryKeys.currentUser, data);
}

/**
 * Hook form, for callers that are already inside a component.
 */
export function useSetCachedUserData() {
  const queryClient = useQueryClient();
  return useCallback(
    (data: UserData | null) => {
      queryClient.setQueryData(queryKeys.currentUser, data);
    },
    [queryClient],
  );
}

/* ───────── module-level client bridge ───────── */

type MinimalQueryClient = {
  setQueryData: (key: readonly unknown[], data: UserData | null) => unknown;
};

let queryClientRef: MinimalQueryClient | null = null;

/**
 * Lets the non-hook `setCachedUserData` reach the QueryClient.
 *
 * `setCachedUserData` is called from plain async functions (a preference
 * change, a character change) where no hook can run. Rather than change every
 * one of those call sites, the provider hands the client over once at mount.
 */
export function registerQueryClientForUserCache(
  client: MinimalQueryClient | null,
): void {
  queryClientRef = client;
}
