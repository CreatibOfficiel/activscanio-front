'use client';

import { FC, useState, useEffect } from 'react';
import { UserStats, Achievement, AchievementCategory, AchievementRarity } from '../../models/Achievement';
import { AchievementsRepository } from '../../repositories/AchievementsRepository';
import AchievementShowcase from './AchievementShowcase';
import { AchievementCard } from '../achievements';
import { Skeleton } from '../ui';

// Category display names
const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  [AchievementCategory.PRECISION]: { label: 'Précision', icon: '🎯' },
  [AchievementCategory.REGULARITY]: { label: 'Régularité', icon: '📅' },
  [AchievementCategory.AUDACITY]: { label: 'Audace', icon: '💥' },
  [AchievementCategory.RANKING]: { label: 'Classement', icon: '🏆' },
};

// Filter types
type FilterStatus = 'all' | 'unlocked' | 'locked';

interface AchievementsTabProps {
  stats: UserStats;
  authToken?: string;
  className?: string;
}

/**
 * AchievementsTab Component
 *
 * Achievements tab displaying:
 * - Global progress bar
 * - Category and status filters
 * - Showcase section (featured achievements)
 * - Complete achievement grid
 */
const AchievementsTab: FC<AchievementsTabProps> = ({
  stats,
  authToken,
  className = '',
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');

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

  // Filter achievements based on selected filters
  const filteredAchievements = achievements.filter((achievement) => {
    // Category filter
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus === 'unlocked' && !achievement.isUnlocked) {
      return false;
    }
    if (selectedStatus === 'locked' && achievement.isUnlocked) {
      return false;
    }

    return true;
  });

  // Separate unlocked and locked for showcase
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);

  // Sort achievements: unlocked first, then by rarity
  const sortedFilteredAchievements = [...filteredAchievements].sort((a, b) => {
    // Unlocked first
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;

    // Then by rarity (Legendary > Epic > Rare > Common)
    const rarityOrder: Record<AchievementRarity, number> = {
      [AchievementRarity.LEGENDARY]: 4,
      [AchievementRarity.EPIC]: 3,
      [AchievementRarity.RARE]: 2,
      [AchievementRarity.COMMON]: 1,
    };
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });

  if (loading) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-achievements"
        aria-labelledby="tab-achievements"
        className={`space-y-6 ${className}`}
      >
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📊</span>
            <span>Progression Globale</span>
          </h3>
          <span className="text-sm font-medium text-primary-400">
            {stats.unlockedAchievements}/{stats.totalAchievements}
          </span>
        </div>

        <div className="relative h-4 bg-neutral-900 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
            style={{ width: `${stats.achievementProgress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow">
              {stats.achievementProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats by rarity */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {([
            { rarity: AchievementRarity.COMMON, label: 'Commun', color: 'text-neutral-400' },
            { rarity: AchievementRarity.RARE, label: 'Rare', color: 'text-blue-400' },
            { rarity: AchievementRarity.EPIC, label: 'Épique', color: 'text-orange-400' },
            { rarity: AchievementRarity.LEGENDARY, label: 'Légendaire', color: 'text-purple-400' },
          ] as const).map(({ rarity, label, color }) => {
            const total = achievements.filter((a) => a.rarity === rarity).length;
            const unlocked = achievements.filter((a) => a.rarity === rarity && a.isUnlocked).length;
            return (
              <div key={rarity} className="text-center">
                <div className={`text-sm font-bold ${color}`}>
                  {unlocked}/{total}
                </div>
                <div className="text-xs text-neutral-500">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category filters */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary-500 text-neutral-900'
              : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
          }`}
        >
          Tous
        </button>
        {Object.entries(CATEGORY_LABELS).map(([cat, { label, icon }]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as AchievementCategory)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              selectedCategory === cat
                ? 'bg-primary-500 text-neutral-900'
                : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-8 bg-neutral-700 mx-2" />

        {/* Status filters */}
        {([
          { status: 'all' as FilterStatus, label: 'Tous' },
          { status: 'unlocked' as FilterStatus, label: 'Débloqués' },
          { status: 'locked' as FilterStatus, label: 'Verrouillés' },
        ]).map(({ status, label }) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-neutral-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Showcase (only when showing all or unlocked) */}
      {selectedStatus !== 'locked' && selectedCategory === 'all' && unlockedAchievements.length > 0 && (
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>✨</span>
            <span>Succès à l&apos;Honneur</span>
          </h3>
          <AchievementShowcase achievements={unlockedAchievements} />
        </div>
      )}

      {/* Achievement Grid */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🏆</span>
          <span>
            {selectedCategory === 'all' ? 'Tous les Succès' : CATEGORY_LABELS[selectedCategory].label}
          </span>
          <span className="text-sm font-normal text-neutral-500">
            ({sortedFilteredAchievements.length})
          </span>
        </h3>

        {sortedFilteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedFilteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                variant="compact"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Aucun succès trouvé avec ces filtres</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsTab;
