"use client";

import { useSeasonRecap } from "@/app/hooks/useSeasonRecap";
import SeasonRecapModal from "@/app/components/season/SeasonRecapModal";

export default function SeasonRecapAutoShow() {
  const { showRecap, recapMonth, recapYear, closeRecap } = useSeasonRecap();

  if (!showRecap || !recapMonth || !recapYear) return null;

  return (
    <SeasonRecapModal
      year={recapYear}
      month={recapMonth}
      onClose={closeRecap}
    />
  );
}
