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

  // Sort by rating (Glicko-2) descending
  const sortedCompetitors = [...rankings].sort((a, b) => b.rating - a.rating);

  const top3 = sortedCompetitors.slice(0, 3);
  const others = sortedCompetitors.slice(3, 15);

  // Calculate max score for progress bars
  const maxScore = Math.max(...sortedCompetitors.map((c) => c.rating));

  // Convert to podium format
  const podiumItems = top3.map((competitor, index) => ({
    id: competitor.id,
    name: formatCompetitorName(competitor.firstName, competitor.lastName),
    imageUrl: competitor.profilePictureUrl,
    score: Math.round(competitor.rating),
    scoreLabel: "ELO",
    subtitle: competitor.characterVariant
      ? `${competitor.characterVariant.baseCharacter.name}`
      : `${competitor.raceCount || 0} courses`,
    rank: index + 1,
  }));

  // Simulate trend based on raceCount and avgRank
  const getTrend = (
    competitor: Competitor
  ): "up" | "down" | "stable" | undefined => {
    if (!competitor.avgRank12) return undefined;
    if (competitor.avgRank12 <= 3) return "up";
    if (competitor.avgRank12 >= 6) return "down";
    return "stable";
  };

  return (
    <div className="space-y-12">
      {/* Podium Top 3 */}
      {top3.length >= 3 && <TVPodium items={podiumItems} />}

      {/* Stats cards for top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          {top3.map((competitor, index) => (
            <div
              key={competitor.id}
              className={`text-center p-4 rounded-xl bg-neutral-800/30 animate-row-slide-in`}
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                Position moyenne
              </p>
              <p className="text-2xl font-bold text-primary-400">
                {competitor.avgRank12
                  ? `${competitor.avgRank12.toFixed(1)}ème`
                  : "N/A"}
              </p>
              <p className="text-sm text-neutral-500 mt-2">
                {competitor.raceCount || 0} course
                {(competitor.raceCount || 0) !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Other ranked competitors */}
      {others.length > 0 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          {others.map((competitor, index) => (
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
                maxScore: maxScore,
              }}
              animationDelay={index * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
};
