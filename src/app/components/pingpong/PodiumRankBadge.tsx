'use client';

import { FC } from 'react';

interface PodiumRankBadgeProps {
  rank: number;
  className?: string;
}

/**
 * The rank marker on a podium card.
 *
 * Not `RankBadge`. That one renders a `rounded-full` gradient pill and, at
 * its default `showMedal`, an emoji in place of the digit — which is the
 * exact complaint this redesign answers. The podium marker is a squircle
 * with a thin keycap outline drawn around a digit, a different shape rather
 * than a different size, so it is its own component instead of a fourth
 * branch inside a component the Mario Kart board also uses.
 *
 * The metal colours are tokens. Every measured value in the reference landed
 * on one within a few units per channel, so there is nothing here worth
 * hardcoding.
 *
 * `aria-hidden`: the rank is already in the card's own accessible name, and
 * announcing a bare "1" between the name and the stats reads as a stray
 * number.
 */
const METAL: Record<number, string> = {
  1: 'bg-gold-500',
  2: 'bg-silver-500',
  3: 'bg-bronze-500',
};

const PodiumRankBadge: FC<PodiumRankBadgeProps> = ({ rank, className = '' }) => (
  <span
    data-testid="podium-rank-badge"
    aria-hidden="true"
    className={`
      flex h-8 w-8 items-center justify-center rounded-[9px]
      text-neutral-900 ${METAL[rank] ?? 'bg-neutral-300'} ${className}
    `}
  >
    <span className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-current text-[10px] font-bold">
      {rank}
    </span>
  </span>
);

export default PodiumRankBadge;
