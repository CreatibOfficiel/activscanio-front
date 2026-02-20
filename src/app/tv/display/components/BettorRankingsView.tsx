"use client";

import { FC, useMemo } from "react";
import TVPodium from "./TVPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import TVCountdown from "./TVCountdown";
import { BettorRanking } from "@/app/models/CompetitorOdds";
import { getSeasonEndDate } from "../utils/deadlines";

const SEASON_THRESHOLDS = { warningSeconds: 259200, criticalSeconds: 86400 }; // 3 days / 1 day

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

  const { month, year, rankings: rankedBettors } = rankings;
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const top3 = rankedBettors.slice(0, 3);
  const others = rankedBettors.slice(3, 15);

  // Calculate max score for progress bars
  const maxScore = Math.max(...rankedBettors.map((b) => b.totalPoints));

  // Convert to podium format
  const podiumItems = top3.map((bettor) => ({
    id: bettor.userId,
    name: bettor.userName,
    score: bettor.totalPoints,
    scoreLabel: "pts",
    subtitle: `${bettor.betsWon}/${bettor.betsPlaced} gagnés`,
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
    <div className="space-y-12">
      {/* Month subtitle */}
      <div className="text-center">
        <p className="text-tv-body text-neutral-400">
          {monthNames[month - 1]} {year}
        </p>
      </div>

      {/* Season end countdown */}
      <div className="flex justify-center">
        <TVCountdown
          label="Fin de saison"
          targetDate={seasonEndDate}
          thresholds={SEASON_THRESHOLDS}
          expiredLabel="Saison terminée"
        />
      </div>

      {/* Podium Top 3 */}
      {top3.length >= 3 && <TVPodium items={podiumItems} />}

      {/* Stats summary for top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          {top3.map((bettor, index) => (
            <div
              key={bettor.userId}
              className={`text-center p-4 rounded-xl bg-neutral-800/30 animate-row-slide-in`}
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                Taux de réussite
              </p>
              <p className="text-2xl font-bold text-primary-400">
                {(bettor.winRate * 100).toFixed(0)}%
              </p>
              {bettor.perfectBets > 0 && (
                <p className="text-sm text-primary-500 mt-2">
                  {bettor.perfectBets} podium
                  {bettor.perfectBets > 1 ? "s" : ""} parfait
                  {bettor.perfectBets > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Other ranked bettors */}
      {others.length > 0 && (
        <div className="space-y-3 max-w-5xl mx-auto">
          {others.map((bettor, index) => {
            const trend = getTrend(bettor);
            return (
              <TVLeaderboardRow
                key={bettor.userId}
                item={{
                  id: bettor.userId,
                  rank: bettor.rank,
                  name: bettor.userName,
                  score: bettor.totalPoints,
                  scoreLabel: "pts",
                  subtitle: `${bettor.betsWon}/${bettor.betsPlaced} gagnés • ${(bettor.winRate * 100).toFixed(0)}%`,
                  trend: trend.direction,
                  trendValue: trend.value,
                  maxScore: maxScore,
                }}
                animationDelay={index * 80}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
