"use client";

import { FC } from 'react';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { Card, Badge } from '@/app/components/ui';
import { MdBolt } from 'react-icons/md';
import { formatCompetitorName } from '@/app/utils/formatters';

interface CompetitorOddsCardProps {
  competitorOdds: CompetitorOdds;
  isSelected?: boolean;
  isBoosted?: boolean;
  position?: 'first' | 'second' | 'third' | null;
  onSelect?: () => void;
  onBoost?: () => void;
  showBoostButton?: boolean;
  disabled?: boolean;
}

const CompetitorOddsCard: FC<CompetitorOddsCardProps> = ({
  competitorOdds,
  isSelected = false,
  isBoosted = false,
  position = null,
  onSelect,
  onBoost,
  showBoostButton = false,
  disabled = false,
}) => {
  // Get competitor name using standardized format
  const competitorName = formatCompetitorName(
    competitorOdds.competitor?.firstName,
    competitorOdds.competitor?.lastName,
    competitorOdds.competitorName
  );

  const positionColors = {
    first: 'border-gold-500 bg-gold-500/10',
    second: 'border-silver-500 bg-silver-500/10',
    third: 'border-bronze-500 bg-bronze-500/10',
  };

  const positionLabels = {
    first: '1er',
    second: '2ème',
    third: '3ème',
  };

  const cardVariant = isSelected && position ? 'primary' : 'default';
  const cardClass = position ? positionColors[position] : '';

  return (
    <Card
      variant={cardVariant}
      className={`p-4 relative ${cardClass} ${disabled ? 'opacity-50' : ''}`}
      onClick={!disabled ? onSelect : undefined}
      hover={!disabled && !isSelected}
    >
      {/* Boost indicator */}
      {isBoosted && (
        <div className="absolute top-2 right-2">
          <Badge variant="warning" size="sm">
            <MdBolt className="inline mr-1" />
            x2
          </Badge>
        </div>
      )}

      {/* Position indicator */}
      {position && (
        <div className="absolute top-2 left-2">
          <Badge
            variant={position === 'first' ? 'gold' : position === 'second' ? 'silver' : 'bronze'}
            size="sm"
          >
            {positionLabels[position]}
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Profile picture placeholder */}
        <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center text-2xl font-bold">
          {competitorName.charAt(0)}
        </div>

        <div className="flex-1">
          <h3 className="text-bold text-white">{competitorName}</h3>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-sub text-neutral-400">
              ELO: {Math.round(competitorOdds.metadata?.elo ?? 0)}
            </span>
            <span className="text-sub text-neutral-400">•</span>
            <span className="text-sub text-neutral-400">
              Forme: {((competitorOdds.formFactor ?? competitorOdds.metadata?.formFactor ?? 0) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Odds display */}
          <div className="mt-2">
            <span className="text-primary-500 text-statistic font-bold">
              {competitorOdds.odd.toFixed(2)}x
            </span>
            <span className="text-sub text-neutral-500 ml-2">
              ({((competitorOdds.probability ?? competitorOdds.metadata?.probability ?? 0) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Boost button */}
        {showBoostButton && isSelected && !isBoosted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBoost?.();
            }}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-neutral-900 rounded-lg font-bold transition-colors flex items-center gap-1"
          >
            <MdBolt />
            Boost x2
          </button>
        )}
      </div>
    </Card>
  );
};

export default CompetitorOddsCard;
