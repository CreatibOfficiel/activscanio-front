'use client';

import { FC } from 'react';
import Link from 'next/link';
import { UserStats, UserAchievement } from '../../models/Achievement';
import { FlameIndicator, AchievementGrid } from '../achievements';

interface OverviewTabProps {
  stats: UserStats;
  recentAchievements: UserAchievement[];
  className?: string;
}

/**
 * OverviewTab Component
 *
 * Default tab displaying:
 * - Streaks (monthly + lifetime)
 * - Quick performance stats (this month)
 * - Achievement showcase
 */
const OverviewTab: FC<OverviewTabProps> = ({
  stats,
  recentAchievements,
  className = '',
}) => {
  // Transform achievements for the grid
  const transformedAchievements = recentAchievements.slice(0, 5).map((ua) => ({
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
  }));

  return (
    <div
      role="tabpanel"
      id="tabpanel-overview"
      aria-labelledby="tab-overview"
      className={`space-y-6 ${className}`}
    >
      {/* Streaks Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>🔥</span>
            <span>Série Mensuelle</span>
          </h3>
          <FlameIndicator
            streak={stats.currentMonthlyStreak}
            type="monthly"
            variant="detailed"
          />
        </div>

        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>⭐</span>
            <span>Record Lifetime</span>
          </h3>
          <FlameIndicator
            streak={stats.longestLifetimeStreak}
            type="lifetime"
            variant="detailed"
          />
        </div>
      </div>

      {/* Monthly Performance Grid */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📅</span>
          <span>Ce Mois-ci</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Paris"
            value={stats.monthlyBetsPlaced}
            icon="🎲"
          />
          <StatCard
            label="Victoires"
            value={stats.monthlyBetsWon}
            icon="✅"
            colorClass="text-success-400"
          />
          <StatCard
            label="Points"
            value={stats.monthlyPoints.toFixed(0)}
            icon="⭐"
            colorClass="text-primary-400"
          />
          <StatCard
            label="Rang"
            value={stats.monthlyRank ? `#${stats.monthlyRank}` : '-'}
            icon="🏆"
            colorClass="text-gold-500"
          />
        </div>
      </div>

      {/* Achievement Showcase */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🏆</span>
            <span>Succès Récents</span>
          </h3>
          <Link
            href="/achievements"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
          >
            Voir tout
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {transformedAchievements.length > 0 ? (
          <AchievementGrid
            achievements={transformedAchievements}
            variant="compact"
          />
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <div className="text-4xl mb-2">🏆</div>
            <p>Aucun succès débloqué pour le moment</p>
            <p className="text-sm text-neutral-500 mt-1">
              Continuez à jouer pour en débloquer !
            </p>
          </div>
        )}

        {/* Achievement Progress */}
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-400">Progression globale</span>
            <span className="text-white font-medium">
              {stats.unlockedAchievements}/{stats.totalAchievements} ({stats.achievementProgress.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
              style={{ width: `${stats.achievementProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStatPill
          label="Win Rate"
          value={`${stats.winRate.toFixed(0)}%`}
          colorClass="text-success-400"
        />
        <QuickStatPill
          label="Total Paris"
          value={stats.totalBetsPlaced.toString()}
        />
        <QuickStatPill
          label="Podiums Parfaits"
          value={stats.totalPerfectBets.toString()}
          colorClass="text-warning-500"
        />
        <QuickStatPill
          label="Points Totaux"
          value={stats.totalPoints.toFixed(0)}
          colorClass="text-primary-400"
        />
      </div>
    </div>
  );
};

// Sub-component for stat cards
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  colorClass?: string;
}

const StatCard: FC<StatCardProps> = ({
  label,
  value,
  icon,
  colorClass = 'text-white',
}) => (
  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-base">{icon}</span>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
    <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
  </div>
);

// Sub-component for quick stat pills
interface QuickStatPillProps {
  label: string;
  value: string;
  colorClass?: string;
}

const QuickStatPill: FC<QuickStatPillProps> = ({
  label,
  value,
  colorClass = 'text-white',
}) => (
  <div className="flex flex-col items-center p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
    <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
    <span className="text-xs text-neutral-400">{label}</span>
  </div>
);

export default OverviewTab;
