"use client";

import { FC, ReactNode, useMemo } from 'react';
import { CompetitorOdds, IneligibilityReason } from '@/app/models/CompetitorOdds';
import { Card } from '@/app/components/ui';
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
  showAllOdds?: boolean;
  variant?: 'default' | 'tv';
  animationDelay?: number;
}

const sizeConfig = {
  default: {
    padding: 'p-3',
    avatar: 'w-10 h-10',
    avatarText: 'text-base',
    name: 'text-base',
    elo: 'text-xs',
    badge: 'text-[11px]',
    oddsHeader: 'text-[10px]',
    oddsValue: 'text-sm',
    oddsMinWidth: 'min-w-[3rem]',
    oddsGap: 'gap-3',
  },
  tv: {
    padding: 'p-5',
    avatar: 'w-14 h-14',
    avatarText: 'text-xl',
    name: 'text-xl',
    elo: 'text-sm',
    badge: 'text-xs',
    oddsHeader: 'text-xs',
    oddsValue: 'text-lg',
    oddsMinWidth: 'min-w-[4rem]',
    oddsGap: 'gap-5',
  },
} as const;

const getIneligibilityInfo = (
  reason: IneligibilityReason,
  calibrationProgress?: number
): { label: string; icon: ReactNode; className: string } | null => {
  if (!reason) return null;

  switch (reason) {
    case 'calibrating':
      return {
        label: `Calibration ${calibrationProgress ?? 0}/5`,
        icon: <MdSchedule className="text-xs" />,
        className: 'text-yellow-500 bg-yellow-500/10',
      };
    case 'inactive':
      return {
        label: 'Inactif',
        icon: <MdSnooze className="text-xs" />,
        className: 'text-neutral-400 bg-neutral-700',
      };
    default:
      return null;
  }
};

const getFormInfo = (
  recentPositions?: number[],
  avgRank12?: number
): { label: string; icon: ReactNode; className: string } | null => {
  if (!recentPositions || recentPositions.length < 3 || !avgRank12) {
    return null;
  }

  const recentAvgRank = recentPositions.reduce((sum, pos) => sum + Number(pos), 0) / recentPositions.length;

  if (recentAvgRank < avgRank12 - 0.5) {
    return {
      label: 'En forme',
      icon: <MdTrendingUp className="text-xs" />,
      className: 'text-success-500 bg-success-500/10',
    };
  }

  if (recentAvgRank > avgRank12 + 0.5) {
    return {
      label: 'En baisse',
      icon: <MdTrendingDown className="text-xs" />,
      className: 'text-error-500 bg-error-500/10',
    };
  }

  return null;
};

const positionEmojis: Record<string, string> = {
  first: '🥇',
  second: '🥈',
  third: '🥉',
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
  showAllOdds = false,
  variant = 'default',
  animationDelay,
}) => {
  const sizes = sizeConfig[variant];
  const isIneligible = competitorOdds.isEligible === false;
  const ineligibilityInfo = showEligibilityBadge
    ? getIneligibilityInfo(
        competitorOdds.ineligibilityReason ?? null,
        competitorOdds.calibrationProgress
      )
    : null;

  const recentPositions = competitorOdds.competitor?.recentPositions;
  const avgRank12 = competitorOdds.competitor?.avgRank12;
  const formInfo = useMemo(
    () => getFormInfo(recentPositions, avgRank12),
    [recentPositions, avgRank12]
  );

  const competitorName = formatCompetitorName(
    competitorOdds.competitor?.firstName,
    competitorOdds.competitor?.lastName,
    competitorOdds.competitorName
  );

  const getDisplayOdd = (): number => {
    if (position === 'first' && competitorOdds.oddFirst !== undefined) {
      return competitorOdds.oddFirst;
    }
    if (position === 'second') {
      return competitorOdds.oddSecond;
    }
    if (position === 'third') {
      return competitorOdds.oddThird;
    }
    return competitorOdds.oddFirst;
  };

  const displayOdd = displayOddProp ?? getDisplayOdd();
  const effectiveDisabled = disabled || isIneligible;

  // Card border styling based on selection state
  const cardClass = isSelected && position
    ? 'ring-1 ring-primary-500/40 bg-primary-500/5'
    : '';

  const cardContent = (
    <Card
      variant="default"
      className={`${sizes.padding} ${cardClass} ${effectiveDisabled ? 'opacity-50' : ''}`}
      onClick={!effectiveDisabled ? onSelect : undefined}
      hover={!effectiveDisabled && !isSelected}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with position emoji overlay */}
        <div className={`relative ${sizes.avatar} flex-shrink-0`}>
          <div className={`${sizes.avatar} bg-neutral-700 rounded-full flex items-center justify-center ${sizes.avatarText} font-bold`}>
            {competitorName.charAt(0)}
          </div>
          {position && (
            <span className="absolute -bottom-1 -right-1 text-sm leading-none" aria-label={`Position ${position}`}>
              {positionEmojis[position]}
            </span>
          )}
        </div>

        {/* Name + metadata row */}
        <div className="flex-1 min-w-0">
          {/* Name line */}
          <div className="flex items-center gap-1.5">
            <h3 className={`${sizes.name} font-semibold text-white truncate`}>{competitorName}</h3>
            {isBoosted && (
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${sizes.badge} font-bold text-yellow-500 bg-yellow-500/10`}>
                <MdBolt className="text-xs" />
                x2
              </span>
            )}
          </div>

          {/* Metadata line: ELO + inline pills */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`${sizes.elo} text-neutral-500`}>
              ELO {Math.round(competitorOdds.metadata?.elo ?? 0)}
            </span>

            {/* Form indicator (inline pill) */}
            {formInfo && (
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${sizes.badge} font-medium ${formInfo.className}`}>
                {formInfo.icon}
                {formInfo.label}
              </span>
            )}

            {/* Ineligibility indicator (inline pill) */}
            {!position && ineligibilityInfo && (
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${sizes.badge} font-medium ${ineligibilityInfo.className}`}>
                {ineligibilityInfo.icon}
                {ineligibilityInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Right side: Odds + Boost */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showAllOdds && !position ? (
            <div className={`flex items-center ${sizes.oddsGap}`}>
              <div className={`text-center ${sizes.oddsMinWidth}`}>
                <div className={`${sizes.oddsHeader} text-yellow-500 font-medium`}>1er</div>
                <div className={`${sizes.oddsValue} font-bold text-white`}>{competitorOdds.oddFirst?.toFixed(2)}</div>
              </div>
              <div className={`text-center ${sizes.oddsMinWidth}`}>
                <div className={`${sizes.oddsHeader} text-neutral-400 font-medium`}>2eme</div>
                <div className={`${sizes.oddsValue} font-bold text-white`}>{competitorOdds.oddSecond?.toFixed(2)}</div>
              </div>
              <div className={`text-center ${sizes.oddsMinWidth}`}>
                <div className={`${sizes.oddsHeader} text-amber-600 font-medium`}>3eme</div>
                <div className={`${sizes.oddsValue} font-bold text-white`}>{competitorOdds.oddThird?.toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <span className="text-xl font-bold text-primary-500">
              {displayOdd.toFixed(2)}x
            </span>
          )}

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

  if (variant === 'tv' && animationDelay !== undefined) {
    return (
      <div className="animate-row-slide-in" style={{ animationDelay: `${animationDelay}ms` }}>
        {cardContent}
      </div>
    );
  }

  return cardContent;
};

export default CompetitorOddsCard;
