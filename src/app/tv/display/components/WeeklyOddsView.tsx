"use client";

import { FC, useMemo } from "react";
import TVCountdown from "./TVCountdown";
import CompetitorOddsCard from "@/app/components/betting/CompetitorOddsCard";
import { CompetitorOdds } from "@/app/models/CompetitorOdds";
import { getBettingDeadline } from "../utils/deadlines";

interface WeeklyOddsViewProps {
  odds: CompetitorOdds[] | null;
  weekDates?: string;
  weekStartDate?: string;
  weekStatus?: string;
}

const BETTING_THRESHOLDS = { warningSeconds: 86400, criticalSeconds: 7200 }; // 24h / 2h

export const WeeklyOddsView: FC<WeeklyOddsViewProps> = ({
  odds,
  weekDates,
  weekStartDate,
  weekStatus,
}) => {
  const bettingDeadline = useMemo(
    () => (weekStartDate ? getBettingDeadline(weekStartDate) : null),
    [weekStartDate]
  );
  if (!odds || odds.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucune cote disponible
        </p>
      </div>
    );
  }

  // Filter eligible only, sort by oddFirst ascending (favorites first)
  const sortedOdds = [...odds]
    .filter((o) => o.isEligible !== false)
    .sort((a, b) => (a.oddFirst) - (b.oddFirst));

  if (sortedOdds.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucune cote disponible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Week dates subtitle */}
      {weekDates && (
        <p className="text-center text-xl text-neutral-400">{weekDates}</p>
      )}

      {/* Betting countdown or closed badge */}
      {weekStatus === "open" && bettingDeadline && (
        <div className="flex justify-center">
          <TVCountdown
            label="Fin des paris"
            targetDate={bettingDeadline}
            thresholds={BETTING_THRESHOLDS}
            expiredLabel="Temps de paris écoulé"
          />
        </div>
      )}
      {weekStatus === "closed" && (
        <div className="flex justify-center">
          <span className="text-lg text-neutral-400 bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-4 py-2">
            Paris fermés
          </span>
        </div>
      )}

      {/* Competitor odds cards */}
      <div className="space-y-3 max-w-5xl mx-auto">
        {sortedOdds.map((o, i) => (
          <CompetitorOddsCard
            key={o.competitorId}
            competitorOdds={o}
            showAllOdds
            showBoostButton={false}
            variant="tv"
            animationDelay={i * 60}
          />
        ))}
      </div>
    </div>
  );
};
