'use client';

import { FC } from 'react';
import Link from 'next/link';
import {
  MdEmojiEvents,
  MdStar,
  MdCheckCircle,
  MdDirectionsCar,
  MdSpeed,
  MdLocalFireDepartment,
  MdSportsTennis,
} from 'react-icons/md';
import { UserStats, UserAchievement } from '../../models/Achievement';
import type { PingpongPlayer } from '../../models/Pingpong';
import type { CompetitorStats } from '../../profile/page';
import { AchievementGrid } from '../achievements';
import StatCard from '../ui/StatCard';

// Type for competitor stats
interface OverviewTabProps {
  stats: UserStats;
  recentAchievements: UserAchievement[];
  competitorStats?: CompetitorStats | null;
  /**
   * This user's ping-pong record, when they have one.
   *
   * Null covers "does not follow ping-pong", "never played", and "the board
   * request failed" — all three should simply omit the block rather than
   * show a row of zeroes, which would read as a bad season instead of an
   * absent one.
   */
  pingpongPlayer?: PingpongPlayer | null;
  className?: string;
}

/**
 * OverviewTab Component
 *
 * Default tab displaying:
 * - Quick performance stats (this month) - BETTING focused (green/emerald)
 * - Races stats for players (blue)
 * - Achievement showcase with progress bar
 */
const OverviewTab: FC<OverviewTabProps> = ({
  stats,
  recentAchievements,
  competitorStats,
  pingpongPlayer,
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
      {/* Attendance, which is the one number nobody else can move. A rank
          is zero-sum; a play streak is yours alone. */}
      {competitorStats && (
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MdLocalFireDepartment className="text-emerald-400" />
            <span>Ma régularité</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Série en cours"
              value={competitorStats.playStreak}
              icon={<MdLocalFireDepartment className="text-emerald-400" />}
              variant="compact"
              animated
            />
            <StatCard
              label="Record"
              value={competitorStats.bestPlayStreak}
              icon={<MdEmojiEvents className="text-gold-500" />}
              colorClass="text-gold-500"
              variant="compact"
              animated
            />
            <StatCard
              label="Victoires"
              value={competitorStats.totalWins}
              icon={<MdCheckCircle className="text-success-400" />}
              colorClass="text-success-400"
              variant="compact"
              animated
            />
            <StatCard
              label="Courses"
              value={competitorStats.raceCount}
              icon={<MdStar className="text-primary-400" />}
              colorClass="text-primary-400"
              variant="compact"
              animated
            />
          </div>
        </div>
      )}

      {/* Races Section - Only shown for players with competitor stats */}
      {competitorStats && (
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MdDirectionsCar className="text-blue-400" />
            <span>Mes courses</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Victoires"
              value={`${competitorStats.totalWins} / ${competitorStats.raceCount}`}
              icon={<MdDirectionsCar className="text-blue-400" />}
              variant="compact"
              animated
            />
            <StatCard
              label="Rang Moyen"
              value={competitorStats.avgRank12 > 0 ? competitorStats.avgRank12.toFixed(1) : '-'}
              icon={<MdEmojiEvents className="text-gold-500" />}
              colorClass="text-gold-500"
              variant="compact"
            />
            <StatCard
              label="ELO"
              value={Math.round(competitorStats.conservativeScore)}
              icon={<MdSpeed className="text-blue-400" />}
              colorClass="text-blue-400"
              variant="compact"
              animated
            />
            <StatCard
              label="Série de victoires"
              value={`${competitorStats.winStreak} (Record ${competitorStats.bestWinStreak})`}
              icon={<MdLocalFireDepartment className="text-orange-400" />}
              colorClass="text-orange-400"
              variant="compact"
              animated
            />
          </div>
        </div>
      )}

      {/* Ping-pong, mirroring the races block above.

          The tab showed two Mario Kart panels and nothing else, so someone
          who plays both sports saw half their profile. Same four figures in
          the same order — record, standing, rating, streak — so the two
          blocks read as one pair rather than two designs.

          The rank is the API's own: it withholds one during calibration
          (`rank: null`), which is why this shows a dash rather than
          computing a placeholder from the rating. */}
      {pingpongPlayer && (
        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-primary-500">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MdSportsTennis className="text-primary-400" />
            <span>Mon ping-pong</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Victoires"
              value={`${pingpongPlayer.wins} / ${pingpongPlayer.matchCount}`}
              icon={<MdSportsTennis className="text-primary-400" />}
              variant="compact"
              animated
            />
            <StatCard
              label="Classement"
              value={
                pingpongPlayer.rank === null
                  ? 'En calibrage'
                  : `${pingpongPlayer.rank}${pingpongPlayer.rank === 1 ? 'er' : 'e'}`
              }
              icon={<MdEmojiEvents className="text-gold-500" />}
              colorClass="text-gold-500"
              variant="compact"
            />
            <StatCard
              label="ELO"
              value={Math.round(pingpongPlayer.conservativeScore)}
              icon={<MdSpeed className="text-primary-400" />}
              colorClass="text-primary-400"
              variant="compact"
              animated
            />
            <StatCard
              label="Série de victoires"
              value={`${pingpongPlayer.currentStreak} (Record ${pingpongPlayer.bestStreak})`}
              icon={<MdLocalFireDepartment className="text-orange-400" />}
              colorClass="text-orange-400"
              variant="compact"
              animated
            />
          </div>
        </div>
      )}

      {/* Achievement Showcase */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MdEmojiEvents className="text-gold-500" />
            <span>Succès récents</span>
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
            <MdEmojiEvents className="text-4xl mx-auto mb-2 text-neutral-600" />
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
              {stats.unlockedAchievements}/{stats.totalAchievements} ({(stats.achievementProgress ?? 0).toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary-500 to-primary-400 transition-all duration-500"
              style={{ width: `${stats.achievementProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
