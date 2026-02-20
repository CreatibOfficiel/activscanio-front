'use client';

import { FC } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { formatCompetitorName } from '@/app/utils/formatters';
import RankBadge from './RankBadge';
import { CompetitorAnimData } from '@/app/hooks/useRankingAnimation';

interface Props {
  competitor: CompetitorAnimData;
  isChanged: boolean;
  variant?: 'mobile' | 'tv';
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
  mass: 0.8,
};

const RankingTransitionCard: FC<Props> = ({
  competitor,
  isChanged,
  variant = 'mobile',
}) => {
  const { delta, isNew } = competitor;
  const shortName = formatCompetitorName(competitor.firstName, competitor.lastName);
  const score = Math.round(competitor.conservativeScore);

  const isTV = variant === 'tv';
  const avatarSize = isTV ? 64 : 40;

  // Glow color based on rank change direction
  const glowClass = !isChanged
    ? ''
    : delta > 0
      ? 'shadow-[0_0_12px_rgba(34,197,94,0.3)]' // green glow (rank up)
      : 'shadow-[0_0_12px_rgba(239,68,68,0.3)]'; // red glow (rank down)

  const borderClass = !isChanged
    ? 'border-neutral-700/50'
    : delta > 0
      ? 'border-green-500/40'
      : 'border-red-500/40';

  return (
    <motion.div
      layout
      layoutId={`ranking-card-${competitor.id}`}
      transition={springTransition}
      initial={isNew ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-center gap-3 rounded-xl border bg-neutral-800/60 backdrop-blur-sm
        ${borderClass} ${glowClass}
        ${isTV ? 'px-6 py-4 gap-5' : 'px-3 py-2.5'}
      `}
    >
      {/* Rank badge */}
      <RankBadge rank={competitor.newRank} size={isTV ? 'lg' : 'md'} />

      {/* Avatar */}
      <div className="flex-shrink-0">
        <Image
          src={competitor.profilePictureUrl}
          alt={competitor.firstName}
          width={avatarSize}
          height={avatarSize}
          className="rounded-full object-cover"
        />
      </div>

      {/* Name */}
      <div className="flex-grow min-w-0">
        <span
          className={`font-semibold text-neutral-100 truncate block ${
            isTV ? 'text-xl' : 'text-sm'
          }`}
        >
          {shortName}
        </span>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <div className={`font-bold text-neutral-100 ${isTV ? 'text-2xl' : 'text-base'}`}>
          {score}
        </div>
        <div className={`text-neutral-500 uppercase ${isTV ? 'text-sm' : 'text-xs'}`}>
          ELO
        </div>
      </div>

      {/* Delta badge */}
      {isChanged && delta !== 0 && (
        <div
          className={`
            flex items-center justify-center rounded-full font-bold flex-shrink-0
            ${isTV ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'}
            ${
              delta > 0
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }
          `}
        >
          {delta > 0 ? `+${delta}` : delta}
        </div>
      )}
    </motion.div>
  );
};

export default RankingTransitionCard;
