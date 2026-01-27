'use client';

import { FC, useState, useEffect, lazy, Suspense } from 'react';
import {
  MdSpeed,
  MdEmojiEvents,
  MdDirectionsCar,
  MdTrendingUp,
  MdHistory,
} from 'react-icons/md';
import { Competitor } from '../../models/Competitor';
import { CompetitorsRepository } from '../../repositories/CompetitorsRepository';
import { Skeleton } from '../ui';

// Lazy load chart component for performance
const EloProgressChart = lazy(() => import('../stats/EloProgressChart'));

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RacesTabProps {
  competitorId: string;
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
 * RacesTab Component
 *
 * Races tab displaying:
 * - Current ELO stats (rating, RD, race count, avg rank)
 * - ELO progression chart
 * - Season history (coming soon)
 * - Recent races (coming soon)
 */
const RacesTab: FC<RacesTabProps> = ({
  competitorId,
  authToken,
  className = '',
}) => {
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch competitor data
  useEffect(() => {
    const fetchCompetitor = async () => {
      try {
        setLoading(true);
        setError(null);
        const repo = new CompetitorsRepository(API_BASE_URL);
        const data = await repo.fetchCompetitorById(competitorId);
        setCompetitor(data);
      } catch (err) {
        console.error('Error fetching competitor:', err);
        setError('Impossible de charger les données de course');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitor();
  }, [competitorId]);

  if (loading) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-races"
        aria-labelledby="tab-races"
        className={`space-y-6 ${className}`}
      >
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error || !competitor) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-races"
        aria-labelledby="tab-races"
        className={`p-6 rounded-xl bg-error-500/10 border border-error-500 text-error-400 ${className}`}
      >
        {error || 'Une erreur est survenue'}
      </div>
    );
  }

  // Calculate rating confidence based on RD
  // Lower RD = higher confidence
  const getRatingConfidence = (rd: number): { label: string; color: string } => {
    if (rd <= 50) return { label: 'Très fiable', color: 'text-success-400' };
    if (rd <= 100) return { label: 'Fiable', color: 'text-emerald-400' };
    if (rd <= 150) return { label: 'Modérée', color: 'text-warning-500' };
    return { label: 'Provisoire', color: 'text-neutral-400' };
  };

  const confidence = getRatingConfidence(competitor.rd);

  return (
    <div
      role="tabpanel"
      id="tabpanel-races"
      aria-labelledby="tab-races"
      className={`space-y-6 ${className}`}
    >
      {/* Current ELO Stats */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdSpeed className="text-blue-400" />
          <span>Statistiques ELO</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <RaceStatCard
            label="Rating ELO"
            value={Math.round(competitor.rating).toString()}
            icon={<MdSpeed className="text-blue-400" />}
            colorClass="text-blue-400"
          />
          <RaceStatCard
            label="Courses"
            value={(competitor.raceCount || 0).toString()}
            icon={<MdDirectionsCar className="text-blue-400" />}
          />
          <RaceStatCard
            label="Rang Moyen"
            value={competitor.avgRank12 ? competitor.avgRank12.toFixed(1) : '-'}
            subValue="sur 12 joueurs"
            icon={<MdEmojiEvents className="text-gold-500" />}
            colorClass="text-gold-500"
          />
          <RaceStatCard
            label="Fiabilité"
            value={confidence.label}
            subValue={`RD: ${Math.round(competitor.rd)}`}
            icon={<MdTrendingUp className={confidence.color} />}
            colorClass={confidence.color}
          />
        </div>

        {/* Conservative Score explanation */}
        {competitor.conservativeScore != null && (
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Score Conservateur (ELO - 2×RD)</span>
              <span className="font-bold text-blue-400">
                {Math.round(competitor.conservativeScore)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Ce score est utilisé pour le classement et reflète votre niveau minimum probable.
            </p>
          </div>
        )}
      </div>

      {/* ELO Progression Chart */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdTrendingUp className="text-blue-400" />
          <span>Progression ELO</span>
        </h3>
        <Suspense fallback={<ChartSkeleton />}>
          <EloProgressChart
            competitorId={competitorId}
            period="30d"
            authToken={authToken}
          />
        </Suspense>
      </div>

      {/* Season History - Coming Soon */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdHistory className="text-blue-400" />
          <span>Historique des Saisons</span>
        </h3>
        <div className="text-center py-8 text-neutral-400">
          <MdHistory className="text-4xl mx-auto mb-2 text-neutral-600" />
          <p>Historique des classements par saison</p>
          <p className="text-sm text-neutral-500 mt-1">
            Bientôt disponible
          </p>
        </div>
      </div>

      {/* Recent Races - Coming Soon */}
      <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MdDirectionsCar className="text-blue-400" />
          <span>Dernières Courses</span>
        </h3>
        <div className="text-center py-8 text-neutral-400">
          <MdDirectionsCar className="text-4xl mx-auto mb-2 text-neutral-600" />
          <p>Historique de vos courses récentes</p>
          <p className="text-sm text-neutral-500 mt-1">
            Bientôt disponible
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-component for race stat cards
interface RaceStatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

const RaceStatCard: FC<RaceStatCardProps> = ({
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

export default RacesTab;
