"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { UsersRepository } from '@/app/repositories/UsersRepository';

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

      // Skip check for non-onboarding public paths (TV display, auth pages)
      const isPublicPath = ['/tv/display', '/sign-in', '/sign-up'].some(path => pathname.startsWith(path));
      if (isPublicPath) {
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
        const isOnboardingPath = pathname.startsWith('/onboarding');

        if (userData.hasCompletedOnboarding) {
          // User has completed onboarding
          if (isOnboardingPath) {
            // Redirect away from onboarding page to dashboard
            router.push('/');
          } else {
            // Allow access to the page
            setIsChecking(false);
          }
        } else {
          // User hasn't completed onboarding
          if (isOnboardingPath) {
            // Allow access to onboarding page
            setIsChecking(false);
          } else {
            // Redirect to onboarding
            router.push('/onboarding');
          }
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
