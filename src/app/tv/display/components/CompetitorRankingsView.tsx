"use client";

import { FC, useMemo } from "react";
import Image from "next/image";
import TVHeroPodium from "./TVHeroPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import TVHeroCountdown from "./TVHeroCountdown";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";
import { computeRanksWithTies } from "@/app/utils/rankings";
import { groupByLeague } from "@/app/utils/leagues";
import { LeagueDivider } from "@/app/components/leaderboard";
import RankingAnimationOverlay from "@/app/components/leaderboard/RankingAnimationOverlay";
import { useRankingAnimation } from "@/app/hooks/useRankingAnimation";
import { getRaceSeasonEndDate } from "../utils/deadlines";

interface Props {
  rankings: Competitor[];
  onAnimatingChange?: (isAnimating: boolean) => void;
}

export const CompetitorRankingsView: FC<Props> = ({ rankings }) => {
  const raceSeasonEndDate = useMemo(() => getRaceSeasonEndDate(), []);

  const { confirmed, inactive, calibrating, maxScore, confirmedRanks, inactiveRanks, calibratingRanks, top3, leagueGroups, podiumItems } = useMemo(() => {
    if (!rankings || rankings.length === 0) {
      return {
        confirmed: [] as Competitor[],
        inactive: [] as Competitor[],
        calibrating: [] as Competitor[],
        maxScore: 0,
        confirmedRanks: new Map<string, number>(),
        inactiveRanks: new Map<string, number>(),
        calibratingRanks: new Map<string, number>(),
        top3: [] as Competitor[],
        leagueGroups: [] as { league: import("@/app/utils/leagues").LeagueConfig; items: Competitor[] }[],
        podiumItems: [] as Array<{ id: string; name: string; imageUrl: string; score: number; scoreLabel: string; subtitle: string; rank: number }>,
      };
    }

    // Only competitors with at least one race
    const withRaces = [...rankings]
      .filter((c) => c.raceCount && c.raceCount > 0)
      .sort((a, b) => (b.conservativeScore ?? 0) - (a.conservativeScore ?? 0));

    // Split confirmed active vs confirmed inactive vs calibrating
    const conf = withRaces.filter((c) => !c.provisional && !c.inactive);
    const inact = withRaces.filter((c) => !c.provisional && c.inactive);
    const cal = withRaces.filter((c) => c.provisional);

    // Calculate max score for progress bars
    const max = withRaces.length > 0
      ? Math.max(...withRaces.map((c) => c.conservativeScore ?? 0))
      : 0;

    // Compute ranks with ties
    const confRanks = computeRanksWithTies(
      conf,
      (c) => c.conservativeScore ?? 0,
      (c) => c.id,
    );
    const inactRanks = computeRanksWithTies(
      inact,
      (c) => c.conservativeScore ?? 0,
      (c) => c.id,
      conf.length,
    );
    const calRanks = computeRanksWithTies(
      cal,
      (c) => c.conservativeScore ?? 0,
      (c) => c.id,
      conf.length + inact.length,
    );

    const t3 = conf.slice(0, 3);

    const groups = groupByLeague(
      conf,
      (c) => c.id,
      confRanks,
      true, // exclude Champions (podium)
    );

    const items = t3.map((competitor) => {
      const avgRank = competitor.avgRank12
        ? `Pos. moy. ${competitor.avgRank12.toFixed(1)}`
        : null;
      const races = `${competitor.raceCount || 0} course${(competitor.raceCount || 0) !== 1 ? "s" : ""}`;

      return {
        id: competitor.id,
        name: formatCompetitorName(competitor.firstName, competitor.lastName),
        imageUrl: competitor.profilePictureUrl,
        characterImageUrl: competitor.characterVariant?.imageUrl,
        score: Math.round(competitor.conservativeScore ?? 0),
        scoreLabel: "ELO",
        subtitle: avgRank ? `${avgRank} · ${races}` : races,
        rank: confRanks.get(competitor.id) ?? 1,
      };
    });

    return {
      confirmed: conf,
      inactive: inact,
      calibrating: cal,
      maxScore: max,
      confirmedRanks: confRanks,
      inactiveRanks: inactRanks,
      calibratingRanks: calRanks,
      top3: t3,
      leagueGroups: groups,
      podiumItems: items,
    };
  }, [rankings]);

  // Ranking animation hook specifically for the Peloton (Rank 4+)
  const peloton = confirmed.slice(3);
  const {
    animationPhase,
    displayOrder,
    showUniformCards,
    changedIds,
    onTransitionComplete,
  } = useRankingAnimation({
    mode: 'tv',
    competitors: peloton,
    enabled: peloton.length > 0,
  });

  // Real trend based on previousDayRank snapshot
  const getTrend = (
    competitor: Competitor,
    currentRank: number
  ): { direction: "up" | "down" | "stable" | undefined; value?: number } => {
    if (competitor.previousDayRank == null) return { direction: undefined };
    const change = competitor.previousDayRank - currentRank;
    if (change > 0) return { direction: "up", value: change };
    if (change < 0) return { direction: "down", value: Math.abs(change) };
    return { direction: "stable" };
  };

  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucun pilote trouvé
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-start gap-8 max-w-[1800px] mx-auto w-full px-4">
      {/* LEFT COLUMN: Hero Zone (Sticky) */}
      <div className="w-[45%] sticky top-2 flex flex-col items-center">

        {/* Countdown */}
        <div className="mb-4 w-full max-w-[90%]">
          <TVHeroCountdown
            targetDate={raceSeasonEndDate}
          />
        </div>

        {/* Confirmed: Podium Top 3 (Always visible or self-animating) */}
        {top3.length >= 3 ? (
          <div className="w-full">
            <TVHeroPodium items={podiumItems} />
          </div>
        ) : top3.length > 0 && (
          <div className="space-y-3 w-full max-w-md mt-6">
            {top3.map((competitor, index) => {
              const rank = confirmedRanks.get(competitor.id) ?? index + 1;
              const trend = getTrend(competitor, rank);
              return (
                <TVLeaderboardRow
                  key={competitor.id}
                  item={{
                    id: competitor.id,
                    rank,
                    name: formatCompetitorName(competitor.firstName, competitor.lastName),
                    imageUrl: competitor.profilePictureUrl,
                    characterImageUrl: competitor.characterVariant?.imageUrl,
                    score: Math.round(competitor.conservativeScore ?? 0),
                    scoreLabel: "ELO",
                    subtitle: competitor.characterVariant
                      ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                      : `${competitor.raceCount || 0} courses`,
                    trend: trend.direction,
                    trendValue: trend.value,
                    maxScore,
                  }}
                  animationDelay={index * 80}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Peloton Zone (Scrolls) */}
      <div className="w-[55%] flex flex-col">
        <h2 className="text-3xl font-black italic text-cyan-400 mb-6 text-center drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          Peloton
        </h2>

        <div className="space-y-8 flex-1">
          <RankingAnimationOverlay
            phase={animationPhase}
            displayOrder={displayOrder}
            changedIds={changedIds}
            variant="tv"
            onTransitionComplete={onTransitionComplete}
          >
            {/* Confirmed: league sections after podium */}
            {leagueGroups.map((group) => (
              <div key={group.league.id} className="space-y-3 w-full">
                <LeagueDivider league={group.league} variant="tv" />
                {group.items.map((competitor, index) => {
                  const rank = confirmedRanks.get(competitor.id) ?? index + 4;
                  const trend = getTrend(competitor, rank);
                  return (
                    <TVLeaderboardRow
                      key={competitor.id}
                      item={{
                        id: competitor.id,
                        rank,
                        name: formatCompetitorName(competitor.firstName, competitor.lastName),
                        imageUrl: competitor.profilePictureUrl,
                        characterImageUrl: competitor.characterVariant?.imageUrl,
                        score: Math.round(competitor.conservativeScore ?? 0),
                        scoreLabel: "ELO",
                        subtitle: competitor.characterVariant
                          ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                          : `${competitor.raceCount || 0} courses`,
                        trend: trend.direction,
                        trendValue: trend.value,
                        maxScore,
                      }}
                      animationDelay={index * 80}
                      disableEntryAnimation={showUniformCards}
                    />
                  );
                })}
              </div>
            ))}
          </RankingAnimationOverlay>

          {/* Inactive confirmed section */}
          {inactive.length > 0 && (
            <div className="space-y-4 w-full pt-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <Image
                      src="/mk-icons/bob-omb.webp"
                      alt="Inactive"
                      fill
                      className="object-contain"
                    />
                  </div>
                  Inactifs
                </h3>
                <div className="h-px flex-1 bg-neutral-700" />
              </div>
              <div className="space-y-3 opacity-50">
                {inactive.map((competitor, index) => {
                  const rank = inactiveRanks.get(competitor.id) ?? confirmed.length + index + 1;
                  const trend = getTrend(competitor, rank);
                  return (
                    <TVLeaderboardRow
                      key={competitor.id}
                      item={{
                        id: competitor.id,
                        rank,
                        name: formatCompetitorName(competitor.firstName, competitor.lastName),
                        imageUrl: competitor.profilePictureUrl,
                        characterImageUrl: competitor.characterVariant?.imageUrl,
                        score: Math.round(competitor.conservativeScore ?? 0),
                        scoreLabel: "ELO",
                        subtitle: competitor.characterVariant
                          ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                          : `${competitor.raceCount || 0} courses`,
                        trend: trend.direction,
                        trendValue: trend.value,
                        maxScore,
                      }}
                      animationDelay={index * 80}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* No confirmed players message */}
          {confirmed.length === 0 && (
            <div className="text-center py-8">
              <p className="text-tv-body text-neutral-400">
                Aucun pilote confirmé pour le moment
              </p>
            </div>
          )}

          {/* Calibrating section */}
          {calibrating.length > 0 && (
            <div className="space-y-4 w-full pt-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-500 uppercase tracking-wider">
                  En calibrage
                </h3>
                <div className="h-px flex-1 bg-neutral-700" />
              </div>
              <div className="space-y-3">
                {calibrating.map((competitor, index) => {
                  const rank = calibratingRanks.get(competitor.id) ?? confirmed.length + index + 1;
                  const trend = getTrend(competitor, rank);
                  return (
                    <TVLeaderboardRow
                      key={competitor.id}
                      item={{
                        id: competitor.id,
                        rank,
                        name: formatCompetitorName(competitor.firstName, competitor.lastName),
                        imageUrl: competitor.profilePictureUrl,
                        characterImageUrl: competitor.characterVariant?.imageUrl,
                        score: Math.round(competitor.conservativeScore ?? 0),
                        scoreLabel: "ELO",
                        subtitle: `${competitor.raceCount || 0}/5 courses`,
                        trend: trend.direction,
                        trendValue: trend.value,
                        maxScore,
                      }}
                      animationDelay={index * 80}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
