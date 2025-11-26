"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import CompetitorOddsCard from './CompetitorOddsCard';

interface PodiumCompetitorListProps {
  competitors: CompetitorOdds[];
  selection: Partial<Record<BetPosition, string>>;
  boostedCompetitorId?: string;
  canBoost: boolean;
  disabled: boolean;
  isComplete: boolean;
  onSelectCompetitor: (competitorId: string) => void;
  onBoost: (competitorId: string) => void;
}

const PodiumCompetitorList: FC<PodiumCompetitorListProps> = ({
  competitors,
  selection,
  boostedCompetitorId,
  canBoost,
  disabled,
  isComplete,
  onSelectCompetitor,
  onBoost,
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
      <h3 className="text-bold text-white mb-3">
        Compétiteurs éligibles ({competitors.length})
      </h3>
      <div className="space-y-3">
        {competitors.map((competitor) => {
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
              disabled={disabled || (isComplete && !isSelected)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PodiumCompetitorList;
