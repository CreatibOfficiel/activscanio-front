'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import Skeleton from '@/app/components/ui/Skeleton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * ELO history data point
 */
interface EloHistoryPoint {
  date: string;
  rating: number;
  rd: number;
  raceCount: number;
}

/**
 * Props for EloProgressChart component
 */
interface EloProgressChartProps {
  /** Competitor ID to fetch ELO history for */
  competitorId: string;
  /** Time period for the chart (default: '30d') */
  period?: '7d' | '30d' | '3m' | '1y';
  /** Optional authentication token */
  authToken?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EloProgressChart Component
 *
 * Displays a line chart showing ELO rating progression over time.
 * Features:
 * - Main line showing ELO rating
 * - Confidence band showing RD (rating deviation)
 * - Loading skeleton for better UX
 * - Optimized with React.memo and useMemo
 */
const EloProgressChart = React.memo(function EloProgressChart({
  competitorId,
  period = '30d',
  authToken,
  className = '',
}: EloProgressChartProps) {
  const [data, setData] = useState<EloHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate days based on period
  const days = useMemo(() => {
    switch (period) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '3m':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }, [period]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch ELO history from API
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `${API_BASE_URL}/competitors/${competitorId}/elo-history?days=${days}`,
          { headers }
        );

        if (!response.ok) {
          // If endpoint doesn't exist yet, show placeholder
          if (response.status === 404) {
            setData([]);
            return;
          }
          throw new Error('Erreur lors du chargement');
        }

        const historyData = await response.json();
        setData(historyData);
      } catch (err) {
        console.error('Error fetching ELO progress:', err);
        // Don't show error for missing endpoint - show placeholder instead
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitorId, days, authToken]);

  // Transform data for the chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
      rating: Math.round(point.rating),
      ratingMin: Math.round(point.rating - point.rd),
      ratingMax: Math.round(point.rating + point.rd),
      rd: Math.round(point.rd),
    }));
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
      <div className={`p-4 bg-red-900/20 border border-red-500/30 rounded-lg ${className}`}>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  // Show placeholder if no data available
  if (chartData.length === 0) {
    return (
      <div className={`p-8 text-center text-neutral-500 ${className}`}>
        <p className="mb-2">Pas assez de données pour afficher le graphique</p>
        <p className="text-sm text-neutral-600">
          Participez à plus de courses pour voir votre progression ELO
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#262626',
              border: '1px solid #404040',
              borderRadius: '8px',
            }}
            labelStyle={{ fontWeight: 'bold', color: '#fff' }}
            itemStyle={{ color: '#9ca3af' }}
            formatter={(value, name) => {
              if (name === 'rating') return [value, 'ELO'];
              if (name === 'rd') return [value, 'Déviation (RD)'];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ color: '#9ca3af' }}
            formatter={(value) => {
              if (value === 'rating') return 'Rating ELO';
              if (value === 'ratingMin') return 'Min (ELO - RD)';
              if (value === 'ratingMax') return 'Max (ELO + RD)';
              return value;
            }}
          />
          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="ratingMax"
            stroke="transparent"
            fill="#3b82f6"
            fillOpacity={0.1}
            name="ratingMax"
          />
          <Area
            type="monotone"
            dataKey="ratingMin"
            stroke="transparent"
            fill="#1e293b"
            fillOpacity={1}
            name="ratingMin"
          />
          {/* Main ELO line */}
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#3b82f6"
            strokeWidth={3}
            name="rating"
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#1e293b' }}
            activeDot={{ r: 6, fill: '#60a5fa', strokeWidth: 2, stroke: '#1e293b' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export default EloProgressChart;
