import { FC } from 'react';
import { Achievement, AchievementRarity } from '@/app/models/Achievement';

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * AchievementCard Component
 *
 * Displays an achievement badge with rarity-based styling
 * - Shows icon, name, description, XP reward, and unlock status
 * - Different visual styles for each rarity (Common, Rare, Epic, Legendary)
 * - Shows progress bar for locked achievements
 */
const AchievementCard: FC<AchievementCardProps> = ({
  achievement,
  onClick,
  variant = 'default',
  className = '',
}) => {
  const {
    icon,
    name,
    description,
    rarity,
    xpReward,
    unlocksTitle,
    isUnlocked,
    progress = 0,
  } = achievement;

  // Get rarity-based colors
  const getRarityColors = () => {
    switch (rarity) {
      case AchievementRarity.LEGENDARY:
        return {
          bg: 'from-purple-900/30 to-pink-900/30',
          border: 'border-purple-500',
          glow: 'shadow-lg shadow-purple-500/30',
          text: 'text-purple-400',
          gradient: 'from-purple-500 to-pink-500',
          iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        };
      case AchievementRarity.EPIC:
        return {
          bg: 'from-orange-900/30 to-red-900/30',
          border: 'border-orange-500',
          glow: 'shadow-lg shadow-orange-500/30',
          text: 'text-orange-400',
          gradient: 'from-orange-500 to-red-500',
          iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
        };
      case AchievementRarity.RARE:
        return {
          bg: 'from-blue-900/30 to-cyan-900/30',
          border: 'border-blue-500',
          glow: 'shadow-lg shadow-blue-500/30',
          text: 'text-blue-400',
          gradient: 'from-blue-500 to-cyan-500',
          iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        };
      case AchievementRarity.COMMON:
      default:
        return {
          bg: 'from-neutral-800/30 to-neutral-900/30',
          border: 'border-neutral-600',
          glow: '',
          text: 'text-neutral-400',
          gradient: 'from-neutral-500 to-neutral-600',
          iconBg: 'bg-gradient-to-br from-neutral-500 to-neutral-600',
        };
    }
  };

  const colors = getRarityColors();

  // Locked/unlocked state
  const isLocked = !isUnlocked;
  const lockedClass = isLocked ? 'opacity-60 grayscale' : '';

  if (variant === 'compact') {
    return (
      <div
        className={`relative flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border} ${colors.glow} ${lockedClass} ${onClick ? 'cursor-pointer hover:scale-105' : ''} transition-all duration-200 ${className}`}
        onClick={onClick}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${colors.iconBg} text-2xl shadow-lg`}
        >
          {isLocked ? '🔒' : icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm ${colors.text} truncate`}>
            {name}
          </h3>
          <p className="text-xs text-neutral-500 truncate">{description}</p>
        </div>

        {/* XP badge */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-primary-400">
            +{xpReward} XP
          </span>
          {isUnlocked && (
            <span className="text-xs text-success-500">✓ Débloqué</span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`relative flex flex-col p-5 rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} ${colors.glow} ${lockedClass} ${onClick ? 'cursor-pointer hover:scale-105 hover:border-opacity-100' : ''} transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {/* Unlocked badge */}
      {isUnlocked && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-success-500/20 border border-success-500">
          <span className="text-xs font-bold text-success-400">✓ Débloqué</span>
        </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div
          className={`flex items-center justify-center w-20 h-20 rounded-full ${colors.iconBg} text-5xl shadow-xl ring-4 ring-neutral-800`}
        >
          {isLocked ? '🔒' : icon}
        </div>
      </div>

      {/* Name and rarity */}
      <div className="text-center mb-2">
        <h3 className={`text-lg font-bold ${colors.text} mb-1`}>{name}</h3>
        <div className="flex items-center justify-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${colors.gradient} text-white`}
          >
            {rarity}
          </span>
          {unlocksTitle && (
            <span className="text-xs text-neutral-500">
              🏆 Titre: &quot;{unlocksTitle}&quot;
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-400 text-center mb-4 min-h-[40px]">
        {description}
      </p>

      {/* XP reward */}
      <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
        <span className="text-sm text-neutral-400">Récompense:</span>
        <span className="text-lg font-bold text-primary-400">+{xpReward} XP</span>
      </div>

      {/* Progress bar for locked achievements */}
      {isLocked && progress !== undefined && (
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Progression</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
            <div
              className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Locked message */}
      {isLocked && (
        <p className="mt-3 text-xs text-neutral-600 text-center italic">
          🔒 Continuez à jouer pour débloquer cet achievement
        </p>
      )}
    </div>
  );
};

export default AchievementCard;
