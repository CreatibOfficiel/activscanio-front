'use client';

import { FC } from 'react';
import { Achievement, AchievementRarity } from '../../models/Achievement';

interface AchievementShowcaseProps {
  achievements: Achievement[];
  className?: string;
}

// Rarity colors for styling
const getRarityColors = (rarity: AchievementRarity) => {
  switch (rarity) {
    case AchievementRarity.LEGENDARY:
      return {
        bg: 'from-purple-900/40 to-pink-900/40',
        border: 'border-purple-500',
        glow: 'shadow-lg shadow-purple-500/40',
        text: 'text-purple-400',
        gradient: 'from-purple-500 to-pink-500',
        iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        label: 'Légendaire',
      };
    case AchievementRarity.EPIC:
      return {
        bg: 'from-orange-900/40 to-red-900/40',
        border: 'border-orange-500',
        glow: 'shadow-lg shadow-orange-500/40',
        text: 'text-orange-400',
        gradient: 'from-orange-500 to-red-500',
        iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
        label: 'Épique',
      };
    case AchievementRarity.RARE:
      return {
        bg: 'from-blue-900/40 to-cyan-900/40',
        border: 'border-blue-500',
        glow: 'shadow-lg shadow-blue-500/40',
        text: 'text-blue-400',
        gradient: 'from-blue-500 to-cyan-500',
        iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        label: 'Rare',
      };
    case AchievementRarity.COMMON:
    default:
      return {
        bg: 'from-neutral-800/40 to-neutral-900/40',
        border: 'border-neutral-600',
        glow: '',
        text: 'text-neutral-400',
        gradient: 'from-neutral-500 to-neutral-600',
        iconBg: 'bg-gradient-to-br from-neutral-500 to-neutral-600',
        label: 'Commun',
      };
  }
};

// Rarity order for sorting (highest first)
const rarityOrder: Record<AchievementRarity, number> = {
  [AchievementRarity.LEGENDARY]: 4,
  [AchievementRarity.EPIC]: 3,
  [AchievementRarity.RARE]: 2,
  [AchievementRarity.COMMON]: 1,
};

/**
 * AchievementShowcase Component
 *
 * Displays featured achievements in a larger, more prominent format
 * - Shows 3-5 highest rarity/most recent achievements
 * - Full description and XP reward visible
 * - Title unlock info if applicable
 */
const AchievementShowcase: FC<AchievementShowcaseProps> = ({
  achievements,
  className = '',
}) => {
  // Sort by rarity (highest first), then by unlock date (most recent first)
  const sortedAchievements = [...achievements]
    .filter((a) => a.isUnlocked)
    .sort((a, b) => {
      const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      // Sort by unlock date if same rarity
      const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  if (sortedAchievements.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-neutral-400">Aucun succès à mettre en avant</p>
        <p className="text-sm text-neutral-500 mt-1">
          Débloque des succès rares pour les voir ici !
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {sortedAchievements.map((achievement) => {
        const colors = getRarityColors(achievement.rarity);

        return (
          <div
            key={achievement.id}
            className={`
              relative flex items-center gap-4 p-4 rounded-xl
              bg-gradient-to-r ${colors.bg}
              border-2 ${colors.border} ${colors.glow}
              transition-all duration-200 hover:scale-[1.02]
            `}
          >
            {/* Icon */}
            <div
              className={`
                flex-shrink-0 flex items-center justify-center
                w-16 h-16 rounded-full ${colors.iconBg}
                text-3xl shadow-xl ring-2 ring-neutral-800
              `}
            >
              {achievement.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className={`font-bold ${colors.text}`}>
                  {achievement.name}
                </h4>
                <span
                  className={`
                    text-[10px] font-bold px-2 py-0.5 rounded-full
                    bg-gradient-to-r ${colors.gradient} text-white
                  `}
                >
                  {colors.label}
                </span>
              </div>

              <p className="text-sm text-neutral-400 line-clamp-2">
                {achievement.description}
              </p>

              {/* Title unlock */}
              {achievement.unlocksTitle && (
                <p className="text-xs text-primary-400 mt-1 italic">
                  Titre débloqué : « {achievement.unlocksTitle} »
                </p>
              )}
            </div>

            {/* XP Reward */}
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-primary-400">
                +{achievement.xpReward}
              </div>
              <div className="text-xs text-neutral-500">XP</div>
            </div>

            {/* Checkmark */}
            <div className="absolute top-2 right-2">
              <span className="text-success-500 text-sm">✓</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementShowcase;
