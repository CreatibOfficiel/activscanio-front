'use client';

import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { MdArrowForward, MdEmojiEvents } from 'react-icons/md';
import { UserStats, Achievement, AchievementCategory, AchievementRarity } from '../../models/Achievement';
import { AchievementsRepository } from '../../repositories/AchievementsRepository';
import AchievementShowcase from './AchievementShowcase';
import { AchievementCard } from '../achievements';
import { Skeleton } from '../ui';

// Category display names
const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string; color: string }> = {
  [AchievementCategory.PRECISION]: { label: 'Précision', icon: '🎯', color: 'text-emerald-400' },
  [AchievementCategory.REGULARITY]: { label: 'Régularité', icon: '📅', color: 'text-blue-400' },
  [AchievementCategory.AUDACITY]: { label: 'Audace', icon: '💥', color: 'text-orange-400' },
  [AchievementCategory.RANKING]: { label: 'Classement', icon: '🏆', color: 'text-purple-400' },
};

interface AchievementsTabProps {
  stats: UserStats;
  authToken?: string;
  className?: string;
}

/**
 * AchievementsTab Component (Simplified)
 *
 * Profile tab displaying achievement summary:
 * - Global progress bar with rarity breakdown
 * - Category progress overview
 * - Showcase of recent/rare achievements
 * - Link to full achievements page
 */
const AchievementsTab: FC<AchievementsTabProps> = ({
  stats,
  authToken,
  className = '',
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all achievements with user context
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await AchievementsRepository.getAchievements({}, authToken);
        setAchievements(data);
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError('Impossible de charger les succès');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [authToken]);

  // Get unlocked achievements for showcase
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);

  // Get recent achievements (last 6 unlocked, sorted by rarity)
  const recentAchievements = [...unlockedAchievements]
    .sort((a, b) => {
      const rarityOrder: Record<AchievementRarity, number> = {
        [AchievementRarity.LEGENDARY]: 4,
        [AchievementRarity.EPIC]: 3,
        [AchievementRarity.RARE]: 2,
        [AchievementRarity.COMMON]: 1,
      };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    })
    .slice(0, 6);

  // Calculate category stats
  const categoryStats = Object.values(AchievementCategory).map((category) => {
    const categoryAchievements = achievements.filter((a) => a.category === category);
    const unlocked = categoryAchievements.filter((a) => a.isUnlocked).length;
    const total = categoryAchievements.length;
    const progress = total > 0 ? (unlocked / total) * 100 : 0;
    return { category, unlocked, total, progress };
  });

  if (loading) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-achievements"
        aria-labelledby="tab-achievements"
        className={`space-y-6 ${className}`}
      >
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-achievements"
        aria-labelledby="tab-achievements"
        className={`p-6 rounded-xl bg-error-500/10 border border-error-500 text-error-400 ${className}`}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-achievements"
      aria-labelledby="tab-achievements"
      className={`space-y-6 ${className}`}
    >
      {/* Global Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl bg-neutral-800 border border-neutral-700"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📊</span>
            <span>Progression globale</span>
          </h3>
          <span className="text-sm font-medium text-primary-400">
            {stats.unlockedAchievements}/{stats.totalAchievements}
          </span>
        </div>

        <div className="relative h-4 bg-neutral-900 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.achievementProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow">
              {(stats.achievementProgress ?? 0).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats by rarity */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { rarity: AchievementRarity.COMMON, label: 'Commun', color: 'text-neutral-400', bg: 'bg-neutral-700' },
            { rarity: AchievementRarity.RARE, label: 'Rare', color: 'text-blue-400', bg: 'bg-blue-500/20' },
            { rarity: AchievementRarity.EPIC, label: 'Épique', color: 'text-orange-400', bg: 'bg-orange-500/20' },
            { rarity: AchievementRarity.LEGENDARY, label: 'Légendaire', color: 'text-purple-400', bg: 'bg-purple-500/20' },
          ] as const).map(({ rarity, label, color, bg }) => {
            const total = achievements.filter((a) => a.rarity === rarity).length;
            const unlocked = achievements.filter((a) => a.rarity === rarity && a.isUnlocked).length;
            return (
              <div key={rarity} className={`text-center p-2 rounded-lg ${bg}`}>
                <div className={`text-sm font-bold ${color}`}>
                  {unlocked}/{total}
                </div>
                <div className="text-xs text-neutral-500">{label}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Category Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-xl bg-neutral-800 border border-neutral-700"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📈</span>
          <span>Par catégorie</span>
        </h3>

        <div className="space-y-3">
          {categoryStats.map(({ category, unlocked, total, progress }) => {
            const { label, icon, color } = CATEGORY_LABELS[category];
            return (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xl w-8">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${color}`}>{label}</span>
                    <span className="text-xs text-neutral-500">{unlocked}/{total}</span>
                  </div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-full ${
                        category === AchievementCategory.PRECISION ? 'bg-emerald-500' :
                        category === AchievementCategory.REGULARITY ? 'bg-blue-500' :
                        category === AchievementCategory.AUDACITY ? 'bg-orange-500' :
                        'bg-purple-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Showcase - Best Achievements */}
      {unlockedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-neutral-800 border border-neutral-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>✨</span>
            <span>Succès à l&apos;Honneur</span>
          </h3>
          <AchievementShowcase achievements={unlockedAchievements} />
        </motion.div>
      )}

      {/* Recent/Best Achievements Preview */}
      {recentAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl bg-neutral-800 border border-neutral-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MdEmojiEvents className="text-gold-500" />
              <span>Meilleurs succès</span>
            </h3>
            <span className="text-sm text-neutral-500">
              {unlockedAchievements.length} débloqués
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                variant="compact"
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA - View All Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link
          href="/achievements"
          className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/30 hover:border-primary-500/50 hover:from-primary-500/20 hover:to-primary-600/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">
                Explorer tous les succès
              </h3>
              <p className="text-sm text-neutral-400">
                {achievements.length} succès • {achievements.length - unlockedAchievements.length} à débloquer
              </p>
            </div>
          </div>
          <MdArrowForward className="w-6 h-6 text-primary-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
};

export default AchievementsTab;
