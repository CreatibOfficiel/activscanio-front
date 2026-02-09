'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { MdEmojiEvents, MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';
import { RecentRaceInfo } from '../../models/RecentRaceInfo';
import { RacesRepository } from '../../repositories/RacesRepository';
import { Skeleton } from '../ui';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RecentRacesSectionProps {
  competitorId: string;
  limit?: number;
  className?: string;
}

// Animation variants for staggered list
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

// Helper functions
const getRankStyle = (rank: number): { bg: string; text: string; badge: string } => {
  if (rank === 1)
    return {
      bg: 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/20',
      text: 'text-yellow-400',
      badge: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
    };
  if (rank === 2)
    return {
      bg: 'bg-gradient-to-r from-slate-400/30 to-slate-300/20',
      text: 'text-slate-300',
      badge: 'bg-gradient-to-r from-slate-400 to-slate-300',
    };
  if (rank === 3)
    return {
      bg: 'bg-gradient-to-r from-orange-700/30 to-orange-600/20',
      text: 'text-orange-400',
      badge: 'bg-gradient-to-r from-orange-700 to-orange-500',
    };
  if (rank <= 6)
    return {
      bg: 'bg-neutral-800/50',
      text: 'text-success-400',
      badge: 'bg-success-500/80',
    };
  if (rank <= 9)
    return {
      bg: 'bg-neutral-800/50',
      text: 'text-neutral-400',
      badge: 'bg-neutral-600',
    };
  return {
    bg: 'bg-neutral-800/50',
    text: 'text-error-400',
    badge: 'bg-error-500/80',
  };
};

const getRankLabel = (rank: number): string => {
  if (rank === 1) return '1er';
  return `${rank}e`;
};

const getRankIcon = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

const getScorePercentage = (score: number): number => (score / 60) * 100;

const getScoreColor = (score: number): string => {
  if (score >= 50) return 'from-emerald-500 to-emerald-400';
  if (score >= 40) return 'from-blue-500 to-primary-500';
  if (score >= 30) return 'from-yellow-500 to-yellow-400';
  return 'from-error-500 to-error-400';
};

interface TrendInfo {
  icon: React.ReactNode;
  label: string;
  color: string;
}

const getTrendIndicator = (races: RecentRaceInfo[]): TrendInfo => {
  if (races.length < 2) {
    return {
      icon: <MdTrendingFlat />,
      label: 'Données insuffisantes',
      color: 'text-neutral-400',
    };
  }

  const recentRaces = races.slice(0, 5);
  const avgRank =
    recentRaces.reduce((acc, r) => acc + r.rank12, 0) / recentRaces.length;

  if (avgRank < 4) {
    return {
      icon: <MdTrendingUp />,
      label: 'En forme',
      color: 'text-success-400',
    };
  }
  if (avgRank <= 7) {
    return {
      icon: <MdTrendingFlat />,
      label: 'Stable',
      color: 'text-neutral-400',
    };
  }
  return {
    icon: <MdTrendingDown />,
    label: 'En difficulté',
    color: 'text-error-400',
  };
};

/**
 * RecentRacesSection Component
 *
 * Displays the competitor's recent race results with:
 * - Rank styling (gold/silver/bronze for podium)
 * - Score progress bars with animation
 * - Trend indicator based on recent performance
 */
const RecentRacesSection: FC<RecentRacesSectionProps> = ({
  competitorId,
  limit = 5,
  className = '',
}) => {
  const { getToken } = useAuth();
  const [races, setRaces] = useState<RecentRaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        const repo = new RacesRepository(API_BASE_URL);
        const data = await repo.fetchRecentRacesOfCompetitor(competitorId, limit, token ?? undefined);
        setRaces(data);
      } catch (err) {
        console.error('Error fetching recent races:', err);
        setError('Impossible de charger les courses récentes');
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, [competitorId, limit, getToken]);

  const trend = useMemo(() => getTrendIndicator(races), [races]);

  if (loading) {
    return (
      <div
        className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-5 rounded-xl bg-error-500/10 border border-error-500 text-error-400 ${className}`}
      >
        {error}
      </div>
    );
  }

  if (races.length === 0) {
    return (
      <div
        className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500 ${className}`}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdEmojiEvents className="text-blue-400" />
          <span>Dernières Courses</span>
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🏎️</div>
          <p className="text-neutral-400">Aucune course enregistrée</p>
          <p className="text-sm text-neutral-500 mt-1">
            Participez à votre première course !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MdEmojiEvents className="text-blue-400" />
          <span>Dernières Courses</span>
        </h3>
        <div className={`flex items-center gap-1.5 text-sm ${trend.color}`}>
          <span className="text-lg">{trend.icon}</span>
          <span>{trend.label}</span>
        </div>
      </div>

      {/* Race List */}
      <motion.div
        className="space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {races.map((race, index) => {
          const rankStyle = getRankStyle(race.rank12);
          const scorePercent = getScorePercentage(race.score);
          const scoreColor = getScoreColor(race.score);

          return (
            <motion.div
              key={race.raceId}
              variants={itemVariants}
              className={`flex items-center gap-3 p-3 rounded-lg ${rankStyle.bg} border border-neutral-700/50`}
            >
              {/* Date */}
              <div className="w-16 flex-shrink-0">
                <span className="text-xs text-neutral-400">
                  {formatDate(race.date)}
                </span>
              </div>

              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-14 h-8 rounded-md ${rankStyle.badge} text-neutral-900 font-bold text-sm`}
                >
                  {getRankIcon(race.rank12) && (
                    <span className="mr-1">{getRankIcon(race.rank12)}</span>
                  )}
                  <span>{getRankLabel(race.rank12)}</span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${scoreColor} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{
                        duration: 0.5,
                        ease: 'easeOut',
                        delay: index * 0.08,
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${rankStyle.text}`}>
                    {race.score}/60
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Summary stats */}
      {races.length >= 3 && (
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {(races.reduce((acc, r) => acc + r.rank12, 0) / races.length).toFixed(1)}
              </div>
              <div className="text-xs text-neutral-400">Rang moyen</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {races.filter((r) => r.rank12 <= 3).length}
              </div>
              <div className="text-xs text-neutral-400">Podiums</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary-400">
                {Math.round(races.reduce((acc, r) => acc + r.score, 0) / races.length)}
              </div>
              <div className="text-xs text-neutral-400">Score moyen</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentRacesSection;
