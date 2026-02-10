'use client';

import { FC } from 'react';
import { MdCheck } from 'react-icons/md';

interface StreakIndicatorProps {
  type: 'monthly' | 'lifetime';
  currentStreak: number;
  totalWeeksInMonth?: number;
  className?: string;
}

/**
 * StreakIndicator Component
 *
 * Modern redesign of streak display with:
 * - Mini-calendar visual for monthly streaks (4 week boxes)
 * - Progress bar towards "perfect month"
 * - Clear explanatory tooltips
 * - No emojis - uses clean icons instead
 */
const StreakIndicator: FC<StreakIndicatorProps> = ({
  type,
  currentStreak,
  totalWeeksInMonth = 4,
  className = '',
}) => {
  const totalWeeks = Math.min(totalWeeksInMonth, 5); // Cap at 5 weeks max

  if (type === 'monthly') {
    return <MonthlyStreak streak={currentStreak} totalWeeks={totalWeeks} className={className} />;
  }

  return <LifetimeStreak streak={currentStreak} className={className} />;
};

interface MonthlyStreakProps {
  streak: number;
  totalWeeks: number;
  className?: string;
}

const MonthlyStreak: FC<MonthlyStreakProps> = ({ streak, totalWeeks, className = '' }) => {
  const activeWeeks = Math.min(streak, totalWeeks);
  const progress = totalWeeks > 0 ? (activeWeeks / totalWeeks) * 100 : 0;
  const isPerfect = activeWeeks >= totalWeeks;
  const weeksRemaining = Math.max(0, totalWeeks - activeWeeks);

  const getMessage = () => {
    if (isPerfect) return 'Mois parfait !';
    if (activeWeeks === 0) return 'Placez un pari pour démarrer !';
    if (weeksRemaining === 1) return 'Encore 1 semaine pour le mois parfait !';
    return `Encore ${weeksRemaining} semaines pour le mois parfait !`;
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Week boxes */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalWeeks }).map((_, index) => {
          const isActive = index < activeWeeks;
          const isCurrent = index === activeWeeks - 1 && activeWeeks > 0;
          const weekNumber = index + 1;

          return (
            <div
              key={weekNumber}
              className={`
                relative flex flex-col items-center justify-center
                w-12 h-14 sm:w-14 sm:h-16 rounded-lg
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20'
                    : 'bg-neutral-800 border border-dashed border-neutral-600'
                }
                ${isCurrent ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-neutral-900' : ''}
              `}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {isActive && (
                <MdCheck className="text-white text-lg sm:text-xl mb-0.5" />
              )}
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-white/90' : 'text-neutral-500'
                }`}
              >
                S{weekNumber}
              </span>
            </div>
          );
        })}

      </div>

      <p className="text-xs text-neutral-500 mt-2">Nombre de semaines où vous avez parié ce mois-ci. Pariez chaque semaine pour un mois parfait !</p>

      {/* Summary text */}
      <div className="space-y-2">
        <p className="text-sm text-neutral-300">
          <span className="font-semibold text-white">{activeWeeks}</span>
          {activeWeeks === 1 ? ' semaine active' : ' semaines actives'}
        </p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isPerfect
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                  : 'bg-gradient-to-r from-orange-500 to-amber-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">{Math.round(progress)}%</span>
            <span
              className={`text-xs ${
                isPerfect ? 'text-green-400 font-medium' : 'text-neutral-400'
              }`}
            >
              {getMessage()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LifetimeStreakProps {
  streak: number;
  className?: string;
}

const LifetimeStreak: FC<LifetimeStreakProps> = ({ streak, className = '' }) => {
  const getMessage = () => {
    if (streak === 0) return 'Placez des paris régulièrement pour établir un record !';
    if (streak < 4) return 'Bon début ! Continuez chaque semaine.';
    if (streak < 8) return 'Belle performance !';
    if (streak < 12) return 'Impressionnant !';
    return 'Votre meilleure performance !';
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Big number display */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-bold text-white">
            {streak}
          </span>
          <span className="text-sm text-neutral-400">
            {streak === 1 ? 'semaine consécutive' : 'semaines consécutives'}
          </span>
        </div>

      </div>

      <p className="text-xs text-neutral-500">Votre plus longue série de semaines consécutives avec au moins un pari.</p>

      {/* Full progress bar (record achieved) */}
      <div className="space-y-1">
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: streak > 0 ? '100%' : '0%' }}
          />
        </div>
        <p
          className={`text-xs ${
            streak > 0 ? 'text-purple-400' : 'text-neutral-500'
          }`}
        >
          {getMessage()}
        </p>
      </div>
    </div>
  );
};

export default StreakIndicator;
