import { FC } from 'react';
import { Achievement } from '@/app/models/Achievement';
import AchievementCard from './AchievementCard';

interface AchievementGridProps {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  variant?: 'default' | 'compact';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * AchievementGrid Component
 *
 * Displays a responsive grid of achievement cards
 * - Supports both default and compact card variants
 * - Shows loading skeletons
 * - Displays empty state
 */
const AchievementGrid: FC<AchievementGridProps> = ({
  achievements,
  onAchievementClick,
  variant = 'default',
  loading = false,
  emptyMessage = 'Aucun achievement trouvé',
  className = '',
}) => {
  // Render loading skeletons
  if (loading) {
    return (
      <div
        className={`grid gap-4 ${
          variant === 'compact'
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        } ${className}`}
      >
        {Array.from({ length: variant === 'compact' ? 5 : 8 }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-xl bg-neutral-800/50 border border-neutral-700 ${
              variant === 'compact' ? 'h-20' : 'h-80'
            }`}
          />
        ))}
      </div>
    );
  }

  // Render empty state
  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-lg text-neutral-400">{emptyMessage}</p>
        <p className="text-sm text-neutral-600 mt-2">
          Continuez à jouer pour débloquer des achievements !
        </p>
      </div>
    );
  }

  // Render achievement grid
  return (
    <div
      className={`grid gap-4 ${
        variant === 'compact'
          ? 'grid-cols-1'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      } ${className}`}
    >
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          onClick={
            onAchievementClick
              ? () => onAchievementClick(achievement)
              : undefined
          }
          variant={variant}
        />
      ))}
    </div>
  );
};

export default AchievementGrid;
