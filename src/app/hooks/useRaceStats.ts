"use client";

import { useMemo } from "react";
import { RaceEvent } from "@/app/models/RaceEvent";
import { Competitor } from "@/app/models/Competitor";

export interface RaceStats {
  totalRaces: number;
  weeklyRaces: number;
  todayRaces: number;
  averageParticipants: number;
  mostActivePlayer?: {
    competitor: Competitor;
    raceCount: number;
  };
}

interface UseRaceStatsProps {
  races: RaceEvent[];
  competitors: Competitor[];
}

export const useRaceStats = ({ races, competitors }: UseRaceStatsProps): RaceStats => {
  return useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    let todayRaces = 0;
    let weeklyRaces = 0;
    let totalParticipants = 0;

    // Count participations per competitor
    const participationCount: Record<string, number> = {};

    races.forEach((race) => {
      const raceDate = new Date(race.date);

      // Count races by period
      if (raceDate >= todayStart) {
        todayRaces++;
      }
      if (raceDate >= weekStart) {
        weeklyRaces++;
      }

      // Count participants
      totalParticipants += race.results.length;

      // Track participation per competitor
      race.results.forEach((result) => {
        participationCount[result.competitorId] =
          (participationCount[result.competitorId] || 0) + 1;
      });
    });

    // Find most active player
    let mostActivePlayer: RaceStats["mostActivePlayer"] = undefined;
    let maxParticipation = 0;

    Object.entries(participationCount).forEach(([competitorId, count]) => {
      if (count > maxParticipation) {
        const competitor = competitors.find((c) => c.id === competitorId);
        if (competitor) {
          maxParticipation = count;
          mostActivePlayer = {
            competitor,
            raceCount: count,
          };
        }
      }
    });

    // Calculate average participants
    const averageParticipants =
      races.length > 0 ? Math.round((totalParticipants / races.length) * 10) / 10 : 0;

    return {
      totalRaces: races.length,
      weeklyRaces,
      todayRaces,
      averageParticipants,
      mostActivePlayer,
    };
  }, [races, competitors]);
};

export default useRaceStats;
