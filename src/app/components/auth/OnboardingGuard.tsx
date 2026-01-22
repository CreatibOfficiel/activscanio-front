"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { UsersRepository } from '@/app/repositories/UsersRepository';

const ALLOWED_PATHS_WITHOUT_ONBOARDING = ['/onboarding', '/tv/display', '/sign-in', '/sign-up'];

/**
 * OnboardingGuard Component
 * Checks if authenticated user has completed onboarding
 * Redirects to /onboarding if not completed
 * Allows certain paths to bypass the check (onboarding page itself, TV display)
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded) return;

      // Allow certain paths without onboarding check
      if (ALLOWED_PATHS_WITHOUT_ONBOARDING.some(path => pathname.startsWith(path))) {
        setIsChecking(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          // User not authenticated, let Clerk middleware handle it
          setIsChecking(false);
          return;
        }

        const userData = await UsersRepository.getMe(token);

        if (!userData.hasCompletedOnboarding) {
          // User hasn't completed onboarding, redirect
          router.push('/onboarding');
        } else {
          // User has completed onboarding, allow access
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, pathname, router, getToken]);

  // Show loading state while checking onboarding status
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
