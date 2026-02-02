"use client";

import { FC } from "react";
import TVPodium from "./TVPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import { BettorRanking } from "@/app/models/CompetitorOdds";

interface Props {
  rankings: {
    month: number;
    year: number;
    count: number;
    rankings: BettorRanking[];
  } | null;
}

export const BettorRankingsView: FC<Props> = ({ rankings }) => {
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

  // Convert to row format with trend simulation
  const getTrend = (
    bettor: BettorRanking
  ): "up" | "down" | "stable" | undefined => {
    // Simulate trends based on win rate
    if (bettor.winRate > 0.5) return "up";
    if (bettor.winRate < 0.3) return "down";
    return "stable";
  };

  return (
    <div className="space-y-12">
      {/* Month subtitle */}
      <div className="text-center">
        <p className="text-tv-body text-neutral-400">
          {monthNames[month - 1]} {year}
        </p>
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
          {others.map((bettor, index) => (
            <TVLeaderboardRow
              key={bettor.userId}
              item={{
                id: bettor.userId,
                rank: bettor.rank,
                name: bettor.userName,
                score: bettor.totalPoints,
                scoreLabel: "pts",
                subtitle: `${bettor.betsWon}/${bettor.betsPlaced} gagnés • ${(bettor.winRate * 100).toFixed(0)}%`,
                trend: getTrend(bettor),
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
