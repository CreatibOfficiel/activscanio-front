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
import AchievementChain from '../components/achievements/AchievementChain';
import { LayoutGrid, GitBranch } from 'lucide-react';

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

  // View toggle
  const [view, setView] = useState<'grid' | 'chains'>('grid');

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

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-center gap-2 p-2 rounded-lg bg-neutral-800 border border-neutral-700 w-fit mx-auto">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              view === 'grid'
                ? 'bg-primary-500 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm font-medium">Grille</span>
          </button>
          <button
            onClick={() => setView('chains')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              view === 'chains'
                ? 'bg-primary-500 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span className="text-sm font-medium">Chaînes</span>
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-500/10 border border-error-500 text-error-400">
            {error}
          </div>
        )}

        {/* Grid View */}
        {view === 'grid' && (
          <AchievementGrid
            achievements={achievements}
            loading={loading}
            emptyMessage="Aucun achievement ne correspond à vos filtres"
          />
        )}

        {/* Chains View */}
        {view === 'chains' && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-neutral-400 text-lg">
                  Aucun achievement ne correspond à vos filtres
                </p>
              </div>
            ) : (
              <>
                {/* Group achievements by chain */}
                {(() => {
                  const chainGroups = new Map<string, Achievement[]>();
                  const standalone: Achievement[] = [];

                  achievements.forEach((achievement) => {
                    if (achievement.chainName) {
                      if (!chainGroups.has(achievement.chainName)) {
                        chainGroups.set(achievement.chainName, []);
                      }
                      chainGroups.get(achievement.chainName)!.push(achievement);
                    } else {
                      standalone.push(achievement);
                    }
                  });

                  // Define chain titles
                  const chainTitles: Record<string, string> = {
                    perfect_podium_chain: '🎯 Chaîne Précision - Podiums Parfaits',
                    participation_chain: '📅 Chaîne Régularité - Participation',
                    points_monthly_chain: '🎲 Chaîne Audace - Points Mensuels',
                    win_streak_chain: '🏅 Chaîne Classement - Séries de Victoires',
                  };

                  return (
                    <>
                      {/* Render chains */}
                      {Array.from(chainGroups.entries()).map(([chainName, chainAchievements]) => (
                        <AchievementChain
                          key={chainName}
                          chainName={chainName}
                          chainTitle={chainTitles[chainName] || chainName}
                          achievements={chainAchievements}
                        />
                      ))}

                      {/* Render standalone achievements */}
                      {standalone.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4">
                            🌟 Achievements Indépendants
                          </h3>
                          <AchievementGrid
                            achievements={standalone}
                            loading={false}
                            emptyMessage=""
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;
