"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import CompetitorOddsCard from './CompetitorOddsCard';

interface PodiumCompetitorListProps {
  competitors: CompetitorOdds[];
  filteredCompetitors: CompetitorOdds[];
  selection: Partial<Record<BetPosition, string>>;
  boostedCompetitorId?: string;
  canBoost: boolean;
  disabled: boolean;
  onSelectCompetitor: (competitorId: string) => void;
  onBoost: (competitorId: string) => void;
  searchQuery: string;
}

const PodiumCompetitorList: FC<PodiumCompetitorListProps> = ({
  competitors,
  filteredCompetitors,
  selection,
  boostedCompetitorId,
  canBoost,
  disabled,
  onSelectCompetitor,
  onBoost,
  searchQuery,
}) => {
  const isCompetitorSelected = (competitorId: string): boolean => {
    return Object.values(selection).includes(competitorId);
  };

  const getCompetitorPosition = (
    competitorId: string
  ): BetPosition | null => {
    for (const [position, id] of Object.entries(selection)) {
      if (id === competitorId) {
        return position as BetPosition;
      }
    }
    return null;
  };

  if (competitors.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Header with count */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-bold text-white">
          Pilotes éligibles ({competitors.length})
        </h3>
        {searchQuery && (
          <span className="text-xs text-neutral-400">
            {filteredCompetitors.length} résultat{filteredCompetitors.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Odds explanation */}
      <p className="text-xs text-neutral-400 mb-4 px-1">
        Cote = points gagnés si correct. Plus la cote est haute, plus le joueur est outsider.
      </p>

      {/* Competitor cards */}
      <div className="space-y-2">
        {filteredCompetitors.map((competitor) => {
          const isSelected = isCompetitorSelected(competitor.competitorId);
          const position = getCompetitorPosition(competitor.competitorId);
          const isBoosted = boostedCompetitorId === competitor.competitorId;

          return (
            <CompetitorOddsCard
              key={competitor.competitorId}
              competitorOdds={competitor}
              isSelected={isSelected}
              isBoosted={isBoosted}
              position={position}
              onSelect={() => onSelectCompetitor(competitor.competitorId)}
              onBoost={() => onBoost(competitor.competitorId)}
              showBoostButton={canBoost}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Empty search results */}
      {searchQuery && filteredCompetitors.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          <p>Aucun pilote trouvé pour « {searchQuery} »</p>
        </div>
      )}
    </div>
  );
};

export default PodiumCompetitorList;
