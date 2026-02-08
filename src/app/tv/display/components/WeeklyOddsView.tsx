"use client";

import { FC } from "react";
import TVPodium from "./TVPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import { CompetitorOdds } from "@/app/models/CompetitorOdds";
import { formatCompetitorName } from "@/app/utils/formatters";

interface WeeklyOddsViewProps {
  odds: CompetitorOdds[] | null;
  weekDates?: string;
}

export const WeeklyOddsView: FC<WeeklyOddsViewProps> = ({
  odds,
  weekDates,
}) => {
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
    .sort((a, b) => (a.oddFirst ?? a.odd) - (b.oddFirst ?? b.odd));

  if (sortedOdds.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucune cote disponible
        </p>
      </div>
    );
  }

  const top3 = sortedOdds.slice(0, 3);
  const others = sortedOdds.slice(3, 15);
  const maxOdd = Math.max(...sortedOdds.map((o) => o.oddFirst ?? o.odd));

  const podiumItems = top3.map((o, i) => ({
    id: o.competitorId,
    name: formatCompetitorName(
      o.competitor?.firstName,
      o.competitor?.lastName,
      o.competitorName
    ),
    imageUrl: o.competitor?.profilePictureUrl,
    score: o.oddFirst ?? o.odd,
    scoreLabel: "x",
    subtitle: `ELO ${Math.round(o.metadata?.elo ?? 0)}`,
    rank: i + 1,
  }));

  return (
    <div className="space-y-12">
      {/* Week dates subtitle */}
      {weekDates && (
        <p className="text-center text-xl text-neutral-400">{weekDates}</p>
      )}

      {/* Podium Top 3 */}
      {top3.length >= 3 && <TVPodium items={podiumItems} />}

      {/* Leaderboard rows 4+ */}
      {others.length > 0 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          {others.map((o, i) => (
            <TVLeaderboardRow
              key={o.competitorId}
              item={{
                id: o.competitorId,
                rank: i + 4,
                name: formatCompetitorName(
                  o.competitor?.firstName,
                  o.competitor?.lastName,
                  o.competitorName
                ),
                imageUrl: o.competitor?.profilePictureUrl,
                score: o.oddFirst ?? o.odd,
                scoreLabel: "x",
                subtitle: `ELO ${Math.round(o.metadata?.elo ?? 0)}`,
                maxScore: maxOdd,
              }}
              animationDelay={i * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
};
