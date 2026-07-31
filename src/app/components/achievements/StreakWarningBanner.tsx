'use client';

import { FC } from 'react';
import Link from 'next/link';
import { StreakWarningStatus } from '../../models/Achievement';

interface StreakWarningBannerProps {
  warnings: StreakWarningStatus;
  className?: string;
}

/**
 * Warns that a streak is about to break.
 *
 * The betting half of this banner is gone. It linked to /betting, deleted
 * with the betting system, and the condition was reachable: the API still
 * sets `bettingStreak.atRisk` for anyone with a running participation
 * streak who has not played this week. The result was a red banner on the
 * home page pointing at a 404.
 *
 * `bettingStreak` is still sent and still typed, because the API has not
 * stopped sending it — it is simply not read here any more.
 */
const StreakWarningBanner: FC<StreakWarningBannerProps> = ({
  warnings,
  className = '',
}) => {
  const { playStreak } = warnings;

  if (!playStreak.atRisk) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <Link href="/races" className="block">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/30">
          <span className="text-xl animate-pulse">🚨</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">
              Série de {playStreak.currentStreak}j en danger !
            </p>
            <p className="text-xs text-neutral-400 truncate">
              Dernier jour pour sauver ta série. Fais une course !
            </p>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 bg-red-500/20 text-red-400">
            Jouer
          </span>
        </div>
      </Link>
    </div>
  );
};

export default StreakWarningBanner;
