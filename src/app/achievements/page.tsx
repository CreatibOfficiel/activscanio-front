'use client';

import { FC, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from '../models/Achievement';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import { AchievementGrid } from '../components/achievements';

const AchievementsPage: FC = () => {
  const { getToken } = useAuth();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | 'ALL'
  >('ALL');
  const [selectedRarity, setSelectedRarity] = useState<
    AchievementRarity | 'ALL'
  >('ALL');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    locked: 0,
    progress: 0,
  });

  // Fetch achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const params: Record<string, string | boolean> = {};
        if (selectedCategory !== 'ALL') params.category = selectedCategory;
        if (selectedRarity !== 'ALL') params.rarity = selectedRarity;
        if (showUnlockedOnly) params.unlockedOnly = true;
        if (showLockedOnly) params.lockedOnly = true;

        const data = await AchievementsRepository.getAchievements(
          params,
          token || undefined
        );

        setAchievements(data);

        // Calculate stats
        const totalCount = data.length;
        const unlockedCount = data.filter((a) => a.isUnlocked).length;
        const lockedCount = totalCount - unlockedCount;
        const progressPercent =
          totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

        setStats({
          total: totalCount,
          unlocked: unlockedCount,
          locked: lockedCount,
          progress: progressPercent,
        });
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError('Impossible de charger les achievements');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [selectedCategory, selectedRarity, showUnlockedOnly, showLockedOnly, getToken]);

  return (
    <div className="min-h-screen bg-neutral-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 Achievements
          </h1>
          <p className="text-neutral-400">
            Débloquez des achievements en jouant et gagnez de l&apos;XP !
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div className="text-sm text-neutral-400 mb-1">Total</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-800 border border-success-500/30">
            <div className="text-sm text-neutral-400 mb-1">Débloqués</div>
            <div className="text-3xl font-bold text-success-400">
              {stats.unlocked}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
            <div className="text-sm text-neutral-400 mb-1">Verrouillés</div>
            <div className="text-3xl font-bold text-neutral-400">
              {stats.locked}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-800 border border-primary-500/30">
            <div className="text-sm text-neutral-400 mb-1">Progression</div>
            <div className="text-3xl font-bold text-primary-400">
              {stats.progress.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 rounded-lg bg-neutral-800 border border-neutral-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Category filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value as AchievementCategory | 'ALL'
                  )
                }
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">Toutes les catégories</option>
                <option value={AchievementCategory.PRECISION}>
                  🎯 Précision
                </option>
                <option value={AchievementCategory.REGULARITY}>
                  📅 Régularité
                </option>
                <option value={AchievementCategory.AUDACITY}>
                  🎲 Audace
                </option>
                <option value={AchievementCategory.RANKING}>
                  🏅 Classement
                </option>
              </select>
            </div>

            {/* Rarity filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Rareté
              </label>
              <select
                value={selectedRarity}
                onChange={(e) =>
                  setSelectedRarity(e.target.value as AchievementRarity | 'ALL')
                }
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">Toutes les raretés</option>
                <option value={AchievementRarity.COMMON}>⚪ Commun</option>
                <option value={AchievementRarity.RARE}>🔵 Rare</option>
                <option value={AchievementRarity.EPIC}>🟠 Épique</option>
                <option value={AchievementRarity.LEGENDARY}>
                  🟣 Légendaire
                </option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Statut
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUnlockedOnly(!showUnlockedOnly);
                    if (!showUnlockedOnly) setShowLockedOnly(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    showUnlockedOnly
                      ? 'bg-success-500/20 border-success-500 text-success-400'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  ✓ Débloqués
                </button>
                <button
                  onClick={() => {
                    setShowLockedOnly(!showLockedOnly);
                    if (!showLockedOnly) setShowUnlockedOnly(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    showLockedOnly
                      ? 'bg-neutral-700/50 border-neutral-600 text-neutral-300'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  🔒 Verrouillés
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-500/10 border border-error-500 text-error-400">
            {error}
          </div>
        )}

        {/* Achievement Grid */}
        <AchievementGrid
          achievements={achievements}
          loading={loading}
          emptyMessage="Aucun achievement ne correspond à vos filtres"
        />
      </div>
    </div>
  );
};

export default AchievementsPage;
