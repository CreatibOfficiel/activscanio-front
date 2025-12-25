'use client';

import React, { useEffect, useState } from 'react';
import { StatsRepository, LevelReward, UserLevelRewards } from '@/app/repositories/StatsRepository';
import { Trophy, Star, Zap, Crown, Lock, Check } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';

interface LevelRewardsPanelProps {
  userId: string;
  currentLevel: number;
  authToken?: string;
  className?: string;
}

const rewardTypeIcons = {
  TITLE: Crown,
  BADGE: Star,
  AVATAR: Trophy,
  XP_MULTIPLIER: Zap,
};

const rewardTypeColors = {
  TITLE: 'text-yellow-500 bg-yellow-500/10',
  BADGE: 'text-blue-500 bg-blue-500/10',
  AVATAR: 'text-purple-500 bg-purple-500/10',
  XP_MULTIPLIER: 'text-green-500 bg-green-500/10',
};

const LevelRewardsPanel = React.memo(function LevelRewardsPanel({
  userId,
  currentLevel,
  authToken,
  className = '',
}: LevelRewardsPanelProps) {
  const [data, setData] = useState<UserLevelRewards | null>(null);
  const [allRewards, setAllRewards] = useState<LevelReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRewards, rewards] = await Promise.all([
          StatsRepository.getUserLevelRewards(userId, authToken),
          StatsRepository.getAllLevelRewards(authToken),
        ]);

        setData(userRewards);
        setAllRewards(rewards);
      } catch (err) {
        console.error('Error fetching level rewards:', err);
        setError('Impossible de charger les récompenses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authToken]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <Skeleton variant="text" width="40%" height="24px" className="mb-2" />
            <Skeleton variant="text" width="60%" height="14px" />
          </div>
        </div>
        <div className="mb-6 p-4 rounded-lg border border-neutral-700">
          <Skeleton variant="text" width="30%" height="14px" className="mb-2" />
          <Skeleton variant="text" width="50%" height="20px" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative flex items-start gap-4">
              <Skeleton variant="circular" width="48px" height="48px" />
              <div className="flex-1 p-4 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton variant="text" width="80px" height="20px" />
                  <Skeleton variant="text" width="100px" height="20px" />
                </div>
                <Skeleton variant="text" width="90%" height="14px" className="mb-2" />
                <Skeleton variant="text" width="40%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-error-500/10 border border-error-500 rounded-lg ${className}`}>
        <p className="text-error-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-8 text-center text-neutral-400 ${className}`}>
        Aucune donnée disponible
      </div>
    );
  }

  const unlockedLevels = new Set(data.unlockedRewards.map((r) => r.level));

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Paliers & Récompenses</h3>
          <p className="text-sm text-neutral-400 mt-1">
            Niveau actuel: <span className="font-bold text-primary-400">{currentLevel}</span>
            {' · '}
            Multiplicateur XP:{' '}
            <span className="font-bold text-green-400">{data.activeMultiplier}x</span>
          </p>
        </div>
      </div>

      {/* Next Reward Preview */}
      {data.nextReward && (
        <div className="mb-6 p-4 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              {React.createElement(rewardTypeIcons[data.nextReward.rewardType], {
                className: 'w-6 h-6 text-primary-400',
              })}
            </div>
            <div className="flex-1">
              <div className="text-sm text-neutral-400">Prochaine récompense</div>
              <div className="font-bold text-white">
                Niveau {data.nextReward.level} · {data.nextReward.description}
              </div>
            </div>
            <div className="text-sm text-neutral-400">
              {data.nextReward.level - currentLevel} niveau{data.nextReward.level - currentLevel > 1 ? 'x' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-700" />

        {/* Rewards */}
        <div className="space-y-4">
          {allRewards.map((reward) => {
            const isUnlocked = unlockedLevels.has(reward.level);
            const isNext = data.nextReward?.level === reward.level;
            const Icon = rewardTypeIcons[reward.rewardType];

            return (
              <div key={reward.id} className="relative flex items-start gap-4">
                {/* Timeline Dot */}
                <div
                  className={`
                    relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      isUnlocked
                        ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50'
                        : isNext
                        ? 'bg-primary-500 border-primary-400 shadow-lg shadow-primary-500/50 animate-pulse'
                        : 'bg-neutral-800 border-neutral-600'
                    }
                  `}
                >
                  {isUnlocked ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : isNext ? (
                    <Icon className="w-6 h-6 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-neutral-500" />
                  )}
                </div>

                {/* Reward Card */}
                <div
                  className={`
                    flex-1 p-4 rounded-lg border transition-all
                    ${
                      isUnlocked
                        ? 'bg-neutral-800 border-green-500/30'
                        : isNext
                        ? 'bg-neutral-800 border-primary-500/50'
                        : 'bg-neutral-900/50 border-neutral-700 opacity-60'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Level Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`
                            px-2 py-1 text-xs font-bold rounded
                            ${isUnlocked ? 'bg-green-500 text-white' : 'bg-neutral-700 text-neutral-400'}
                          `}
                        >
                          Niveau {reward.level}
                        </span>
                        <span
                          className={`
                            px-2 py-1 text-xs font-bold rounded
                            ${rewardTypeColors[reward.rewardType]}
                          `}
                        >
                          {reward.rewardType.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        className={`
                          text-sm mb-2
                          ${isUnlocked ? 'text-white' : 'text-neutral-400'}
                        `}
                      >
                        {reward.description}
                      </p>

                      {/* Reward Details */}
                      <div className="flex items-center gap-2 text-xs">
                        {reward.rewardType === 'TITLE' && reward.rewardData.title && (
                          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 font-semibold">
                            &quot;{reward.rewardData.title}&quot;
                          </span>
                        )}
                        {reward.rewardType === 'BADGE' && reward.rewardData.badgeIcon && (
                          <span className="text-2xl">{reward.rewardData.badgeIcon}</span>
                        )}
                        {reward.rewardType === 'XP_MULTIPLIER' && reward.rewardData.multiplier && (
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-bold">
                            {reward.rewardData.multiplier}x XP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${rewardTypeColors[reward.rewardType]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {data.unlockedRewards.length}
            </div>
            <div className="text-xs text-neutral-400">Débloquées</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-400">
              {allRewards.length - data.unlockedRewards.length}
            </div>
            <div className="text-xs text-neutral-400">Restantes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-400">
              {((data.unlockedRewards.length / allRewards.length) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-neutral-400">Progression</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LevelRewardsPanel;
