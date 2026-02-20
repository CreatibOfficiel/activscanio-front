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
import { getRaceSeasonEndDate } from "../utils/deadlines";

interface Props {
  rankings: Competitor[];
}

const SEASON_THRESHOLDS = { warningSeconds: 259200, criticalSeconds: 86400 }; // 3 days / 1 day

export const CompetitorRankingsView: FC<Props> = ({ rankings }) => {
  const raceSeasonEndDate = useMemo(() => getRaceSeasonEndDate(), []);

  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucun pilote trouvé
        </p>
      </div>
    );
  }

  // Only competitors with at least one race
  const withRaces = [...rankings]
    .filter((c) => c.raceCount && c.raceCount > 0)
    .sort((a, b) => (b.conservativeScore ?? 0) - (a.conservativeScore ?? 0));

  // Split confirmed active vs confirmed inactive vs calibrating
  const confirmed = withRaces.filter((c) => !c.provisional && !c.inactive);
  const inactive = withRaces.filter((c) => !c.provisional && c.inactive);
  const calibrating = withRaces.filter((c) => c.provisional);

  // Calculate max score for progress bars
  const maxScore = withRaces.length > 0
    ? Math.max(...withRaces.map((c) => c.conservativeScore ?? 0))
    : 0;

  // Compute ranks with ties
  const confirmedRanks = computeRanksWithTies(
    confirmed,
    (c) => c.conservativeScore ?? 0,
    (c) => c.id,
  );
  const inactiveRanks = computeRanksWithTies(
    inactive,
    (c) => c.conservativeScore ?? 0,
    (c) => c.id,
    confirmed.length,
  );
  const calibratingRanks = computeRanksWithTies(
    calibrating,
    (c) => c.conservativeScore ?? 0,
    (c) => c.id,
    confirmed.length + inactive.length,
  );

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

  // Podium from confirmed players
  const top3 = confirmed.slice(0, 3);

  // Group confirmed players by league (excluding champions/podium)
  const leagueGroups = groupByLeague(
    confirmed,
    (c) => c.id,
    confirmedRanks,
    true, // exclude Champions (podium)
  );

  const podiumItems = top3.map((competitor) => {
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
      rank: confirmedRanks.get(competitor.id) ?? 1,
    };
  });

  return (
    <div className="space-y-12">
      {/* Season end countdown */}
      <div className="flex justify-center">
        <TVCountdown
          label="Fin de saison"
          targetDate={raceSeasonEndDate}
          thresholds={SEASON_THRESHOLDS}
          expiredLabel="Saison terminée"
        />
      </div>

      {/* Confirmed: Podium Top 3 */}
      {top3.length >= 3 && <TVPodium items={podiumItems} />}

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
              />
            );
          })}
        </div>
      ))}

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
