'use client';

import { FC, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MdStar, MdEmojiEvents, MdTrendingUp, MdRocketLaunch, MdCalendarMonth, MdCheckCircle, MdPercent, MdDiamond, MdMilitaryTech } from 'react-icons/md';
import { UserStats } from '../../models/Achievement';
import TimePeriodToggle, { TimePeriod } from '../stats/TimePeriodToggle';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import StatCard from '../ui/StatCard';
import { StreakIndicator } from '../achievements';
import type { CompetitorStats } from '../../profile/page';

// Lazy load chart components for performance

interface StatsTabProps {
  stats: UserStats;
  /** Absent for someone with no linked competitor — a spectator. */
  competitorStats?: CompetitorStats | null;
  className?: string;
}


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
  competitorStats,
  className = '',
}) => {
  const [period, setPeriod] = useState<TimePeriod>('all');

  // Compute stats based on selected period
  /**
   * What the period toggle can still slice.
   *
   * The betting fields it used to carry — bets placed, boosts, high-odds
   * wins — are permanent zeroes since betting was removed, and a card
   * reading 0 is worse than no card: it tells someone they did nothing.
   * XP, level and consecutive seasons are still computed by the API.
   */
  const periodStats = useMemo(
    () => ({
      xp: stats.xp,
      level: stats.level,
      consecutiveMonths: stats.consecutiveMonthlyWins,
    }),
    [stats],
  );

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
            <span>Série saisonnière</span>
          </h3>
          <p className="text-xs text-neutral-500 font-normal -mt-2 mb-4">Semaines consécutives avec au moins 1 pick correct cette saison.</p>
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
              <div className="text-5xl mb-2">🎲</div>
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

      {/* Win Streak Section */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdMilitaryTech className="text-green-400" />
          <span>Série de victoires</span>
        </h3>
        <p className="text-xs text-neutral-500 font-normal -mt-2 mb-4">Semaines consécutives avec des points gagnés</p>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <AnimatedNumber
              value={stats.currentWinStreak}
              size="xl"
              colorClass="text-green-400"
            />
            <p className="text-sm text-neutral-400 mt-1">en cours</p>
          </div>
          <div className="text-center">
            <AnimatedNumber
              value={stats.bestWinStreak}
              size="xl"
              colorClass="text-yellow-400"
            />
            <p className="text-sm text-neutral-400 mt-1">record</p>
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
        {/* Race data. The three cards this replaces read betting win rate,
            betting points and perfect podiums — all permanent zeroes since
            the feature was removed. */}
        <div className="p-3 sm:p-5 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 sm:mb-3">
            <MdPercent className="text-lg sm:text-xl text-emerald-400" />
          </div>
          <AnimatedNumber
            value={competitorStats?.totalWins ?? 0}
            size="lg"
            colorClass="text-emerald-400"
          />
          <span className="text-xs sm:text-sm text-neutral-400 mt-1">
            Victoires
          </span>
        </div>

        <div className="p-3 sm:p-5 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-500/20 flex items-center justify-center mb-2 sm:mb-3">
            <MdDiamond className="text-lg sm:text-xl text-primary-400" />
          </div>
          <AnimatedNumber
            value={competitorStats?.raceCount ?? 0}
            size="lg"
            colorClass="text-primary-400"
          />
          <span className="text-xs sm:text-sm text-neutral-400 mt-1">
            Courses
          </span>
        </div>

        <div className="p-3 sm:p-5 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning-500/20 flex items-center justify-center mb-2 sm:mb-3">
            <MdEmojiEvents className="text-lg sm:text-xl text-warning-500" />
          </div>
          <AnimatedNumber
            value={competitorStats?.bestPlayStreak ?? 0}
            size="lg"
            colorClass="text-warning-500"
          />
          <span className="text-xs sm:text-sm text-neutral-400 mt-1">
            Record de série
          </span>
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
        {/* Race data, which the profile already loads. The cards this
            replaces read from betting fields the API stopped computing —
            five permanent zeroes on a tab called "Statistiques". */}
        {competitorStats && (
          <>
            <StatCard
              label="Courses"
              value={competitorStats.raceCount}
              icon={<MdCheckCircle className="text-emerald-400" />}
              colorClass="text-emerald-400"
              animated
            />
            <StatCard
              label="Victoires"
              value={competitorStats.totalWins}
              icon={<MdEmojiEvents className="text-success-400" />}
              colorClass="text-success-400"
              animated
            />
            <StatCard
              label="Rang moyen"
              value={
                competitorStats.avgRank12
                  ? competitorStats.avgRank12.toFixed(1)
                  : '-'
              }
              icon={<MdRocketLaunch className="text-gold-500" />}
              colorClass="text-gold-500"
            />
          </>
        )}
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
          label="Saisons Consécutives"
          value={periodStats.consecutiveMonths}
          icon={<MdTrendingUp className="text-emerald-400" />}
          colorClass="text-emerald-400"
          animated
        />
      </motion.div>




    </div>
  );
};

export default StatsTab;
