"use client";

import { FC } from 'react';
import { Card } from '@/app/components/ui';
import { Competitor } from '@/app/models/Competitor';

interface Props {
  rankings: Competitor[];
}

export const CompetitorRankingsView: FC<Props> = ({ rankings }) => {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-heading text-neutral-400">Aucun compétiteur trouvé</p>
      </div>
    );
  }

  // Trier par rating (Glicko-2) décroissant
  const sortedCompetitors = [...rankings].sort((a, b) => b.rating - a.rating);

  const top3 = sortedCompetitors.slice(0, 3);
  const others = sortedCompetitors.slice(3, 20); // Top 20 pour la TV

  return (
    <div className="space-y-8">
      {/* Podium Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          {top3.map((competitor, index) => {
            const rank = index + 1;
            return (
              <Card
                key={competitor.id}
                className={`p-6 text-center ${
                  rank === 1
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : rank === 2
                    ? 'border-gray-400 bg-gray-400/10'
                    : 'border-amber-700 bg-amber-700/10'
                }`}
              >
                <div className="text-6xl mb-3">
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>

                {/* Personnage si disponible */}
                {competitor.characterVariant && (
                  <p className="text-sub text-neutral-400 mb-2">
                    {competitor.characterVariant.baseCharacter.name} - {competitor.characterVariant.label}
                  </p>
                )}

                <h3 className="text-heading font-bold text-white mb-2">
                  {competitor.firstName} {competitor.lastName}
                </h3>

                <p className="text-title text-primary-500 font-bold mb-2">
                  {Math.round(competitor.rating)} ELO
                </p>

                <div className="text-sub text-neutral-400 space-y-1">
                  <p>{competitor.raceCount || 0} courses</p>
                  {competitor.avgRank12 !== undefined && competitor.avgRank12 > 0 && (
                    <p>Moy: {competitor.avgRank12.toFixed(1)}ème</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Autres classés */}
      {others.length > 0 && (
        <div className="space-y-3">
          {others.map((competitor, index) => {
            const rank = index + 4;
            return (
              <Card key={competitor.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-heading font-bold text-neutral-400 w-12 text-center">
                      #{rank}
                    </div>
                    <div>
                      <p className="text-bold text-white">
                        {competitor.firstName} {competitor.lastName}
                      </p>
                      <p className="text-sub text-neutral-400">
                        {competitor.characterVariant ? (
                          `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                        ) : (
                          `${competitor.raceCount || 0} courses`
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-heading font-bold text-primary-500">
                      {Math.round(competitor.rating)} ELO
                    </p>
                    {competitor.avgRank12 !== undefined && competitor.avgRank12 > 0 && (
                      <p className="text-sub text-neutral-400">
                        Moy: {competitor.avgRank12.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
