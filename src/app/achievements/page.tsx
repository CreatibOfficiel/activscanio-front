'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'motion/react';
import * as Tabs from '@radix-ui/react-tabs';
import { MdPerson } from 'react-icons/md';
import { LayoutGrid, GitBranch } from 'lucide-react';
import { PageHeader } from '../components/ui';
import {
  Achievement,
  AchievementCategory,
  AchievementDomain,
  AchievementRarity,
} from '../models/Achievement';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import { AchievementCard, AchievementGrid, CollapsibleCategorySection } from '../components/achievements';
import AchievementChain from '../components/achievements/AchievementChain';

// Category metadata for display
const categoryMeta: Record<AchievementCategory, { name: string; icon: string; color: string }> = {
  [AchievementCategory.PRECISION]: { name: 'Précision', icon: '🎯', color: 'text-emerald-400' },
  [AchievementCategory.REGULARITY]: { name: 'Régularité', icon: '📅', color: 'text-blue-400' },
  [AchievementCategory.AUDACITY]: { name: 'Audace', icon: '🎲', color: 'text-orange-400' },
  [AchievementCategory.RANKING]: { name: 'Classement', icon: '🏅', color: 'text-purple-400' },
};

// Rarity metadata
const rarityMeta: Record<AchievementRarity, { label: string; color: string; bg: string }> = {
  [AchievementRarity.COMMON]: { label: 'Commun', color: 'text-neutral-400', bg: 'bg-neutral-700' },
  [AchievementRarity.RARE]: { label: 'Rare', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  [AchievementRarity.EPIC]: { label: 'Épique', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  [AchievementRarity.LEGENDARY]: { label: 'Légendaire', color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

// Filter types
type FilterStatus = 'all' | 'unlocked' | 'locked';
type FilterDomain = AchievementDomain | 'all';
type FilterCategory = AchievementCategory | 'all';
type FilterRarity = AchievementRarity | 'all';

const AchievementsPage: FC = () => {
  const { getToken } = useAuth();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters using Radix Tabs state
  const [selectedDomain, setSelectedDomain] = useState<FilterDomain>('all');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<FilterRarity>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');

  // View toggle
  const [view, setView] = useState<'grid' | 'chains'>('grid');

  // Fetch all achievements once
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        const data = await AchievementsRepository.getAchievements({}, token || undefined);
        setAchievements(data);
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError('Impossible de charger les achievements');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [getToken]);

  // Filter achievements client-side
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedDomain !== 'all' && (a.domain || AchievementDomain.BETTING) !== selectedDomain) return false;
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (selectedRarity !== 'all' && a.rarity !== selectedRarity) return false;
      if (selectedStatus === 'unlocked' && !a.isUnlocked) return false;
      if (selectedStatus === 'locked' && a.isUnlocked) return false;
      return true;
    });
  }, [achievements, selectedDomain, selectedCategory, selectedRarity, selectedStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.isUnlocked).length;
    return {
      total,
      unlocked,
      locked: total - unlocked,
      progress: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }, [achievements]);

  // Stats by rarity
  const rarityStats = useMemo(() => {
    return Object.values(AchievementRarity).map((rarity) => {
      const total = achievements.filter((a) => a.rarity === rarity).length;
      const unlocked = achievements.filter((a) => a.rarity === rarity && a.isUnlocked).length;
      return { rarity, total, unlocked };
    });
  }, [achievements]);

  // Group achievements by category for grid view
  const groupedByCategory = useMemo(() => {
    const groups: Record<AchievementCategory, Achievement[]> = {
      [AchievementCategory.PRECISION]: [],
      [AchievementCategory.REGULARITY]: [],
      [AchievementCategory.AUDACITY]: [],
      [AchievementCategory.RANKING]: [],
    };

    filteredAchievements.forEach((a) => {
      if (groups[a.category]) {
        groups[a.category].push(a);
      }
    });

    return groups;
  }, [filteredAchievements]);

  // Order of categories for display
  const categoryOrder: AchievementCategory[] = [
    AchievementCategory.PRECISION,
    AchievementCategory.REGULARITY,
    AchievementCategory.AUDACITY,
    AchievementCategory.RANKING,
  ];

  return (
    <div className="min-h-screen bg-neutral-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          variant="detail"
          title="🏆 Tous les Succès"
          subtitle="Explorez et suivez votre progression sur tous les achievements"
          backHref="/profile?tab=achievements"
          backLabel="Retour au profil"
          rightAction={
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all"
            >
              <MdPerson className="w-5 h-5" />
              <span className="text-sm font-medium">Mon Profil</span>
            </Link>
          }
        />

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-xl bg-neutral-800 border border-neutral-700"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Main progress */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Progression globale</h3>
                <span className="text-sm font-medium text-primary-400">
                  {stats.unlocked}/{stats.total} ({stats.progress.toFixed(0)}%)
                </span>
              </div>
              <div className="relative h-3 bg-neutral-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400"
                />
              </div>
            </div>

            {/* Rarity breakdown */}
            <div className="flex gap-2 flex-wrap">
              {rarityStats.map(({ rarity, total, unlocked }) => {
                const { label, color, bg } = rarityMeta[rarity];
                return (
                  <div
                    key={rarity}
                    className={`px-3 py-2 rounded-lg ${bg} text-center min-w-[70px]`}
                  >
                    <div className={`text-sm font-bold ${color}`}>
                      {unlocked}/{total}
                    </div>
                    <div className="text-xs text-neutral-500">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl bg-neutral-800 border border-neutral-700"
        >
          <div className="flex flex-col gap-4">
            {/* Row 0: Domain filter */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-neutral-400">Domaine:</span>
              <Tabs.Root
                value={selectedDomain}
                onValueChange={(value) => setSelectedDomain(value as FilterDomain)}
              >
                <Tabs.List className="inline-flex p-0.5 rounded-lg bg-neutral-900 border border-neutral-700">
                  {([
                    { value: 'all' as FilterDomain, label: 'Tous', icon: '📋' },
                    { value: AchievementDomain.BETTING as FilterDomain, label: 'Paris', icon: '🎰' },
                    { value: AchievementDomain.RACING as FilterDomain, label: 'Courses', icon: '🏁' },
                  ]).map(({ value, label, icon }) => (
                    <Tabs.Trigger
                      key={value}
                      value={value}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                        data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </div>

            {/* Row 1: Status filter */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-neutral-400">Statut:</span>
              <Tabs.Root
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as FilterStatus)}
              >
                <Tabs.List className="inline-flex p-0.5 rounded-lg bg-neutral-900 border border-neutral-700">
                  {([
                    { value: 'all' as FilterStatus, label: 'Tous', icon: '📋' },
                    { value: 'unlocked' as FilterStatus, label: 'Débloqués', icon: '✅' },
                    { value: 'locked' as FilterStatus, label: 'Verrouillés', icon: '🔒' },
                  ]).map(({ value, label, icon }) => (
                    <Tabs.Trigger
                      key={value}
                      value={value}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        data-[state=active]:bg-neutral-600 data-[state=active]:text-white
                        data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                    >
                      <span>{icon}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>

              <div className="w-px h-6 bg-neutral-700 hidden sm:block" />

              {/* View toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm font-medium text-neutral-400 hidden sm:inline">Vue:</span>
                <Tabs.Root
                  value={view}
                  onValueChange={(value) => setView(value as 'grid' | 'chains')}
                >
                  <Tabs.List className="inline-flex p-0.5 rounded-lg bg-neutral-900 border border-neutral-700">
                    <Tabs.Trigger
                      value="grid"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                        data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Grille</span>
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="chains"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                        data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span className="hidden sm:inline">Chaînes</span>
                    </Tabs.Trigger>
                  </Tabs.List>
                </Tabs.Root>
              </div>
            </div>

            {/* Row 2: Category filter */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-neutral-400">Catégorie:</span>
              <Tabs.Root
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as FilterCategory)}
              >
                <Tabs.List className="inline-flex flex-wrap p-0.5 rounded-lg bg-neutral-900 border border-neutral-700">
                  <Tabs.Trigger
                    value="all"
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all
                      data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                      data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                  >
                    Toutes
                  </Tabs.Trigger>
                  {Object.entries(categoryMeta).map(([cat, { name, icon }]) => (
                    <Tabs.Trigger
                      key={cat}
                      value={cat}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                        data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                    >
                      <span>{icon}</span>
                      <span className="hidden md:inline">{name}</span>
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </div>

            {/* Row 3: Rarity filter */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-neutral-400">Rareté:</span>
              <Tabs.Root
                value={selectedRarity}
                onValueChange={(value) => setSelectedRarity(value as FilterRarity)}
              >
                <Tabs.List className="inline-flex flex-wrap p-0.5 rounded-lg bg-neutral-900 border border-neutral-700">
                  <Tabs.Trigger
                    value="all"
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all
                      data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                      data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-300"
                  >
                    Toutes
                  </Tabs.Trigger>
                  {Object.entries(rarityMeta).map(([rarity, { label, color }]) => (
                    <Tabs.Trigger
                      key={rarity}
                      value={rarity}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        data-[state=active]:bg-primary-500 data-[state=active]:text-neutral-900
                        data-[state=inactive]:${color} data-[state=inactive]:hover:opacity-80`}
                    >
                      {label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </div>
          </div>
        </motion.div>

        {/* Results count */}
        {!loading && (
          <div className="mb-4 text-sm text-neutral-500">
            {filteredAchievements.length} achievement{filteredAchievements.length !== 1 ? 's' : ''} trouvé{filteredAchievements.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-500/10 border border-error-500 text-error-400">
            {error}
          </div>
        )}

        {/* Grid View - Grouped by Category */}
        {view === 'grid' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
              </div>
            ) : filteredAchievements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg text-neutral-400">
                  Aucun achievement ne correspond à vos filtres
                </p>
                <button
                  onClick={() => {
                    setSelectedDomain('all');
                    setSelectedCategory('all');
                    setSelectedRarity('all');
                    setSelectedStatus('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary-500 text-neutral-900 font-medium hover:bg-primary-400 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : selectedCategory !== 'all' ? (
              // Single category view - no sections needed
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full"
                  >
                    <AchievementCard achievement={achievement} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              // All categories - show collapsible sections
              <div className="space-y-6">
                {categoryOrder.map((category, index) => {
                  const items = groupedByCategory[category];
                  if (items.length === 0) return null;

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Divider between categories */}
                      {index > 0 && (
                        <div className="border-t border-neutral-700 mb-6" />
                      )}
                      <CollapsibleCategorySection
                        categoryKey={category}
                        categoryName={categoryMeta[category].name}
                        categoryIcon={categoryMeta[category].icon}
                        achievements={items}
                        defaultExpanded={true}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Chains View */}
        {view === 'chains' && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
              </div>
            ) : filteredAchievements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-neutral-400 text-lg">
                  Aucun achievement ne correspond à vos filtres
                </p>
                <button
                  onClick={() => {
                    setSelectedDomain('all');
                    setSelectedCategory('all');
                    setSelectedRarity('all');
                    setSelectedStatus('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary-500 text-neutral-900 font-medium hover:bg-primary-400 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                {/* Group achievements by chain */}
                {(() => {
                  const chainGroups = new Map<string, Achievement[]>();
                  const standalone: Achievement[] = [];

                  filteredAchievements.forEach((achievement) => {
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
                    race_wins_chain: '🏁 Courses - Victoires',
                    race_participation_chain: '🏎️ Courses - Participation',
                    elo_chain: '📈 Courses - Rating ELO',
                    race_win_streak_chain: '🔥 Courses - Séries de Victoires',
                    race_play_streak_chain: '📅 Courses - Assiduité',
                  };

                  return (
                    <>
                      {/* Render chains */}
                      {Array.from(chainGroups.entries()).map(([chainName, chainAchievements], index) => (
                        <motion.div
                          key={chainName}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AchievementChain
                            chainName={chainName}
                            chainTitle={chainTitles[chainName] || chainName}
                            achievements={chainAchievements}
                          />
                        </motion.div>
                      ))}

                      {/* Render standalone achievements */}
                      {standalone.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: chainGroups.size * 0.1 }}
                        >
                          <h3 className="text-xl font-bold text-white mb-4">
                            🌟 Achievements Indépendants
                          </h3>
                          <AchievementGrid
                            achievements={standalone}
                            loading={false}
                            emptyMessage=""
                          />
                        </motion.div>
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
