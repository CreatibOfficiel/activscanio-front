"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useSeasonRecap } from "@/app/hooks/useSeasonRecap";
import { useOnboarding } from "@/app/context/OnboardingContext";
import SeasonRecapModal from "@/app/components/season/SeasonRecapModal";

// Paths where the recap must never pop up (auth + onboarding flows, TV display).
const EXCLUDED_PREFIXES = ["/tv", "/sign-in", "/sign-up", "/onboarding"];

export default function SeasonRecapAutoShow() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();

  const onExcludedPath = EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p));

  // Only fetch/show once we know the user is signed in, onboarded, and off the excluded flows.
  const enabled = isLoaded && !!isSignedIn && hasCompletedOnboarding && !onExcludedPath;
  const { showRecap, recapMonth, recapYear, closeRecap } = useSeasonRecap(enabled);

  if (!enabled) return null;
  if (!showRecap || !recapMonth || !recapYear) return null;

  return (
    <SeasonRecapModal
      year={recapYear}
      month={recapMonth}
      onClose={closeRecap}
    />
  );
}
