"use client";

import { createContext, useContext, useMemo, useState, PropsWithChildren } from "react";

interface OnboardingContextValue {
  /** True once the signed-in user has completed onboarding (confirmed via /users/me). */
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const value = useMemo(
    () => ({ hasCompletedOnboarding, setHasCompletedOnboarding }),
    [hasCompletedOnboarding]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
