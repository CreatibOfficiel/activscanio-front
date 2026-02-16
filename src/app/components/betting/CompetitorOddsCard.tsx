"use client";

import { FC, ReactNode, useMemo } from 'react';
import { CompetitorOdds, IneligibilityReason } from '@/app/models/CompetitorOdds';
import { Card, Badge } from '@/app/components/ui';
import { MdBolt, MdSchedule, MdSnooze, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
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
  showEligibilityBadge?: boolean;
  displayOdd?: number;
}

/**
 * Get display info for ineligibility reason
 */
const getIneligibilityBadge = (
  reason: IneligibilityReason,
  calibrationProgress?: number
): { label: string; icon: ReactNode; variant: 'warning' | 'default' } | null => {
  if (!reason) return null;

  switch (reason) {
    case 'calibrating':
      return {
        label: `En calibration (${calibrationProgress ?? 0}/5)`,
        icon: <MdSchedule className="inline mr-1" />,
        variant: 'warning',
      };
    case 'inactive':
      return {
        label: 'Inactif',
        icon: <MdSnooze className="inline mr-1" />,
        variant: 'default',
      };
    default:
      return null;
  }
};

/**
 * Get form badge based on relative performance
 * Compare recent average rank (last 5 races) to historical average (avgRank12)
 * - recentAvgRank < avgRank12 - 0.5 = "En forme" (performing better than usual)
 * - recentAvgRank > avgRank12 + 0.5 = "En difficulte" (performing worse than usual)
 */
const getFormBadge = (
  recentPositions?: number[],
  avgRank12?: number
): { label: string; icon: ReactNode; variant: 'success' | 'error' } | null => {
  // Need both values to compare
  if (!recentPositions || recentPositions.length === 0 || avgRank12 === undefined || avgRank12 === 0) {
    return null;
  }

  // Calculate recent average rank
  const recentAvgRank = recentPositions.reduce((sum, pos) => sum + pos, 0) / recentPositions.length;

  // Compare to historical average (lower rank = better performance)
  if (recentAvgRank < avgRank12 - 0.5) {
    return {
      label: 'En forme',
      icon: <MdTrendingUp className="inline mr-1" />,
      variant: 'success',
    };
  }

  if (recentAvgRank > avgRank12 + 0.5) {
    return {
      label: 'En difficulte',
      icon: <MdTrendingDown className="inline mr-1" />,
      variant: 'error',
    };
  }

  return null;
};


const CompetitorOddsCard: FC<CompetitorOddsCardProps> = ({
  competitorOdds,
  isSelected = false,
  isBoosted = false,
  position = null,
  onSelect,
  onBoost,
  showBoostButton = false,
  disabled = false,
  showEligibilityBadge = true,
  displayOdd: displayOddProp,
}) => {
  // Check if competitor is ineligible
  const isIneligible = competitorOdds.isEligible === false;
  const ineligibilityBadge = showEligibilityBadge
    ? getIneligibilityBadge(
        competitorOdds.ineligibilityReason ?? null,
        competitorOdds.calibrationProgress
      )
    : null;

  // Get form badge (relative to player's own average)
  const recentPositions = competitorOdds.competitor?.recentPositions;
  const avgRank12 = competitorOdds.competitor?.avgRank12;
  const formBadge = useMemo(
    () => getFormBadge(recentPositions, avgRank12),
    [recentPositions, avgRank12]
  );

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

  // Get the appropriate odd based on position
  const getDisplayOdd = (): number => {
    if (position === 'first' && competitorOdds.oddFirst !== undefined) {
      return competitorOdds.oddFirst;
    }
    if (position === 'second' && competitorOdds.oddSecond !== undefined) {
      return competitorOdds.oddSecond;
    }
    if (position === 'third' && competitorOdds.oddThird !== undefined) {
      return competitorOdds.oddThird;
    }
    // Fallback to legacy odd field
    return competitorOdds.odd;
  };

  const displayOdd = displayOddProp ?? getDisplayOdd();

  // Determine if card should be disabled due to ineligibility
  const effectiveDisabled = disabled || isIneligible;

  return (
    <Card
      variant={cardVariant}
      className={`p-3 relative ${cardClass} ${effectiveDisabled ? 'opacity-50' : ''}`}
      onClick={!effectiveDisabled ? onSelect : undefined}
      hover={!effectiveDisabled && !isSelected}
    >
      {/* Position indicator - top left */}
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

      {/* Ineligibility badge - top left (when no position) */}
      {!position && ineligibilityBadge && (
        <div className="absolute top-2 left-2">
          <Badge variant={ineligibilityBadge.variant} size="sm">
            {ineligibilityBadge.icon}
            {ineligibilityBadge.label}
          </Badge>
        </div>
      )}

      {/* Boost indicator - top right */}
      {isBoosted && (
        <div className="absolute top-2 right-2">
          <Badge variant="warning" size="sm">
            <MdBolt className="inline mr-1" />
            x2
          </Badge>
        </div>
      )}

      {/* Form badge - top right (when no boost) */}
      {!isBoosted && formBadge && (
        <div className="absolute top-2 right-2">
          <Badge variant={formBadge.variant} size="sm">
            {formBadge.icon}
            {formBadge.label}
          </Badge>
        </div>
      )}

      <div className={`flex items-center gap-3 ${position || ineligibilityBadge || formBadge || isBoosted ? 'pt-6' : ''}`}>
        {/* Profile picture placeholder - reduced from 64px to 40px */}
        <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
          {competitorName.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name - more prominent */}
          <h3 className="text-base font-semibold text-white truncate">{competitorName}</h3>

          {/* Stats - smaller and muted */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-neutral-500">
              ELO {Math.round(competitorOdds.metadata?.elo ?? 0)}
            </span>
          </div>
        </div>

        {/* Odds display - featured on the right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl font-bold text-primary-500">
            {displayOdd.toFixed(2)}x
          </span>

          {/* Boost button */}
          {showBoostButton && isSelected && !isBoosted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBoost?.();
              }}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-neutral-900 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
            >
              <MdBolt className="text-base" />
              x2
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CompetitorOddsCard;
