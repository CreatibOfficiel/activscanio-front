"use client";

import { useContext, useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { AppContext } from "./context/AppContext";
import { Competitor } from "./models/Competitor";
import { StreakWarningStatus } from "./models/Achievement";
import { AchievementsRepository } from "./repositories/AchievementsRepository";
import { Button, Countdown } from "./components/ui";
import { MdFlag } from "react-icons/md";
import { getRaceSeasonEndDate } from "./tv/display/utils/deadlines";
import { StreakWarningBanner } from "./components/achievements";
import {
  ElevatedPodium,
  LeaderboardRow,
} from "./components/leaderboard";
import { TrendDirection } from "./components/leaderboard/TrendIndicator";
import { computeRanksWithTies } from "./utils/rankings";
import { usePullToRefresh } from "./hooks/usePullToRefresh";

const sortByConservativeScore = (competitors: Competitor[]): Competitor[] => {
  return [...competitors].sort((a, b) => {
    if (a.conservativeScore === undefined && b.conservativeScore === undefined)
      return 0;
    if (a.conservativeScore === undefined) return 1;
    if (b.conservativeScore === undefined) return -1;
    return b.conservativeScore - a.conservativeScore;
  });
};

/**
 * Calculate real trend data based on previousDayRank.
 * Compares the previous day rank with current rank to determine direction.
 *
 * @param competitors - Sorted array of competitors (by conservativeScore DESC)
 * @returns Map of competitor ID to trend data
 */
const calculateCompetitorTrends = (
  competitors: Competitor[]
): Map<string, { direction: TrendDirection; value?: number }> => {
  const trends = new Map<
    string,
    { direction: TrendDirection; value?: number }
  >();

  const ranksMap = computeRanksWithTies(
    competitors,
    (c) => c.conservativeScore ?? 0,
    (c) => c.id,
  );

  competitors.forEach((competitor) => {
    const currentRank = ranksMap.get(competitor.id) ?? 0;
    const previousRank = competitor.previousDayRank;

    if (previousRank != null) {
      const change = previousRank - currentRank;

      if (change > 0) {
        trends.set(competitor.id, { direction: "up", value: change });
      } else if (change < 0) {
        trends.set(competitor.id, { direction: "down", value: Math.abs(change) });
      } else {
        trends.set(competitor.id, { direction: "stable" });
      }
    } else {
      trends.set(competitor.id, { direction: "stable" });
    }
  });

  return trends;
};

export default function Home() {
  const { isLoading, allCompetitors, refreshCompetitors } = useContext(AppContext);
  const { isSignedIn, getToken } = useAuth();
  const [now, setNow] = useState<Date | null>(null);
  const [streakWarnings, setStreakWarnings] = useState<StreakWarningStatus | null>(null);
  const seasonEndDate = useMemo(() => getRaceSeasonEndDate(), []);

  const onPullRefresh = useCallback(async () => {
    await refreshCompetitors();
  }, [refreshCompetitors]);

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: onPullRefresh,
  });

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Fetch streak warnings for signed-in users (non-blocking)
  useEffect(() => {
    if (!isSignedIn) return;
    const fetchWarnings = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const warnings = await AchievementsRepository.getStreakWarnings(token);
        setStreakWarnings(warnings);
      } catch {
        // Non-blocking — silently ignore
      }
    };
    fetchWarnings();
  }, [isSignedIn, getToken]);

  const { confirmed, calibrating, topThree, others, trends, confirmedRanks, calibratingRanks } = useMemo(() => {
    const allWithRaces = allCompetitors.filter((c) => c.raceCount && c.raceCount > 0);
    const sorted = sortByConservativeScore(allWithRaces);

    // Split confirmed vs calibrating (same logic as TV display)
    const conf = sorted.filter((c) => !c.provisional);
    const cal = sorted.filter((c) => c.provisional);

    // Compute ranks with ties for confirmed competitors
    const confRanks = computeRanksWithTies(
      conf,
      (c) => c.conservativeScore ?? 0,
      (c) => c.id,
    );

    // Compute ranks with ties for calibrating competitors (offset by confirmed count)
    const calRanks = computeRanksWithTies(
      cal,
      (c) => c.conservativeScore ?? 0,
      (c) => c.id,
      conf.length,
    );

    const trendData = calculateCompetitorTrends(conf);

    return {
      confirmed: conf,
      calibrating: cal,
      topThree: conf.slice(0, 3),
      others: conf.slice(3),
      trends: trendData,
      confirmedRanks: confRanks,
      calibratingRanks: calRanks,
    };
  }, [allCompetitors]);

  if (isLoading || !now) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24 relative overflow-x-hidden">
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
          style={{ top: isPulling ? pullDistance - 40 : 8 }}
        >
          <div
            className={`w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full ${
              isRefreshing || pullDistance >= 80 ? "animate-spin" : ""
            }`}
            style={
              !isRefreshing && pullDistance < 80
                ? { transform: `rotate(${pullDistance * 3.6}deg)`, opacity: pullDistance / 80 }
                : undefined
            }
          />
        </div>
      )}

      {/* Content wrapper with pull offset */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-title mb-2">Classement des pilotes</h1>

        <p className="text-sm text-neutral-500">
          {confirmed.length} pilote
          {confirmed.length > 1 ? "s" : ""}
          {calibrating.length > 0 && ` + ${calibrating.length} en calibrage`}
        </p>
      </div>

      {/* Season countdown */}
      <Countdown
        label="Fin de saison"
        targetDate={seasonEndDate}
        thresholds={{ warningSeconds: 259200, criticalSeconds: 86400 }}
        expiredLabel="Saison terminée"
        className="mx-4 mb-4"
      />

      {/* Streak Warning Banners */}
      {streakWarnings && <StreakWarningBanner warnings={streakWarnings} className="mb-4" />}

      {/* Podium or empty state */}
      {topThree.length > 0 ? (
        <div className="mb-8">
          <ElevatedPodium topThree={topThree} trends={trends} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="mb-6">
            <Image
              src="/illustrations/empty-podium.svg"
              alt="Podium vide"
              width={240}
              height={200}
              priority
            />
          </div>

          <div className="text-center max-w-sm">
            <h2 className="text-heading text-white mb-2">
              Le podium vous attend !
            </h2>
            <p className="text-regular text-neutral-400 mb-6">
              Aucune course n&apos;a encore été enregistrée. Ajoutez votre première course pour voir le classement !
            </p>

            <Link href="/races/add">
              <Button variant="primary" className="gap-2">
                <MdFlag className="text-lg" />
                Ajouter une course
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Other ranked competitors */}
      {others.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-heading text-neutral-400 mb-3 px-1">
            Autres classés
          </h2>
          {others.map((competitor, index) => (
            <LeaderboardRow
              key={competitor.id}
              competitor={competitor}
              rank={confirmedRanks.get(competitor.id) ?? index + 4}
              trend={trends.get(competitor.id)}
              animationDelay={index * 50}
            />
          ))}
        </div>
      )}

      {/* Calibrating competitors */}
      {calibrating.length > 0 && (
        <div className="mt-8 space-y-1">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-px flex-1 bg-neutral-700" />
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              En calibrage
            </h2>
            <div className="h-px flex-1 bg-neutral-700" />
          </div>

          {calibrating.map((competitor, index) => (
            <LeaderboardRow
              key={competitor.id}
              competitor={competitor}
              rank={calibratingRanks.get(competitor.id) ?? confirmed.length + index + 1}
              animationDelay={index * 50}
            />
          ))}
        </div>
      )}
      </div>{/* end content wrapper */}
    </div>
  );
}
