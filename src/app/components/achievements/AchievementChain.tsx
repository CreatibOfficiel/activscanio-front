'use client';

import React from 'react';
import { Achievement } from '@/app/models/Achievement';
import { Check, Lock, TrendingUp } from 'lucide-react';

/**
 * Props for AchievementChain component
 */
interface AchievementChainProps {
  /** Technical name of the chain (e.g., "perfect_podium_chain") */
  chainName: string;
  /** Display title of the chain (e.g., "🎯 Chaîne Précision") */
  chainTitle: string;
  /** Array of achievements in this chain (will be sorted by tierLevel) */
  achievements: Achievement[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Rarity-based background colors for unlocked achievements
 */
const rarityColors = {
  COMMON: 'bg-gray-500',
  RARE: 'bg-blue-500',
  EPIC: 'bg-purple-500',
  LEGENDARY: 'bg-yellow-500',
};

const rarityGlowColors = {
  COMMON: 'shadow-gray-500/50',
  RARE: 'shadow-blue-500/50',
  EPIC: 'shadow-purple-500/50',
  LEGENDARY: 'shadow-yellow-500/50',
};

/**
 * AchievementChain Component
 *
 * Displays a progressive achievement chain showing tiers 1-4 with visual connections.
 * Features:
 * - Automatic sorting by tier level
 * - Visual connection lines between tiers
 * - Status indicators (unlocked/in-progress/locked)
 * - Prerequisite checking
 * - Progress bars for in-progress achievements
 * - Rarity-based styling with glow effects
 *
 * @example
 * ```tsx
 * <AchievementChain
 *   chainName="perfect_podium_chain"
 *   chainTitle="🎯 Chaîne Précision - Podiums Parfaits"
 *   achievements={precisionAchievements}
 * />
 * ```
 */
export default function AchievementChain({
  chainTitle,
  achievements,
  className = '',
}: AchievementChainProps) {
  // Sort achievements by tier level
  const sortedAchievements = [...achievements].sort(
    (a, b) => (a.tierLevel || 0) - (b.tierLevel || 0)
  );

  return (
    <div className={`p-6 rounded-xl bg-neutral-800 border border-neutral-700 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary-400" />
        <h3 className="text-xl font-bold text-white">{chainTitle}</h3>
      </div>

      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute top-12 left-0 right-0 h-0.5 bg-neutral-700 hidden md:block" />

        {/* Achievement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {sortedAchievements.map((achievement, index) => {
            const isUnlocked = achievement.isUnlocked || false;
            const progress = achievement.progress || 0;
            const isInProgress = !isUnlocked && progress > 0;
            const isLocked = !isUnlocked && progress === 0;

            // Check if prerequisite is met
            const hasPrerequisite = achievement.prerequisiteAchievementKey;
            const prerequisiteUnlocked = hasPrerequisite
              ? sortedAchievements.find(
                  (a) => a.key === achievement.prerequisiteAchievementKey
                )?.isUnlocked
              : true;

            return (
              <div key={achievement.id} className="relative">
                {/* Achievement Card */}
                <div
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-300
                    ${
                      isUnlocked
                        ? `${rarityColors[achievement.rarity]} border-transparent shadow-lg ${rarityGlowColors[achievement.rarity]}`
                        : isInProgress
                        ? 'bg-neutral-900 border-primary-500/50'
                        : 'bg-neutral-900/50 border-neutral-700 opacity-60'
                    }
                  `}
                >
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`
                        text-3xl transition-all
                        ${isUnlocked ? 'animate-bounce-once' : ''}
                        ${isLocked ? 'grayscale opacity-50' : ''}
                      `}
                    >
                      {achievement.icon}
                    </div>
                    <div
                      className={`
                        p-1.5 rounded-full
                        ${
                          isUnlocked
                            ? 'bg-green-500'
                            : isInProgress
                            ? 'bg-yellow-500'
                            : 'bg-neutral-700'
                        }
                      `}
                    >
                      {isUnlocked ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : isLocked ? (
                        <Lock className="w-3 h-3 text-neutral-400" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <div className="space-y-2">
                    {/* Tier Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-neutral-700 text-white">
                        Tier {achievement.tierLevel || 1}
                      </span>
                      <span
                        className={`
                          px-2 py-0.5 text-xs font-bold rounded uppercase
                          ${
                            achievement.rarity === 'LEGENDARY'
                              ? 'bg-yellow-500 text-black'
                              : achievement.rarity === 'EPIC'
                              ? 'bg-purple-500 text-white'
                              : achievement.rarity === 'RARE'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'
                          }
                        `}
                      >
                        {achievement.rarity}
                      </span>
                    </div>

                    {/* Name */}
                    <h4
                      className={`
                        font-bold text-sm
                        ${isUnlocked ? 'text-white' : 'text-neutral-400'}
                      `}
                    >
                      {achievement.name}
                    </h4>

                    {/* Description */}
                    <p
                      className={`
                        text-xs
                        ${isUnlocked ? 'text-neutral-300' : 'text-neutral-500'}
                      `}
                    >
                      {achievement.description}
                    </p>

                    {/* XP Reward */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                      <span className="text-xs text-neutral-400">XP</span>
                      <span className="text-sm font-bold text-primary-400">
                        +{achievement.xpReward}
                      </span>
                    </div>

                    {/* Progress Bar (if in progress) */}
                    {isInProgress && (
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-neutral-400 mb-1">
                          <span>Progression</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Locked Message (if locked due to prerequisite) */}
                    {isLocked && hasPrerequisite && !prerequisiteUnlocked && (
                      <div className="pt-2">
                        <div className="flex items-center gap-1 text-xs text-yellow-500">
                          <Lock className="w-3 h-3" />
                          <span>Débloque le tier précédent</span>
                        </div>
                      </div>
                    )}

                    {/* Unlocked Date */}
                    {isUnlocked && achievement.unlockedAt && (
                      <div className="pt-2 text-xs text-green-400">
                        Débloqué le{' '}
                        {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Arrow (not for last item) */}
                {index < sortedAchievements.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-2 z-10">
                    <div className="w-4 h-4 bg-neutral-800 rotate-45 border-r-2 border-t-2 border-neutral-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
