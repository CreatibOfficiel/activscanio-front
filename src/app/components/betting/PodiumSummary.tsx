"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { Card, Badge } from '@/app/components/ui';
import { formatCompetitorName } from '@/app/utils/formatters';
import { MdBolt } from 'react-icons/md';

interface PodiumSummaryProps {
  selection: Partial<Record<BetPosition, string>>;
  competitors: CompetitorOdds[];
  boostedCompetitorId?: string;
  canBoost: boolean;
  compact?: boolean;
  currentPosition?: BetPosition;
  onChangePosition?: (position: BetPosition) => void;
}

const PodiumSummary: FC<PodiumSummaryProps> = ({
  selection,
  competitors,
  boostedCompetitorId,
  canBoost,
  compact = false,
  currentPosition,
  onChangePosition,
}) => {
  const positions = [BetPosition.FIRST, BetPosition.SECOND, BetPosition.THIRD];

  const positionConfig = {
    [BetPosition.FIRST]: { label: '1er', icon: '🥇', variant: 'gold' as const },
    [BetPosition.SECOND]: { label: '2ème', icon: '🥈', variant: 'silver' as const },
    [BetPosition.THIRD]: { label: '3ème', icon: '🥉', variant: 'bronze' as const },
  };

  const selectedCount = Object.keys(selection).length;

  const getCompetitorShortName = (competitor: CompetitorOdds): string => {
    const fullName = formatCompetitorName(
      competitor.competitor?.firstName,
      competitor.competitor?.lastName,
      competitor.competitorName
    );
    // Truncate long names for compact view
    if (fullName.length > 10) {
      return fullName.slice(0, 9) + '…';
    }
    return fullName;
  };

  // Compact variant: horizontal pills for sticky header
  if (compact) {
    return (
      <div className="flex gap-2">
        {positions.map((position) => {
          const competitorId = selection[position];
          const competitor = competitorId
            ? competitors.find((c) => c.competitorId === competitorId)
            : null;
          const config = positionConfig[position];
          const isBoosted = competitorId && boostedCompetitorId === competitorId;
          const isCurrent = currentPosition === position;

          return (
            <button
              key={position}
              onClick={() => onChangePosition?.(position)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                transition-all flex-1 min-w-0 justify-center
                ${isCurrent
                  ? 'bg-primary-500/20 ring-2 ring-primary-500 ring-offset-1 ring-offset-neutral-900'
                  : competitor
                    ? 'bg-neutral-750 hover:bg-neutral-700'
                    : 'bg-neutral-800 border border-dashed border-neutral-700 hover:border-neutral-600'
                }
              `}
              aria-pressed={isCurrent}
              aria-label={`Position ${config.label}${competitor ? `: ${getCompetitorShortName(competitor)}` : ': non sélectionné'}`}
            >
              <span className="text-sm" aria-hidden="true">{config.icon}</span>
              {competitor ? (
                <span className="text-white font-medium truncate">
                  {getCompetitorShortName(competitor)}
                </span>
              ) : (
                <span className="text-neutral-500">---</span>
              )}
              {isBoosted && (
                <MdBolt className="text-yellow-500 text-sm flex-shrink-0" aria-label="Boost actif" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Full variant: card with vertical rows (original design)
  return (
    <Card className="p-4">
      <h3 className="text-bold text-white mb-3">Votre sélection</h3>
      <div className="space-y-2">
        {positions.map((position) => {
          const competitorId = selection[position];
          const competitor = competitorId
            ? competitors.find((c) => c.competitorId === competitorId)
            : null;
          const config = positionConfig[position];
          const isBoosted = competitorId && boostedCompetitorId === competitorId;

          return (
            <div
              key={position}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                competitor ? 'bg-neutral-750' : 'bg-neutral-800 border border-dashed border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">{config.icon}</span>
                {competitor ? (
                  <span className="text-regular text-white">
                    {formatCompetitorName(
                      competitor.competitor?.firstName,
                      competitor.competitor?.lastName,
                      competitor.competitorName
                    )}
                  </span>
                ) : (
                  <span className="text-regular text-neutral-500">
                    Non sélectionné
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {competitor ? (
                  <>
                    <span className="text-primary-500 font-bold">
                      {competitor.odd.toFixed(2)}x
                    </span>
                    {isBoosted && (
                      <Badge variant="warning" size="sm">
                        x2
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-neutral-600">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boost hint */}
      {canBoost && selectedCount === 3 && (
        <p className="text-sub text-primary-500 mt-3 text-center">
          Appliquez un boost x2 sur un compétiteur pour doubler vos gains !
        </p>
      )}
    </Card>
  );
};

export default PodiumSummary;
