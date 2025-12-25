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
  ReferenceLine,
} from 'recharts';
import { StatsRepository, WinRateTrendPoint } from '@/app/repositories/StatsRepository';
import Skeleton from '@/app/components/ui/Skeleton';

interface WinRateChartProps {
  userId: string;
  days?: number;
  authToken?: string;
  className?: string;
}

const WinRateChart = React.memo(function WinRateChart({
  userId,
  authToken,
  className = '',
}: WinRateChartProps) {
  const [data, setData] = useState<WinRateTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await StatsRepository.getAdvancedStats(userId, authToken);
        setData(stats.winRateTrend);
      } catch (err) {
        console.error('Error fetching win rate trend:', err);
        setError('Impossible de charger le taux de victoire');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authToken]);

  // Memoized chart data calculation
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
      winRate: Number(point.winRate.toFixed(1)),
      betsPlaced: point.betsPlaced,
      betsWon: point.betsWon,
    }));
  }, [data]);

  // Calculate average win rate (memoized)
  const avgWinRate = useMemo(() => {
    return data.length > 0
      ? data.reduce((sum, p) => sum + p.winRate, 0) / data.length
      : 0;
  }, [data]);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton variant="text" width="35%" height="24px" className="mb-4" />
        <div className="space-y-3">
          <Skeleton variant="rectangular" height="300px" />
          <div className="flex justify-center gap-4 mt-2">
            <Skeleton variant="text" width="140px" height="16px" />
          </div>
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

  if (chartData.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        Aucune donnée disponible pour cette période
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Taux de Victoire</h3>
        <div className="text-sm text-gray-600">
          Moyenne: <span className="font-semibold text-primary">{avgWinRate.toFixed(1)}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: '%', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            labelStyle={{ fontWeight: 'bold' }}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (value === undefined || name === undefined) return ['', ''];
              if (name === 'winRate') return [`${value}%`, 'Taux de victoire'];
              return [value, name];
            }}
          />
          <Legend />
          <ReferenceLine
            y={avgWinRate}
            stroke="#9ca3af"
            strokeDasharray="5 5"
            label={{ value: 'Moyenne', position: 'right', fill: '#6b7280' }}
          />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Taux de victoire"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default WinRateChart;
