import { FC } from 'react';

interface XPLevelDisplayProps {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgressPercent: number;
  variant?: 'compact' | 'detailed';
  className?: string;
  showTitle?: boolean;
  currentTitle?: string | null;
}

/**
 * XPLevelDisplay Component
 *
 * Displays user's level and XP progression
 * - Compact: Level badge + minimal progress bar
 * - Detailed: Level badge + XP numbers + progress bar + title
 */
const XPLevelDisplay: FC<XPLevelDisplayProps> = ({
  level,
  currentXP,
  xpForNextLevel,
  xpProgressPercent,
  variant = 'detailed',
  className = '',
  showTitle = true,
  currentTitle,
}) => {
  // Calculate XP for current level (approximate based on formula)
  const getXPForCurrentLevel = (lvl: number): number => {
    if (lvl <= 1) return 0;
    return 100 * (lvl - 1) * lvl / 2;
  };

  const xpForCurrentLevel = getXPForCurrentLevel(level);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;

  // Get level color based on level ranges
  const getLevelColor = () => {
    if (level >= 50) return 'from-purple-500 to-pink-500'; // Legendary
    if (level >= 30) return 'from-orange-500 to-red-500'; // Epic
    if (level >= 15) return 'from-blue-500 to-cyan-500'; // Rare
    if (level >= 5) return 'from-green-500 to-emerald-500'; // Uncommon
    return 'from-neutral-400 to-neutral-500'; // Common
  };

  // Get level title
  const getLevelTitle = () => {
    if (level >= 50) return 'Légende';
    if (level >= 30) return 'Maître';
    if (level >= 15) return 'Expert';
    if (level >= 5) return 'Vétéran';
    return 'Débutant';
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Level badge */}
        <div
          className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getLevelColor()} shadow-lg`}
        >
          <span className="text-sm font-bold text-white">{level}</span>
        </div>

        {/* Compact progress bar */}
        <div className="flex-1 min-w-[80px] max-w-[150px]">
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
            <div
              className={`h-full bg-gradient-to-r ${getLevelColor()} transition-all duration-500`}
              style={{ width: `${Math.min(100, xpProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Level and Title */}
      <div className="flex items-center gap-3">
        <div
          className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor()} shadow-lg ring-4 ring-neutral-800`}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-white/80">NIV.</span>
            <span className="text-2xl font-bold text-white">{level}</span>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <span className={`text-lg font-bold bg-gradient-to-r ${getLevelColor()} bg-clip-text text-transparent`}>
            {getLevelTitle()}
          </span>
          {showTitle && currentTitle && (
            <span className="text-sm text-primary-400 italic">
              « {currentTitle} »
            </span>
          )}
          {showTitle && !currentTitle && (
            <span className="text-sm text-neutral-500 italic">
              Aucun titre équipé
            </span>
          )}
        </div>
      </div>

      {/* XP Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-neutral-300">
            Expérience
          </span>
          <div className="text-sm text-neutral-400">
            <span className="font-semibold text-primary-400">
              {xpInCurrentLevel.toLocaleString()}
            </span>
            <span className="mx-1">/</span>
            <span>{xpNeededForLevel.toLocaleString()}</span>
            <span className="ml-1 text-xs">XP</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${getLevelColor()} transition-all duration-500 shadow-lg`}
            style={{ width: `${Math.min(100, xpProgressPercent)}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Next level info */}
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Niveau {level}</span>
          <span>
            {xpProgressPercent < 100
              ? `${(100 - xpProgressPercent).toFixed(0)}% jusqu'au niveau ${level + 1}`
              : `Niveau ${level + 1} atteint !`}
          </span>
        </div>
      </div>

      {/* Total XP */}
      <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
        <span className="text-xs text-neutral-500">XP Total</span>
        <span className="text-sm font-semibold text-neutral-300">
          {currentXP.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
};

export default XPLevelDisplay;
