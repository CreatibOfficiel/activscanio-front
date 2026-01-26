'use client';

import React, { useEffect, useState } from 'react';
import { StatsRepository, ComparisonStats } from '@/app/repositories/StatsRepository';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';

interface ComparisonCardProps {
  userId: string;
  authToken?: string;
  className?: string;
}

interface StatItemProps {
  label: string;
  userValue: number;
  avgValue: number;
  format?: (value: number) => string;
}

const StatItem = React.memo(function StatItem({ label, userValue, avgValue, format = (v) => v?.toFixed(1) ?? '0' }: StatItemProps) {
  const safeUserValue = userValue ?? 0;
  const safeAvgValue = avgValue ?? 0;
  const diff = safeUserValue - safeAvgValue;
  const percentDiff = safeAvgValue !== 0 ? (diff / safeAvgValue) * 100 : 0;
  const isBetter = diff > 0;
  const isNeutral = Math.abs(percentDiff) < 5;

  const Icon = isNeutral ? Minus : isBetter ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? 'text-gray-500'
    : isBetter
    ? 'text-green-600'
    : 'text-red-600';
  const bgClass = isNeutral
    ? 'bg-gray-50'
    : isBetter
    ? 'bg-green-50'
    : 'bg-red-50';

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{format(safeUserValue)}</div>
          <div className="text-xs text-gray-500">Moyenne: {format(safeAvgValue)}</div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bgClass}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span className={`text-sm font-semibold ${colorClass}`}>
            {Math.abs(percentDiff).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
});

const ComparisonCard = React.memo(function ComparisonCard({
  userId,
  authToken,
  className = '',
}: ComparisonCardProps) {
  const [data, setData] = useState<ComparisonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await StatsRepository.getComparisonStats(userId, authToken);
        setData(stats);
      } catch (err) {
        console.error('Error fetching comparison stats:', err);
        setError('Impossible de charger les comparaisons');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authToken]);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton variant="text" width="50%" height="24px" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <Skeleton variant="text" width="60%" height="14px" className="mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton variant="text" width="80px" height="32px" className="mb-1" />
                  <Skeleton variant="text" width="100px" height="12px" />
                </div>
                <Skeleton variant="circular" width="48px" height="32px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Comparaison avec la Moyenne</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatItem
          label="Total de Paris"
          userValue={data.user.totalBets}
          avgValue={data.average.totalBets}
          format={(v) => (v ?? 0).toFixed(0)}
        />
        <StatItem
          label="Taux de Victoire"
          userValue={data.user.winRate}
          avgValue={data.average.winRate}
          format={(v) => `${(v ?? 0).toFixed(1)}%`}
        />
        <StatItem
          label="Points Moyens par Pari"
          userValue={data.user.avgPointsPerBet}
          avgValue={data.average.avgPointsPerBet}
          format={(v) => (v ?? 0).toFixed(1)}
        />
        <StatItem
          label="XP Moyen par Jour"
          userValue={data.user.avgXPPerDay}
          avgValue={data.average.avgXPPerDay}
          format={(v) => (v ?? 0).toFixed(0)}
        />
      </div>
    </div>
  );
});

export default ComparisonCard;
