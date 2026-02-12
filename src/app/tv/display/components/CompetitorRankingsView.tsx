"use client";

import { FC } from "react";
import TVPodium from "./TVPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";

interface Props {
  rankings: Competitor[];
}

export const CompetitorRankingsView: FC<Props> = ({ rankings }) => {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucun compétiteur trouvé
        </p>
      </div>
    );
  }

  // Only competitors with at least one race
  const withRaces = [...rankings]
    .filter((c) => c.raceCount && c.raceCount > 0)
    .sort((a, b) => (b.conservativeScore ?? 0) - (a.conservativeScore ?? 0));

  // Split confirmed (5+ races) vs calibrating
  const confirmed = withRaces.filter((c) => !c.provisional);
  const calibrating = withRaces.filter((c) => c.provisional);

  // Calculate max score for progress bars
  const maxScore = withRaces.length > 0
    ? Math.max(...withRaces.map((c) => c.conservativeScore ?? 0))
    : 0;

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
  const othersConfirmed = confirmed.slice(3, 15);

  const podiumItems = top3.map((competitor, index) => {
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
      rank: index + 1,
    };
  });

  return (
    <div className="space-y-12">
      {/* Confirmed: Podium Top 3 */}
      {top3.length >= 3 && <TVPodium items={podiumItems} />}

      {/* Confirmed: list (if not enough for podium, show as rows) */}
      {top3.length > 0 && top3.length < 3 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          {confirmed.map((competitor, index) => {
            const rank = index + 1;
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

      {/* Confirmed: others after podium */}
      {othersConfirmed.length > 0 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          {othersConfirmed.map((competitor, index) => {
            const rank = index + 4;
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
              const rank = confirmed.length + index + 1;
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
