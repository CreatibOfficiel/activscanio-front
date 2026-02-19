"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { UsersRepository } from '@/app/repositories/UsersRepository';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const hasCheckedForPath = useRef<string | null>(null);
  const consecutiveErrors = useRef(0);

  const checkOnboarding = useCallback(async () => {
    if (!isLoaded) return;

    // Ne pas re-checker si on a deja verifie pour ce pathname
    if (hasCheckedForPath.current === pathname) {
      setIsChecking(false);
      return;
    }

    setError(null);
    setIsChecking(true);

    const isPublicPath = ['/tv/display', '/sign-in', '/sign-up'].some(path => pathname.startsWith(path));
    if (isPublicPath) {
      hasCheckedForPath.current = pathname;
      setIsChecking(false);
      return;
    }

    try {
      // Force fresh token to avoid using an expired cached token
      const token = await getTokenRef.current({ skipCache: true });
      if (!token) {
        setIsChecking(false);
        return;
      }

      const userData = await UsersRepository.getMe(token);
      consecutiveErrors.current = 0;
      const isOnboardingPath = pathname.startsWith('/onboarding');

      if (userData.hasCompletedOnboarding) {
        if (isOnboardingPath) {
          router.push('/');
        } else {
          hasCheckedForPath.current = pathname;
          setIsChecking(false);
        }
      } else {
        if (isOnboardingPath) {
          hasCheckedForPath.current = pathname;
          setIsChecking(false);
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      console.error('Error checking onboarding status:', err);
      consecutiveErrors.current += 1;

      // If 401 or too many consecutive errors, redirect to sign-in
      if (err?.status === 401 || consecutiveErrors.current >= 2) {
        router.push('/sign-in');
        return;
      }

      setError('Impossible de contacter le serveur. Vérifie ta connexion.');
      setIsChecking(false);
    }
  }, [isLoaded, pathname, router]);

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
              hasCheckedForPath.current = null;
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
