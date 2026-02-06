"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { UsersRepository } from '@/app/repositories/UsersRepository';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkOnboarding = useCallback(async () => {
    if (!isLoaded) return;

    setError(null);
    setIsChecking(true);

    const isPublicPath = ['/tv/display', '/sign-in', '/sign-up'].some(path => pathname.startsWith(path));
    if (isPublicPath) {
      setIsChecking(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setIsChecking(false);
        return;
      }

      const userData = await UsersRepository.getMe(token);
      const isOnboardingPath = pathname.startsWith('/onboarding');

      if (userData.hasCompletedOnboarding) {
        if (isOnboardingPath) {
          router.push('/');
        } else {
          setIsChecking(false);
        }
      } else {
        if (isOnboardingPath) {
          setIsChecking(false);
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setError('Impossible de contacter le serveur. Vérifie ta connexion.');
      setIsChecking(false);
    }
  }, [isLoaded, pathname, router, getToken]);

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
            onClick={() => checkOnboarding()}
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
