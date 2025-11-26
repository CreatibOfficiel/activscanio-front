"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { Card, Badge } from '@/app/components/layout';

interface PodiumSummaryProps {
  selection: Partial<Record<BetPosition, string>>;
  competitors: CompetitorOdds[];
  boostedCompetitorId?: string;
  canBoost: boolean;
}

const PodiumSummary: FC<PodiumSummaryProps> = ({
  selection,
  competitors,
  boostedCompetitorId,
  canBoost,
}) => {
  const positionColors = {
    [BetPosition.FIRST]: 'gold',
    [BetPosition.SECOND]: 'silver',
    [BetPosition.THIRD]: 'bronze',
  } as const;

  const selectedCount = Object.keys(selection).length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <h3 className="text-bold text-white mb-3">Votre sélection</h3>
      <div className="space-y-2">
        {Object.entries(selection).map(([position, competitorId]) => {
          const competitor = competitors.find(
            (c) => c.competitorId === competitorId
          );
          if (!competitor) return null;

          const isBoosted = boostedCompetitorId === competitorId;
          const posLabel =
            position === BetPosition.FIRST
              ? '1er'
              : position === BetPosition.SECOND
                ? '2ème'
                : '3ème';

          return (
            <div
              key={position}
              className="flex items-center justify-between p-3 bg-neutral-750 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant={positionColors[position as BetPosition]} size="sm">
                  {posLabel}
                </Badge>
                <span className="text-regular text-white">
                  {competitor.competitorName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-primary-500 font-bold">
                  {competitor.odd.toFixed(2)}x
                </span>
                {isBoosted && (
                  <Badge variant="warning" size="sm">
                    x2
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boost hint */}
      {canBoost && (
        <p className="text-sub text-primary-500 mt-3 text-center">
          💡 Appliquez un boost x2 sur un compétiteur pour doubler vos gains !
        </p>
      )}
    </Card>
  );
};

export default PodiumSummary;
