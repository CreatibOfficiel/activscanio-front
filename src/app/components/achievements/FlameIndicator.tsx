import { FC } from 'react';

interface FlameIndicatorProps {
  streak: number;
  variant?: 'compact' | 'detailed';
  type?: 'monthly' | 'lifetime';
  className?: string;
}

/**
 * FlameIndicator Component
 *
 * Displays weekly participation streaks with flame emoji
 * - Compact: Just flame + number
 * - Detailed: Flame + number + label + progress description
 */
const FlameIndicator: FC<FlameIndicatorProps> = ({
  streak,
  variant = 'compact',
  type = 'monthly',
  className = '',
}) => {
  // Determine flame icon based on streak length
  const getFlameIcon = () => {
    if (streak === 0) return '🔵'; // No streak
    if (streak <= 2) return '🔥'; // Small flame
    if (streak <= 5) return '🔥🔥'; // Medium flame
    if (streak <= 10) return '🔥🔥🔥'; // Large flame
    return '🔥🔥🔥✨'; // Epic flame
  };

  // Determine flame color based on streak
  const getFlameColor = () => {
    if (streak === 0) return 'text-neutral-500';
    if (streak <= 2) return 'text-orange-400';
    if (streak <= 5) return 'text-orange-500';
    if (streak <= 10) return 'text-red-500';
    return 'text-red-600';
  };

  // Get label based on type
  const getLabel = () => {
    if (type === 'monthly') {
      return streak === 1 ? 'semaine ce mois' : 'semaines ce mois';
    }
    return streak === 1 ? 'semaine consécutive' : 'semaines consécutives';
  };

  // Get motivational message
  const getMotivationalMessage = () => {
    if (streak === 0) return 'Commencez votre série !';
    if (streak === 1) return 'Bon début !';
    if (streak === 2) return 'Continuez comme ça !';
    if (streak === 3) return 'Belle série !';
    if (streak === 5) return 'Impressionnant !';
    if (streak === 10) return 'Incroyable !';
    if (streak >= 15) return 'LÉGENDAIRE !';
    return 'En feu !';
  };

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-800/50 border border-neutral-700 ${className}`}
        title={`${streak} ${getLabel()}`}
      >
        <span className="text-sm">{getFlameIcon()}</span>
        <span className={`text-sm font-semibold ${getFlameColor()}`}>
          {streak}
        </span>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getFlameIcon()}</span>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getFlameColor()}`}>
              {streak}
            </span>
            <span className="text-sm text-neutral-400">{getLabel()}</span>
          </div>
          {streak > 0 && (
            <span className="text-xs text-primary-400 font-medium">
              {getMotivationalMessage()}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar for next milestone */}
      {streak > 0 && streak < 15 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Prochain palier</span>
            <span>
              {streak <= 2
                ? `${3 - streak} semaine${3 - streak > 1 ? 's' : ''} restante${3 - streak > 1 ? 's' : ''}`
                : streak <= 5
                  ? `${6 - streak} semaine${6 - streak > 1 ? 's' : ''} restante${6 - streak > 1 ? 's' : ''}`
                  : streak <= 10
                    ? `${11 - streak} semaine${11 - streak > 1 ? 's' : ''} restante${11 - streak > 1 ? 's' : ''}`
                    : `${15 - streak} semaine${15 - streak > 1 ? 's' : ''} restante${15 - streak > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{
                width: `${
                  streak <= 2
                    ? (streak / 3) * 100
                    : streak <= 5
                      ? ((streak - 2) / 4) * 100
                      : streak <= 10
                        ? ((streak - 5) / 6) * 100
                        : ((streak - 10) / 5) * 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {streak >= 15 && (
        <p className="text-xs text-neutral-400 italic">
          Vous êtes au sommet ! Continuez à participer chaque semaine.
        </p>
      )}
    </div>
  );
};

export default FlameIndicator;
