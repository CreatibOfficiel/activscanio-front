'use client';

import { FC, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { UserStats, UserAchievement } from '../models/Achievement';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import {
  XPLevelDisplay,
  FlameIndicator,
  AchievementGrid,
} from '../components/achievements';

const ProfilePage: FC = () => {
  const { getToken } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<
    UserAchievement[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user stats and achievements
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          throw new Error('Non authentifié');
        }

        // Fetch stats and achievements in parallel
        const [statsData, achievementsData] = await Promise.all([
          AchievementsRepository.getMyStats(token),
          AchievementsRepository.getMyAchievements(token),
        ]);

        setStats(statsData);
        setRecentAchievements(achievementsData.slice(0, 6)); // Show 6 most recent
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Impossible de charger votre profil');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-400">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-neutral-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-error-500/10 border border-error-500 text-error-400">
            {error || 'Une erreur est survenue'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">👤 Mon Profil</h1>
          <p className="text-neutral-400">
            Suivez votre progression et vos achievements
          </p>
        </div>

        {/* XP and Level Card */}
        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
          <h2 className="text-xl font-bold text-white mb-4">
            Niveau & Expérience
          </h2>
          <XPLevelDisplay
            level={stats.level}
            currentXP={stats.xp}
            xpForNextLevel={stats.xpForNextLevel}
            xpProgressPercent={stats.xpProgressPercent}
            currentTitle={stats.currentTitle}
            variant="detailed"
          />
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
            <h2 className="text-xl font-bold text-white mb-4">
              🔥 Série Mensuelle
            </h2>
            <FlameIndicator
              streak={stats.currentMonthlyStreak}
              type="monthly"
              variant="detailed"
            />
          </div>

          <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
            <h2 className="text-xl font-bold text-white mb-4">
              ⭐ Record Lifetime
            </h2>
            <FlameIndicator
              streak={stats.longestLifetimeStreak}
              type="lifetime"
              variant="detailed"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
          <h2 className="text-xl font-bold text-white mb-6">📊 Statistiques</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Achievements */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Achievements</div>
              <div className="text-2xl font-bold text-primary-400">
                {stats.unlockedAchievements}/{stats.totalAchievements}
              </div>
              <div className="text-xs text-neutral-500">
                {stats.achievementProgress.toFixed(0)}%
              </div>
            </div>

            {/* Total Bets */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Paris Totaux</div>
              <div className="text-2xl font-bold text-white">
                {stats.totalBetsPlaced}
              </div>
              <div className="text-xs text-neutral-500">All-time</div>
            </div>

            {/* Win Rate */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Taux de Réussite</div>
              <div className="text-2xl font-bold text-success-400">
                {stats.winRate.toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-500">
                {stats.totalBetsWon} victoires
              </div>
            </div>

            {/* Perfect Bets */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Podiums Parfaits</div>
              <div className="text-2xl font-bold text-warning-500">
                {stats.totalPerfectBets}
              </div>
              <div className="text-xs text-neutral-500">🏆 Lifetime</div>
            </div>

            {/* Total Points */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Points Totaux</div>
              <div className="text-2xl font-bold text-primary-400">
                {stats.totalPoints.toFixed(0)}
              </div>
              <div className="text-xs text-neutral-500">Lifetime</div>
            </div>

            {/* Best Rank */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Meilleur Rang</div>
              <div className="text-2xl font-bold text-gold-500">
                {stats.bestMonthlyRank ? `#${stats.bestMonthlyRank}` : '-'}
              </div>
              <div className="text-xs text-neutral-500">Mensuel</div>
            </div>

            {/* Boosts Used */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Boosts Utilisés</div>
              <div className="text-2xl font-bold text-warning-500">
                {stats.totalBoostsUsed}
              </div>
              <div className="text-xs text-neutral-500">Total</div>
            </div>

            {/* High Odds Wins */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Cotes Élevées</div>
              <div className="text-2xl font-bold text-error-400">
                {stats.highOddsWins}
              </div>
              <div className="text-xs text-neutral-500">Cote &gt; 10</div>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
          <h2 className="text-xl font-bold text-white mb-6">
            📅 Ce Mois-ci
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Paris</div>
              <div className="text-2xl font-bold text-white">
                {stats.monthlyBetsPlaced}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Victoires</div>
              <div className="text-2xl font-bold text-success-400">
                {stats.monthlyBetsWon}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Points</div>
              <div className="text-2xl font-bold text-primary-400">
                {stats.monthlyPoints.toFixed(0)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="text-sm text-neutral-400 mb-1">Rang</div>
              <div className="text-2xl font-bold text-gold-500">
                {stats.monthlyRank ? `#${stats.monthlyRank}` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              🏆 Achievements Récents
            </h2>
            <a
              href="/achievements"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Voir tout →
            </a>
          </div>

          {recentAchievements.length > 0 ? (
            <AchievementGrid
              achievements={recentAchievements.map((ua) => ({
                id: ua.achievementId,
                key: ua.achievement.key,
                name: ua.achievement.name,
                description: ua.achievement.description,
                category: ua.achievement.category,
                rarity: ua.achievement.rarity,
                icon: ua.achievement.icon,
                xpReward: ua.achievement.xpReward,
                unlocksTitle: ua.achievement.unlocksTitle,
                isUnlocked: true,
                unlockedAt: ua.unlockedAt,
              }))}
              variant="compact"
            />
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <div className="text-4xl mb-2">🏆</div>
              <p>Aucun achievement débloqué pour le moment</p>
              <p className="text-sm text-neutral-600 mt-1">
                Continuez à jouer pour en débloquer !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
