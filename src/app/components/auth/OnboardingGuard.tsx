"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { UsersRepository } from '@/app/repositories/UsersRepository';
import { queryKeys } from '@/app/query/keys';
import { useOnboarding } from '@/app/context/OnboardingContext';
import { ONBOARDING_EXEMPT_PATHS } from '@/app/config/routes';
import { matchesAnyPath } from '@/app/utils/path-matching';
import {
  hasStoredOnboardingComplete,
  setStoredOnboardingComplete,
} from '@/app/utils/onboarding-storage';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken, userId } = useAuth();
  const { setHasCompletedOnboarding } = useOnboarding();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Whether we must hold `children` back until `/users/me` answers.
   *
   * Starts `true` to match the server render — seeding it from local storage
   * here would make the first client render disagree with the HTML and trip a
   * hydration mismatch. It is instead cleared at the top of the effect below,
   * before any network work, so a known-onboarded user unblocks in the same
   * tick the effect first runs rather than a round trip later.
   */
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const hasPassedOnboarding = useRef(false);
  const consecutiveErrors = useRef(0);

  const checkOnboarding = useCallback(async () => {
    if (!isLoaded) return;

    // Already verified successfully → skip
    if (hasPassedOnboarding.current) {
      setIsChecking(false);
      return;
    }

    const isPublicPath = matchesAnyPath(pathname, ONBOARDING_EXEMPT_PATHS);
    if (isPublicPath) {
      setIsChecking(false);
      return;
    }

    setError(null);

    // The fast path. A user we have previously confirmed as onboarded renders
    // straight away; the rest of this function still runs, but as a background
    // confirmation rather than a gate. Users we have no record of keep waiting,
    // which is what prevents an onboarding flash for the people who would
    // actually be redirected.
    const knownOnboarded = hasStoredOnboardingComplete(userId);
    setIsChecking(!knownOnboarded);

    try {
      // Use the cached token: Clerk refreshes it on expiry, and a 401 from
      // the API is already handled below (redirect to sign-in).
      const token = await getTokenRef.current();
      if (!token) {
        setIsChecking(false);
        return;
      }

      // Through the query cache rather than a bare `getMe`: this guard runs
      // before anything else on a cold load, so its response is what warms
      // `/users/me` for the rest of the tree. Going direct would leave the
      // cache empty and make the first consumer fetch the same thing again.
      const userData = await queryClient.fetchQuery({
        queryKey: queryKeys.currentUser,
        queryFn: () => UsersRepository.getMe(token),
      });
      if (!userData) {
        setIsChecking(false);
        return;
      }
      consecutiveErrors.current = 0;

      setHasCompletedOnboarding(userData.hasCompletedOnboarding);
      // Record the verdict so the next cold load can skip the gate. Writing
      // `false` too matters: it clears a stale `true` for a user who has been
      // put back into onboarding.
      setStoredOnboardingComplete(userId, userData.hasCompletedOnboarding);

      if (userData.hasCompletedOnboarding) {
        hasPassedOnboarding.current = true;
        if (pathname.startsWith('/onboarding')) {
          router.push('/');
        }
        setIsChecking(false);
      } else {
        if (!pathname.startsWith('/onboarding')) {
          router.push('/onboarding');
        }
        setIsChecking(false);
      }
    } catch (err: unknown) {
      console.error('Error checking onboarding status:', err);
      consecutiveErrors.current += 1;

      // If 401 or too many consecutive errors, redirect to sign-in
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : undefined;
      if (status === 401 || consecutiveErrors.current >= 2) {
        router.push('/sign-in');
        return;
      }

      // Only take over the screen if we were still gating it. Once the fast
      // path has rendered the app, a failed background confirmation must not
      // replace a working UI with a full-screen error — the user is mid-task
      // and the pages handle their own fetch failures.
      if (!knownOnboarded) {
        setError('Impossible de contacter le serveur. Vérifie ta connexion.');
      }
      setIsChecking(false);
    }
  }, [isLoaded, pathname, router, setHasCompletedOnboarding, queryClient, userId]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100 max-w-sm mx-auto px-4">
          <p className="text-lg font-semibold mb-2">Oups !</p>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => {
              hasPassedOnboarding.current = false;
              checkOnboarding();
            }}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
