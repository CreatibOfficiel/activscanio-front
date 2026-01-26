'use client';

import { FC, lazy, Suspense } from 'react';
import { UserStats } from '../../models/Achievement';

// Lazy load chart components for performance
const XPProgressChart = lazy(() => import('../stats/XPProgressChart'));
const WinRateChart = lazy(() => import('../stats/WinRateChart'));
const ComparisonCard = lazy(() => import('../stats/ComparisonCard'));
const AdvancedStatsPanel = lazy(() => import('../stats/AdvancedStatsPanel'));

interface StatsTabProps {
  stats: UserStats;
  authToken?: string;
  className?: string;
}

// Loading skeleton for charts
const ChartSkeleton: FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`${height} bg-neutral-900 rounded-lg animate-pulse`}>
    <div className="flex items-center justify-center h-full text-neutral-600">
      Chargement...
    </div>
  </div>
);

/**
 * StatsTab Component
 *
 * Stats tab displaying:
 * - XP progression chart (30 days)
 * - Lifetime stats grid
 * - Comparison card (vs average)
 * - Win rate trends and advanced stats
 */
const StatsTab: FC<StatsTabProps> = ({
  stats,
  authToken,
  className = '',
}) => {
  return (
    <div
      role="tabpanel"
      id="tabpanel-stats"
      aria-labelledby="tab-stats"
      className={`space-y-6 ${className}`}
    >
      {/* Lifetime Stats Grid */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Statistiques Lifetime</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <LifetimeStatCard
            label="Paris Placés"
            value={stats.totalBetsPlaced}
            icon="🎲"
          />
          <LifetimeStatCard
            label="Victoires"
            value={stats.totalBetsWon}
            subValue={`${stats.winRate.toFixed(0)}%`}
            icon="✅"
            colorClass="text-success-400"
          />
          <LifetimeStatCard
            label="Podiums Parfaits"
            value={stats.totalPerfectBets}
            icon="🏆"
            colorClass="text-warning-500"
          />
          <LifetimeStatCard
            label="Points Totaux"
            value={stats.totalPoints.toFixed(0)}
            icon="⭐"
            colorClass="text-primary-400"
          />
          <LifetimeStatCard
            label="Meilleur Rang"
            value={stats.bestMonthlyRank ? `#${stats.bestMonthlyRank}` : '-'}
            icon="🥇"
            colorClass="text-gold-500"
          />
          <LifetimeStatCard
            label="Boosts Utilisés"
            value={stats.totalBoostsUsed}
            icon="🚀"
            colorClass="text-warning-500"
          />
          <LifetimeStatCard
            label="Cotes Élevées"
            value={stats.highOddsWins}
            subValue="Cote > 10"
            icon="💥"
            colorClass="text-error-400"
          />
          <LifetimeStatCard
            label="XP Total"
            value={stats.xp.toLocaleString()}
            subValue={`Niveau ${stats.level}`}
            icon="✨"
            colorClass="text-primary-400"
          />
        </div>
      </div>

      {/* XP Progression Chart */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📈</span>
          <span>Progression XP</span>
        </h3>
        <Suspense fallback={<ChartSkeleton />}>
          <XPProgressChart
            userId={stats.userId}
            period="30d"
            authToken={authToken}
            className=""
          />
        </Suspense>
      </div>

      {/* Win Rate Chart */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📉</span>
          <span>Évolution du Win Rate</span>
        </h3>
        <Suspense fallback={<ChartSkeleton />}>
          <WinRateChart
            userId={stats.userId}
            days={30}
            authToken={authToken}
            className=""
          />
        </Suspense>
      </div>

      {/* Comparison Card */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚖️</span>
          <span>Comparaison</span>
        </h3>
        <Suspense fallback={<ChartSkeleton height="h-48" />}>
          <ComparisonCard
            userId={stats.userId}
            authToken={authToken}
            className=""
          />
        </Suspense>
      </div>

      {/* Advanced Stats Panel */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🔬</span>
          <span>Analyse Avancée</span>
        </h3>
        <Suspense fallback={<ChartSkeleton height="h-72" />}>
          <AdvancedStatsPanel
            userId={stats.userId}
            authToken={authToken}
            className=""
          />
        </Suspense>
      </div>
    </div>
  );
};

// Sub-component for lifetime stat cards
interface LifetimeStatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: string;
  colorClass?: string;
}

const LifetimeStatCard: FC<LifetimeStatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  colorClass = 'text-white',
}) => (
  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{icon}</span>
      <span className="text-xs text-neutral-400 truncate">{label}</span>
    </div>
    <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
    {subValue && (
      <div className="text-xs text-neutral-500 mt-0.5">{subValue}</div>
    )}
  </div>
);

export default StatsTab;
