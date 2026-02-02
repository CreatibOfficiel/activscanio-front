'use client';

import { FC, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MdEmojiEvents, MdStarRate } from 'react-icons/md';
import {
  SeasonsRepository,
  SeasonArchive,
  ArchivedCompetitorRanking,
} from '../../repositories/SeasonsRepository';
import { Skeleton } from '../ui';

interface SeasonHistorySectionProps {
  competitorId: string;
  competitorName: string;
  className?: string;
}

interface SeasonResult {
  season: SeasonArchive;
  ranking: ArchivedCompetitorRanking | null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Helper functions
const getSeasonLabel = (month: number, year: number): string => {
  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  return `${monthNames[month - 1]} ${year}`;
};

const getRankBadge = (
  rank: number
): { label: string; bg: string; border: string; glow: string } | null => {
  if (rank === 1) {
    return {
      label: 'Champion',
      bg: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
      border: 'border-l-yellow-500',
      glow: 'shadow-yellow-500/30',
    };
  }
  if (rank <= 3) {
    return {
      label: 'Podium',
      bg: 'bg-gradient-to-r from-orange-600 to-orange-500',
      border: 'border-l-orange-500',
      glow: 'shadow-orange-500/20',
    };
  }
  if (rank <= 5) {
    return {
      label: 'Top 5',
      bg: 'bg-blue-500',
      border: 'border-l-blue-500',
      glow: '',
    };
  }
  return null;
};

const getRankIcon = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
};

const getRankStyle = (
  rank: number
): { border: string; bg: string; text: string } => {
  if (rank === 1) {
    return {
      border: 'border-l-4 border-l-yellow-500',
      bg: 'bg-gradient-to-r from-yellow-500/10 to-transparent',
      text: 'text-yellow-400',
    };
  }
  if (rank === 2) {
    return {
      border: 'border-l-4 border-l-slate-400',
      bg: 'bg-gradient-to-r from-slate-400/10 to-transparent',
      text: 'text-slate-300',
    };
  }
  if (rank === 3) {
    return {
      border: 'border-l-4 border-l-orange-500',
      bg: 'bg-gradient-to-r from-orange-500/10 to-transparent',
      text: 'text-orange-400',
    };
  }
  if (rank <= 5) {
    return {
      border: 'border-l-4 border-l-blue-500',
      bg: '',
      text: 'text-blue-400',
    };
  }
  return {
    border: 'border-l-4 border-l-neutral-600',
    bg: '',
    text: 'text-neutral-400',
  };
};

/**
 * SeasonHistorySection Component
 *
 * Displays the competitor's historical rankings across archived seasons:
 * - Shows all past seasons with competitor's ranking
 * - Badges for Champion/Podium/Top5
 * - ELO rating and stats per season
 */
const SeasonHistorySection: FC<SeasonHistorySectionProps> = ({
  competitorId,
  competitorName,
  className = '',
}) => {
  const [seasonResults, setSeasonResults] = useState<SeasonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeasonHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all archived seasons
        const seasons = await SeasonsRepository.getAllSeasons();

        // For each season, fetch competitor rankings and find this competitor
        const results: SeasonResult[] = [];

        for (const season of seasons) {
          try {
            const rankings = await SeasonsRepository.getCompetitorRankings(
              season.year,
              season.month
            );

            // Find this competitor in the rankings
            const ranking = rankings.find(
              (r) =>
                r.competitorId === competitorId ||
                r.competitorName.toLowerCase() === competitorName.toLowerCase()
            );

            results.push({
              season,
              ranking: ranking || null,
            });
          } catch {
            // If rankings fetch fails for a season, include it with null ranking
            results.push({
              season,
              ranking: null,
            });
          }
        }

        // Sort by date descending (most recent first)
        results.sort((a, b) => {
          const dateA = a.season.year * 100 + a.season.month;
          const dateB = b.season.year * 100 + b.season.month;
          return dateB - dateA;
        });

        // Only show seasons where the competitor participated
        const participatedSeasons = results.filter((r) => r.ranking !== null);

        setSeasonResults(participatedSeasons);
      } catch (err) {
        console.error('Error fetching season history:', err);
        setError('Impossible de charger le palmarès');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonHistory();
  }, [competitorId, competitorName]);

  if (loading) {
    return (
      <div
        className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
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

  if (seasonResults.length === 0) {
    return (
      <div
        className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500 ${className}`}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdEmojiEvents className="text-yellow-400" />
          <span>Palmarès des Saisons</span>
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🏁</div>
          <p className="text-neutral-400">Première saison en cours</p>
          <p className="text-sm text-neutral-500 mt-1">
            Votre palmarès apparaîtra ici à la fin du mois
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalSeasons = seasonResults.length;
  const championships = seasonResults.filter(
    (r) => r.ranking?.rank === 1
  ).length;
  const podiums = seasonResults.filter((r) => r.ranking && r.ranking.rank <= 3)
    .length;
  const avgRank =
    seasonResults.reduce((acc, r) => acc + (r.ranking?.rank || 0), 0) /
    totalSeasons;

  return (
    <div
      className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500 ${className}`}
    >
      {/* Header */}
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <MdEmojiEvents className="text-yellow-400" />
        <span>Palmarès des Saisons</span>
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6 p-3 rounded-lg bg-neutral-900/50">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{totalSeasons}</div>
          <div className="text-xs text-neutral-400">Saisons</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-400">{championships}</div>
          <div className="text-xs text-neutral-400">Titres</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-400">{podiums}</div>
          <div className="text-xs text-neutral-400">Podiums</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-primary-400">
            {avgRank.toFixed(1)}
          </div>
          <div className="text-xs text-neutral-400">Rang moy.</div>
        </div>
      </div>

      {/* Season Cards */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {seasonResults.map(({ season, ranking }) => {
          if (!ranking) return null;

          const rankStyle = getRankStyle(ranking.rank);
          const badge = getRankBadge(ranking.rank);

          return (
            <motion.div
              key={season.id}
              variants={itemVariants}
              className={`p-4 rounded-lg bg-neutral-900 border border-neutral-700 ${rankStyle.border} ${rankStyle.bg} ${
                badge?.glow ? `shadow-lg ${badge.glow}` : ''
              }`}
            >
              {/* Season Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {getSeasonLabel(season.month, season.year)}
                  </span>
                  {badge && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold text-neutral-900 ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 font-bold ${rankStyle.text}`}>
                  {getRankIcon(ranking.rank) && (
                    <span className="text-lg">{getRankIcon(ranking.rank)}</span>
                  )}
                  <span className="text-lg">
                    {ranking.rank === 1 ? '1er' : `${ranking.rank}e`}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-neutral-400 text-xs">ELO Final</div>
                  <div className="text-white font-medium flex items-center gap-1">
                    <MdStarRate className="text-primary-400 text-sm" />
                    {Math.round(ranking.finalRating)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400 text-xs">Courses</div>
                  <div className="text-white font-medium">{ranking.raceCount}</div>
                </div>
                <div>
                  <div className="text-neutral-400 text-xs">Rang moyen</div>
                  <div className="text-white font-medium">
                    {ranking.avgRank12.toFixed(1)}/12
                  </div>
                </div>
              </div>

              {/* Win Streak indicator */}
              {ranking.winStreak > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-700/50">
                  <div className="flex items-center gap-1 text-xs text-orange-400">
                    <span>🔥</span>
                    <span>
                      Meilleure série: {ranking.winStreak} victoire
                      {ranking.winStreak > 1 ? 's' : ''} consécutive
                      {ranking.winStreak > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SeasonHistorySection;
