"use client";

import { usePathname } from "next/navigation";
import { useSeasonRecap } from "@/app/hooks/useSeasonRecap";
import SeasonRecapModal from "@/app/components/season/SeasonRecapModal";

export default function SeasonRecapAutoShow() {
  const pathname = usePathname();
  const { showRecap, recapMonth, recapYear, closeRecap } = useSeasonRecap();

  if (pathname?.startsWith("/tv") || pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) return null;
  if (!showRecap || !recapMonth || !recapYear) return null;

  return (
    <SeasonRecapModal
      year={recapYear}
      month={recapMonth}
      onClose={closeRecap}
    />
  );
}
