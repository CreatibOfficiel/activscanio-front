"use client";

import { FC, useMemo } from "react";
import TVPodium from "./TVPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import TVCountdown from "./TVCountdown";
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

const SEASON_THRESHOLDS = { warningSeconds: 259200, criticalSeconds: 86400 }; // 3 days / 1 day

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

  // Ranking animation hook (TV mode — uses previousDayRank, animates every load)
  const {
    animationPhase,
    displayOrder,
    showUniformCards,
    changedIds,
    onTransitionComplete,
  } = useRankingAnimation({
    mode: 'tv',
    competitors: confirmed,
    enabled: confirmed.length > 0,
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
    <div className="space-y-8">
      {/* Podium + Countdown side by side */}
      <div className="relative">
        {/* Countdown pinned top-right */}
        <div className="absolute top-0 right-0 z-10">
          <TVCountdown
            label="Fin de saison"
            targetDate={raceSeasonEndDate}
            thresholds={SEASON_THRESHOLDS}
            expiredLabel="Saison terminée"
          />
        </div>

        {/* Ranking animation overlay wrapping podium + leagues */}
        <RankingAnimationOverlay
          phase={animationPhase}
          displayOrder={displayOrder}
          changedIds={changedIds}
          variant="tv"
          onTransitionComplete={onTransitionComplete}
        >
          {/* Confirmed: Podium Top 3 */}
          {top3.length >= 3 && (
            <TVPodium
              items={podiumItems}
              disableEntryAnimation={showUniformCards}
            />
          )}

          {/* Confirmed: list (if not enough for podium, show as rows) */}
          {top3.length > 0 && top3.length < 3 && (
            <div className="space-y-3 max-w-5xl mx-auto">
              {confirmed.map((competitor, index) => {
                const rank = confirmedRanks.get(competitor.id) ?? index + 1;
                const trend = getTrend(competitor, rank);
                return (
                  <TVLeaderboardRow
                    key={competitor.id}
                    item={{
                      id: competitor.id,
                      rank,
                      name: formatCompetitorName(
                        competitor.firstName,
                        competitor.lastName
                      ),
                      imageUrl: competitor.profilePictureUrl,
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
          )}

          {/* Confirmed: league sections after podium */}
          {leagueGroups.map((group) => (
            <div key={group.league.id} className="space-y-3 max-w-5xl mx-auto">
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
                      name: formatCompetitorName(
                        competitor.firstName,
                        competitor.lastName
                      ),
                      imageUrl: competitor.profilePictureUrl,
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
      </div>

      {/* Inactive confirmed section */}
      {inactive.length > 0 && (
        <div className="space-y-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <span>💤</span> Inactifs
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
                    name: formatCompetitorName(
                      competitor.firstName,
                      competitor.lastName
                    ),
                    imageUrl: competitor.profilePictureUrl,
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
        <div className="space-y-4 max-w-5xl mx-auto">
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
                    name: formatCompetitorName(
                      competitor.firstName,
                      competitor.lastName
                    ),
                    imageUrl: competitor.profilePictureUrl,
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
  );
};
