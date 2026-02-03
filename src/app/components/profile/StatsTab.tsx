'use client';

import { FC, lazy, Suspense, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MdCasino, MdStar, MdEmojiEvents, MdTrendingUp, MdRocketLaunch, MdCalendarMonth, MdCheckCircle, MdPercent, MdDiamond } from 'react-icons/md';
import { UserStats } from '../../models/Achievement';
import TimePeriodToggle, { TimePeriod } from '../stats/TimePeriodToggle';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import StatCard from '../ui/StatCard';
import InfoTooltip from '../ui/InfoTooltip';
import { StreakIndicator } from '../achievements';

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
 * Stats tab displaying betting statistics with time period toggle:
 * - Hero stats with circular win rate and animated numbers
 * - Stats grid with unified StatCard components
 * - XP progression chart
 * - Win rate trends and advanced stats
 *
 * Uses emerald/green color scheme for betting stats
 */
const StatsTab: FC<StatsTabProps> = ({
  stats,
  authToken,
  className = '',
}) => {
  const [period, setPeriod] = useState<TimePeriod>('all');

  // Compute stats based on selected period
  const periodStats = useMemo(() => {
    switch (period) {
      case 'month':
        return {
          betsPlaced: stats.monthlyBetsPlaced,
          betsWon: stats.monthlyBetsWon,
          perfectBets: stats.monthlyPerfectBets,
          points: stats.monthlyPoints,
          winRate: stats.monthlyBetsPlaced > 0
            ? (stats.monthlyBetsWon / stats.monthlyBetsPlaced) * 100
            : 0,
          bestRank: stats.monthlyRank,
          xp: stats.xp, // No monthly XP tracking
          level: stats.level,
          boostsUsed: stats.totalBoostsUsed, // No monthly tracking
          highOddsWins: stats.highOddsWins, // No monthly tracking
          consecutiveMonths: stats.consecutiveMonthlyWins,
        };
      case 'year':
        // Yearly stats are approximated from lifetime (API would need yearly endpoint)
        // For now, we use lifetime as placeholder
        return {
          betsPlaced: stats.totalBetsPlaced,
          betsWon: stats.totalBetsWon,
          perfectBets: stats.totalPerfectBets,
          points: stats.totalPoints,
          winRate: stats.winRate,
          bestRank: stats.bestMonthlyRank,
          xp: stats.xp,
          level: stats.level,
          boostsUsed: stats.totalBoostsUsed,
          highOddsWins: stats.highOddsWins,
          consecutiveMonths: stats.consecutiveMonthlyWins,
        };
      case 'all':
      default:
        return {
          betsPlaced: stats.totalBetsPlaced,
          betsWon: stats.totalBetsWon,
          perfectBets: stats.totalPerfectBets,
          points: stats.totalPoints,
          winRate: stats.winRate,
          bestRank: stats.bestMonthlyRank,
          xp: stats.xp,
          level: stats.level,
          boostsUsed: stats.totalBoostsUsed,
          highOddsWins: stats.highOddsWins,
          consecutiveMonths: stats.consecutiveMonthlyWins,
        };
    }
  }, [period, stats]);

  return (
    <div
      role="tabpanel"
      id="tabpanel-stats"
      aria-labelledby="tab-stats"
      className={`space-y-6 ${className}`}
    >
      {/* Streaks Section - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MdCalendarMonth className="text-orange-400" />
            <InfoTooltip
              content="Nombre de semaines consécutives avec au moins 1 pick correct ce mois-ci."
              position="bottom"
              iconSize="xs"
            >
              <span>Série mensuelle</span>
            </InfoTooltip>
          </h3>
          <StreakIndicator
            type="monthly"
            currentStreak={stats.currentMonthlyStreak}
            totalWeeksInMonth={4}
          />
        </div>

        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MdStar className="text-purple-400" />
            <span>Record personnel</span>
          </h3>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">🔥</div>
              <AnimatedNumber
                value={stats.longestLifetimeStreak}
                size="xl"
                colorClass="text-orange-400"
              />
              <p className="text-sm text-neutral-400 mt-1">semaines consécutives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Toggle */}
      <div className="flex justify-center">
        <TimePeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Hero Stats Section - 3 cards sur une ligne */}
      <motion.div
        key={period}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-3 gap-2 sm:gap-4"
      >
        {/* Win Rate Card */}
        <div className="p-3 sm:p-5 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 sm:mb-3">
            <MdPercent className="text-lg sm:text-xl text-emerald-400" />
          </div>
          <AnimatedNumber
            value={Math.round(periodStats.winRate)}
            size="lg"
            colorClass="text-emerald-400"
            suffix="%"
          />
          <span className="text-xs sm:text-sm text-neutral-400 mt-1 mb-2 sm:mb-3">Win Rate</span>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 sm:h-2 bg-neutral-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${periodStats.winRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            />
          </div>
        </div>

        {/* Points Card */}
        <div className="p-3 sm:p-5 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-500/20 flex items-center justify-center mb-2 sm:mb-3">
            <MdDiamond className="text-lg sm:text-xl text-primary-400" />
          </div>
          <AnimatedNumber
            value={Math.round(periodStats.points)}
            size="lg"
            colorClass="text-primary-400"
            suffix=""
          />
          <span className="text-xs sm:text-sm text-neutral-400 mt-1">Points</span>
        </div>

        {/* Podiums Parfaits Card */}
        <div className="p-3 sm:p-5 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning-500/20 flex items-center justify-center mb-2 sm:mb-3">
            <MdEmojiEvents className="text-lg sm:text-xl text-warning-500" />
          </div>
          <AnimatedNumber
            value={periodStats.perfectBets}
            size="lg"
            colorClass="text-warning-500"
            suffix=""
          />
          <span className="text-xs sm:text-sm text-neutral-400 mt-1 text-center leading-tight">Parfaits</span>
          <span className="text-[10px] text-neutral-500">(3/3 corrects)</span>
        </div>
      </motion.div>

      {/* Stats Grid (2x4) */}
      <motion.div
        key={`grid-${period}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard
          label="Paris Placés"
          value={periodStats.betsPlaced}
          icon={<MdCasino className="text-emerald-400" />}
          colorClass="text-emerald-400"
          animated
        />
        <StatCard
          label="Victoires"
          value={periodStats.betsWon}
          icon={<MdCheckCircle className="text-success-400" />}
          colorClass="text-success-400"
          animated
        />
        <StatCard
          label="Meilleur Rang"
          value={periodStats.bestRank ? `#${periodStats.bestRank}` : '-'}
          icon={<MdEmojiEvents className="text-gold-500" />}
          colorClass="text-gold-500"
        />
        <StatCard
          label="Boosts"
          value={periodStats.boostsUsed}
          icon={<MdRocketLaunch className="text-warning-500" />}
          colorClass="text-warning-500"
          animated
        />
        <StatCard
          label="Cotes Élevées"
          value={periodStats.highOddsWins}
          icon={<span className="text-error-400">💥</span>}
          subValue="Cote > 10"
          colorClass="text-error-400"
          animated
        />
        <StatCard
          label="XP Total"
          value={periodStats.xp.toLocaleString()}
          icon={<span className="text-primary-400">✨</span>}
          subValue={`Niveau ${periodStats.level}`}
          colorClass="text-primary-400"
        />
        <StatCard
          label="Niveau"
          value={periodStats.level}
          icon={<MdStar className="text-primary-400" />}
          colorClass="text-primary-400"
          animated
        />
        <StatCard
          label="Mois Consécutifs"
          value={periodStats.consecutiveMonths}
          icon={<MdTrendingUp className="text-emerald-400" />}
          colorClass="text-emerald-400"
          animated
        />
      </motion.div>

      {/* XP Progression Chart */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-emerald-400">📈</span>
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
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-emerald-400">📉</span>
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
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-emerald-400">⚖️</span>
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
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-emerald-400">🔬</span>
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

export default StatsTab;
