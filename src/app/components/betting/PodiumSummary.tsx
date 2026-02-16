"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { formatCompetitorName } from '@/app/utils/formatters';
import { MdBolt } from 'react-icons/md';

interface PodiumSummaryProps {
  selection: Partial<Record<BetPosition, string>>;
  competitors: CompetitorOdds[];
  boostedCompetitorId?: string;
  currentPosition?: BetPosition;
  onChangePosition?: (position: BetPosition) => void;
}

const PodiumSummary: FC<PodiumSummaryProps> = ({
  selection,
  competitors,
  boostedCompetitorId,
  currentPosition,
  onChangePosition,
}) => {
  const positions = [BetPosition.FIRST, BetPosition.SECOND, BetPosition.THIRD];

  const positionConfig = {
    [BetPosition.FIRST]: { label: '1er', icon: '🥇' },
    [BetPosition.SECOND]: { label: '2ème', icon: '🥈' },
    [BetPosition.THIRD]: { label: '3ème', icon: '🥉' },
  };

  const getCompetitorShortName = (competitor: CompetitorOdds): string => {
    const firstName = competitor.competitor?.firstName || '';
    const lastName = competitor.competitor?.lastName || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    const fullName = formatCompetitorName(
      competitor.competitor?.firstName,
      competitor.competitor?.lastName,
      competitor.competitorName
    );
    if (fullName.length > 12) {
      return fullName.slice(0, 11) + '…';
    }
    return fullName;
  };

  const getOddForPosition = (competitor: CompetitorOdds, position: BetPosition): number => {
    if (position === BetPosition.FIRST && competitor.oddFirst !== undefined) return competitor.oddFirst;
    if (position === BetPosition.SECOND && competitor.oddSecond !== undefined) return competitor.oddSecond;
    if (position === BetPosition.THIRD && competitor.oddThird !== undefined) return competitor.oddThird;
    return competitor.odd;
  };

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

        // 4 states: empty+not current, empty+current, filled+not current, filled+current
        let pillClasses: string;
        if (competitor) {
          pillClasses = isCurrent
            ? 'bg-primary-500/15 ring-2 ring-primary-500'
            : 'bg-neutral-750';
        } else {
          pillClasses = isCurrent
            ? 'bg-primary-500/10 ring-2 ring-primary-500'
            : 'bg-neutral-800 border border-dashed border-neutral-700';
        }

        const odd = competitor ? getOddForPosition(competitor, position) : null;

        return (
          <button
            key={position}
            onClick={() => onChangePosition?.(position)}
            className={`
              flex items-center gap-1.5 px-3 h-11 rounded-xl text-sm
              transition-all flex-1 min-w-0
              ${pillClasses}
            `}
            aria-pressed={isCurrent}
            aria-label={`Position ${config.label}${competitor ? `: ${getCompetitorShortName(competitor)}` : ': non sélectionné'}`}
          >
            <span className="text-sm flex-shrink-0" aria-hidden="true">{config.icon}</span>
            {competitor ? (
              <>
                <span className="text-white font-medium truncate flex-1 text-left">
                  {getCompetitorShortName(competitor)}
                </span>
                {isBoosted ? (
                  <MdBolt className="text-yellow-500 text-base flex-shrink-0" aria-label="Boost actif" />
                ) : odd !== null ? (
                  <span className="text-primary-400 text-xs font-semibold flex-shrink-0">
                    {odd.toFixed(2)}
                  </span>
                ) : null}
              </>
            ) : (
              <span className={isCurrent ? 'text-primary-400 font-medium' : 'text-neutral-500'}>
                {isCurrent ? 'Choisir' : '---'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PodiumSummary;
