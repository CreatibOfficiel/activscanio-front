'use client';

import { FC } from 'react';
import Link from 'next/link';
import { StreakWarningStatus } from '../../models/Achievement';

interface StreakWarningBannerProps {
  warnings: StreakWarningStatus;
  className?: string;
}

const StreakWarningBanner: FC<StreakWarningBannerProps> = ({
  warnings,
  className = '',
}) => {
  const { bettingStreak, playStreak } = warnings;

  if (!bettingStreak.atRisk && !playStreak.atRisk) return null;

  const isBettingCritical = bettingStreak.atRisk && bettingStreak.weekClosesAt
    ? isClosingSoon(bettingStreak.weekClosesAt)
    : false;

  return (
    <div className={`space-y-2 ${className}`}>
      {bettingStreak.atRisk && (
        <Link href="/betting" className="block">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isBettingCritical
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <span className="text-xl animate-pulse">
              {isBettingCritical ? '🚨' : '⏳'}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  isBettingCritical ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {isBettingCritical
                  ? 'DERNIER JOUR pour parier !'
                  : `Serie de ${bettingStreak.currentStreak} semaine(s) en danger !`}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {isBettingCritical
                  ? `Ta serie de ${bettingStreak.currentStreak} semaine(s) se termine ce soir.`
                  : "N'oublie pas de placer ton prono cette semaine."}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                isBettingCritical
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              Parier
            </span>
          </div>
        </Link>
      )}

      {playStreak.atRisk && (
        <Link href="/races" className="block">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/30"
          >
            <span className="text-xl animate-pulse">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400">
                Serie de {playStreak.currentStreak}j en danger !
              </p>
              <p className="text-xs text-neutral-400 truncate">
                Dernier jour pour sauver ta serie. Fais une course !
              </p>
            </div>
            <span
              className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 bg-red-500/20 text-red-400"
            >
              Jouer
            </span>
          </div>
        </Link>
      )}
    </div>
  );
};

/**
 * Check if the betting week closes within 24 hours (Monday deadline).
 */
function isClosingSoon(weekClosesAt: string): boolean {
  const closes = new Date(weekClosesAt);
  const now = new Date();
  const diffMs = closes.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24 && diffHours > 0;
}

export default StreakWarningBanner;
