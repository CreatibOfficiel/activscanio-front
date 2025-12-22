"use client";

import { FC } from 'react';
import { Card } from '@/app/components/ui';
import { BettorRanking } from '@/app/models/CompetitorOdds';

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
        <p className="text-heading text-neutral-400">Aucun classement disponible pour le moment</p>
      </div>
    );
  }

  const { month, year, rankings: rankedBettors } = rankings;
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const top3 = rankedBettors.slice(0, 3);
  const others = rankedBettors.slice(3, 20); // Afficher top 20 pour la TV

  return (
    <div className="space-y-8">
      {/* Titre avec mois */}
      <div className="text-center mb-8">
        <p className="text-sub text-neutral-400">
          {monthNames[month - 1]} {year}
        </p>
      </div>

      {/* Podium Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          {top3.map((bettor) => (
            <Card
              key={bettor.userId}
              className={`p-6 text-center ${
                bettor.rank === 1
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : bettor.rank === 2
                  ? 'border-gray-400 bg-gray-400/10'
                  : 'border-amber-700 bg-amber-700/10'
              }`}
            >
              <div className="text-6xl mb-3">
                {bettor.rank === 1 ? '🥇' : bettor.rank === 2 ? '🥈' : '🥉'}
              </div>
              <h3 className="text-heading font-bold text-white mb-2">
                {bettor.userName}
              </h3>
              <p className="text-title text-primary-500 font-bold mb-2">
                {bettor.totalPoints.toFixed(1)} pts
              </p>
              <div className="text-sub text-neutral-400 space-y-1">
                <p>{bettor.betsWon}/{bettor.betsPlaced} paris gagnés</p>
                <p>{(bettor.winRate * 100).toFixed(0)}% de réussite</p>
                {bettor.perfectBets > 0 && (
                  <p className="text-primary-500">⭐ {bettor.perfectBets} podiums parfaits</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Autres classés */}
      {others.length > 0 && (
        <div className="space-y-3">
          {others.map((bettor) => (
            <Card key={bettor.userId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-heading font-bold text-neutral-400 w-12 text-center">
                    #{bettor.rank}
                  </div>
                  <div>
                    <p className="text-bold text-white">{bettor.userName}</p>
                    <p className="text-sub text-neutral-400">
                      {bettor.betsWon}/{bettor.betsPlaced} gagnés • {(bettor.winRate * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-heading font-bold text-primary-500">
                    {bettor.totalPoints.toFixed(1)} pts
                  </p>
                  {bettor.perfectBets > 0 && (
                    <p className="text-sub text-primary-400">⭐ {bettor.perfectBets}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
