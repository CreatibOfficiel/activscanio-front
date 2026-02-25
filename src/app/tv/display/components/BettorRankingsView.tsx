"use client";

import { FC, useMemo } from "react";
import TVHeroPodium from "./TVHeroPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import TVHeroCountdown from "./TVHeroCountdown";
import { BettorRanking } from "@/app/models/CompetitorOdds";
import { formatCompetitorName } from "@/app/utils/formatters";
import { getSeasonEndDate } from "../utils/deadlines";

interface Props {
  rankings: {
    month: number;
    year: number;
    count: number;
    rankings: BettorRanking[];
  } | null;
}

export const BettorRankingsView: FC<Props> = ({ rankings }) => {
  const seasonEndDate = useMemo(() => getSeasonEndDate(), []);

  if (!rankings || rankings.rankings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucun classement disponible pour le moment
        </p>
      </div>
    );
  }

  const { rankings: rankedBettors } = rankings;

  const top3 = rankedBettors.slice(0, 3);
  const others = rankedBettors.slice(3, 15);

  // Calculate max score for progress bars
  const maxScore = Math.max(...rankedBettors.map((b) => b.totalPoints));

  // Convert to podium format with profile pictures and short names
  const podiumItems = top3.map((bettor) => ({
    id: bettor.userId,
    name: formatCompetitorName(bettor.firstName, bettor.lastName, bettor.userName),
    imageUrl: bettor.profilePictureUrl ?? undefined,
    score: bettor.totalPoints,
    scoreLabel: "pts",
    subtitle: `${bettor.betsWon}/${bettor.betsPlaced} gagnés · ${bettor.winRate.toFixed(0)}%${bettor.perfectBets > 0 ? ` · ${bettor.perfectBets} parfait${bettor.perfectBets > 1 ? 's' : ''}` : ''}`,
    rank: bettor.rank,
  }));

  // Real trend based on previousWeekRank snapshot
  const getTrend = (
    bettor: BettorRanking
  ): { direction: "up" | "down" | "stable" | undefined; value?: number } => {
    if (bettor.previousWeekRank == null) return { direction: undefined };
    const change = bettor.previousWeekRank - bettor.rank;
    if (change > 0) return { direction: "up", value: change };
    if (change < 0) return { direction: "down", value: Math.abs(change) };
    return { direction: "stable" };
  };

  return (
    <div className="flex flex-row items-stretch gap-8 max-w-[1800px] mx-auto w-full px-4 min-h-full">
      {/* LEFT COLUMN: Hero Zone (Centered) */}
      <div className="w-[45%] flex flex-col items-center justify-center my-auto">

        {/* Countdown */}
        <div className="mb-4 w-full max-w-[90%]">
          <TVHeroCountdown
            targetDate={seasonEndDate}
            seasonName="SAISON PARIEURS"
          />
        </div>

        {/* Podium Top 3 */}
        {top3.length >= 3 && (
          <div className="w-full">
            <TVHeroPodium items={podiumItems} />
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Rankings list */}
      <div className="w-[55%] flex flex-col justify-center">
        <h2 className="text-3xl font-black italic text-cyan-400 mb-6 text-center drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          Classement
        </h2>

        <div className="space-y-3">
          {others.map((bettor, index) => {
            const trend = getTrend(bettor);
            const winRate = bettor.winRate.toFixed(0);
            const streakSuffix = bettor.currentMonthlyStreak > 0
              ? ` • 🔥${bettor.currentMonthlyStreak}`
              : "";
            return (
              <TVLeaderboardRow
                key={bettor.userId}
                item={{
                  id: bettor.userId,
                  rank: bettor.rank,
                  name: formatCompetitorName(bettor.firstName, bettor.lastName, bettor.userName),
                  imageUrl: bettor.profilePictureUrl ?? undefined,
                  score: bettor.totalPoints,
                  scoreLabel: "pts",
                  subtitle: `${bettor.betsWon}/${bettor.betsPlaced} • ${winRate}%${streakSuffix}`,
                  trend: trend.direction,
                  trendValue: trend.value,
                  maxScore: maxScore,
                }}
                animationDelay={index * 60}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
