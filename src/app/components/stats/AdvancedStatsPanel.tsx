'use client';

import React, { useEffect, useState } from 'react';
import { StatsRepository, AdvancedStats } from '@/app/repositories/StatsRepository';
import { Calendar, Trophy, Target, TrendingUp } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';

interface AdvancedStatsPanelProps {
  userId: string;
  authToken?: string;
  className?: string;
}

const AdvancedStatsPanel = React.memo(function AdvancedStatsPanel({
  userId,
  authToken,
  className = '',
}: AdvancedStatsPanelProps) {
  const [data, setData] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await StatsRepository.getAdvancedStats(userId, authToken);
        setData(stats);
      } catch (err) {
        console.error('Error fetching advanced stats:', err);
        setError('Impossible de charger les statistiques avancées');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authToken]);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton variant="text" width="45%" height="24px" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton variant="circular" width="20px" height="20px" />
                <Skeleton variant="text" width="120px" height="16px" />
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" width="100%" height="20px" />
                <Skeleton variant="text" width="90%" height="20px" />
                <Skeleton variant="text" width="85%" height="20px" />
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

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Statistiques Avancées</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Day */}
        {data.bestDay && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Meilleur Jour</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Jour</span>
                <span className="font-semibold text-gray-900">{dayNames[data.bestDay.dayNumber]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux de victoire</span>
                <span className="font-semibold text-blue-600">{data.bestDay.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paris gagnés</span>
                <span className="text-sm text-gray-500">{data.bestDay.wins}/{data.bestDay.totalBets}</span>
              </div>
            </div>
          </div>
        )}

        {/* Betting Patterns */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Habitudes de Paris</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Paris/semaine</span>
              <span className="font-semibold text-gray-900">{data.patterns.averageBetsPerWeek.toFixed(1)}</span>
            </div>
            {data.patterns.mostActiveHour !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Heure favorite</span>
                <span className="font-semibold text-gray-900">{data.patterns.mostActiveHour}h</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Cotes moyennes</span>
              <span className="font-semibold text-purple-600">{data.patterns.avgOddsPlayed.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Position Preferences */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Positions Préférées</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">1ère place</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${data.patterns.preferredPositions.first}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                  {data.patterns.preferredPositions.first.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">2ème place</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${data.patterns.preferredPositions.second}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                  {data.patterns.preferredPositions.second.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">3ème place</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${data.patterns.preferredPositions.third}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                  {data.patterns.preferredPositions.third.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Competitors */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-gray-900">Competitors Favoris</h4>
          </div>
          <div className="space-y-2">
            {data.favoriteCompetitors.slice(0, 3).map((comp, idx) => (
              <div key={comp.competitorId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-gray-900 font-medium">{comp.competitorName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-yellow-600">
                    {comp.winRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">{comp.betCount} paris</div>
                </div>
              </div>
            ))}
            {data.favoriteCompetitors.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                Pas encore de données
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdvancedStatsPanel;
