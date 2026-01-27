'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatsRepository, DailyStats } from '@/app/repositories/StatsRepository';
import Skeleton from '@/app/components/ui/Skeleton';

/**
 * Props for XPProgressChart component
 */
interface XPProgressChartProps {
  /** User ID to fetch XP history for */
  userId: string;
  /** Time period for the chart (default: '30d') */
  period?: '7d' | '30d' | '3m' | '1y';
  /** Optional authentication token */
  authToken?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * XPProgressChart Component
 *
 * Displays a line chart showing daily XP earned and cumulative XP over time.
 * Features:
 * - Dual-line chart (daily + cumulative XP)
 * - Configurable time periods (7d, 30d, 3m, 1y)
 * - Loading skeleton for better UX
 * - Optimized with React.memo and useMemo
 */
const XPProgressChart = React.memo(function XPProgressChart({
  userId,
  period = '30d',
  authToken,
  className = '',
}: XPProgressChartProps) {
  const [data, setData] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await StatsRepository.getStatsHistory(userId, period, authToken);
        setData(stats);
      } catch (err) {
        console.error('Error fetching XP progress:', err);
        setError('Impossible de charger les données XP');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, period, authToken]);

  // Calculate cumulative XP (memoized for performance)
  const chartData = useMemo(() => {
    return data.map((stat, index) => {
      const cumulativeXP = data
        .slice(0, index + 1)
        .reduce((sum, s) => sum + s.xpEarned, 0);

      return {
        date: new Date(stat.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        }),
        xp: stat.xpEarned,
        cumulativeXP,
      };
    });
  }, [data]);

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-3">
          <Skeleton variant="rectangular" height="300px" />
          <div className="flex justify-center gap-4 mt-2">
            <Skeleton variant="text" width="120px" height="16px" />
            <Skeleton variant="text" width="120px" height="16px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-error-500/10 border border-error-500/30 rounded-lg ${className}`}>
        <p className="text-error-400 text-sm">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`p-8 text-center text-neutral-500 ${className}`}>
        Aucune donnée disponible pour cette période
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="date"
            stroke="#a3a3a3"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#a3a3a3" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#262626',
              border: '1px solid #404040',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ fontWeight: 'bold', color: '#fff' }}
          />
          <Legend wrapperStyle={{ color: '#a3a3a3' }} />
          <Line
            type="monotone"
            dataKey="xp"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="XP quotidien"
            dot={{ r: 3, fill: '#8b5cf6' }}
            activeDot={{ r: 5, fill: '#8b5cf6' }}
          />
          <Line
            type="monotone"
            dataKey="cumulativeXP"
            stroke="#10b981"
            strokeWidth={2}
            name="XP cumulé"
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default XPProgressChart;
