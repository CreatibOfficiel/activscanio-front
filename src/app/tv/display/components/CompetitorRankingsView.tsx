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
    .sort((a, b) => b.rating - a.rating);

  // Split confirmed (5+ races) vs calibrating
  const confirmed = withRaces.filter((c) => !c.provisional);
  const calibrating = withRaces.filter((c) => c.provisional);

  // Calculate max score for progress bars
  const maxScore = withRaces.length > 0
    ? Math.max(...withRaces.map((c) => c.rating))
    : 0;

  // Simulate trend based on avgRank
  const getTrend = (
    competitor: Competitor
  ): "up" | "down" | "stable" | undefined => {
    if (!competitor.avgRank12) return undefined;
    if (competitor.avgRank12 <= 3) return "up";
    if (competitor.avgRank12 >= 6) return "down";
    return "stable";
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
      score: Math.round(competitor.rating),
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
          {confirmed.map((competitor, index) => (
            <TVLeaderboardRow
              key={competitor.id}
              item={{
                id: competitor.id,
                rank: index + 1,
                name: formatCompetitorName(
                  competitor.firstName,
                  competitor.lastName
                ),
                imageUrl: competitor.profilePictureUrl,
                score: Math.round(competitor.rating),
                scoreLabel: "ELO",
                subtitle: competitor.characterVariant
                  ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                  : `${competitor.raceCount || 0} courses`,
                trend: getTrend(competitor),
                maxScore,
              }}
              animationDelay={index * 80}
            />
          ))}
        </div>
      )}

      {/* Confirmed: others after podium */}
      {othersConfirmed.length > 0 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          {othersConfirmed.map((competitor, index) => (
            <TVLeaderboardRow
              key={competitor.id}
              item={{
                id: competitor.id,
                rank: index + 4,
                name: formatCompetitorName(
                  competitor.firstName,
                  competitor.lastName
                ),
                imageUrl: competitor.profilePictureUrl,
                score: Math.round(competitor.rating),
                scoreLabel: "ELO",
                subtitle: competitor.characterVariant
                  ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                  : `${competitor.raceCount || 0} courses`,
                trend: getTrend(competitor),
                maxScore,
              }}
              animationDelay={index * 80}
            />
          ))}
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
            {calibrating.map((competitor, index) => (
              <TVLeaderboardRow
                key={competitor.id}
                item={{
                  id: competitor.id,
                  rank: confirmed.length + index + 1,
                  name: formatCompetitorName(
                    competitor.firstName,
                    competitor.lastName
                  ),
                  imageUrl: competitor.profilePictureUrl,
                  score: Math.round(competitor.rating),
                  scoreLabel: "ELO",
                  subtitle: `${competitor.raceCount || 0}/5 courses`,
                  trend: getTrend(competitor),
                  maxScore,
                }}
                animationDelay={index * 80}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
