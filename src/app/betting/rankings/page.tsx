"use client";

import { FC, useEffect, useState, useCallback } from 'react';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { BettorRanking } from '@/app/models/CompetitorOdds';
import { Card, Badge, PageHeader, UserAvatar } from '@/app/components/ui';
import { FlameIndicator } from '@/app/components/achievements';
import { getCurrentSeasonNumber, getSeasonLabel, TOTAL_SEASONS } from '@/app/utils/season-utils';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const RankingsPage: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<BettorRanking[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeasonNumber());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadRankings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await BettingRepository.getMonthlyRankings(
        selectedSeason,
        selectedYear
      );
      setRankings(data.rankings);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading rankings:', err);
      setError('Erreur lors du chargement des classements.');
      setIsLoading(false);
    }
  }, [selectedSeason, selectedYear]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const topThree = rankings.slice(0, 3);
  const others = rankings.slice(3);

  // Navigation between seasons
  const goToPreviousSeason = () => {
    if (selectedSeason === 1) {
      setSelectedSeason(TOTAL_SEASONS);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedSeason(selectedSeason - 1);
    }
  };

  const goToNextSeason = () => {
    const currentSeason = getCurrentSeasonNumber();
    const currentYear = new Date().getFullYear();
    const isCurrentSeason = selectedSeason === currentSeason && selectedYear === currentYear;
    if (isCurrentSeason) return; // Can't go to future

    if (selectedSeason === TOTAL_SEASONS) {
      setSelectedSeason(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedSeason(selectedSeason + 1);
    }
  };

  const isNextDisabled = () => {
    const currentSeason = getCurrentSeasonNumber();
    const currentYear = new Date().getFullYear();
    return selectedSeason === currentSeason && selectedYear === currentYear;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <Card variant="error" className="p-6 max-w-2xl mx-auto">
          <p className="text-regular">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          variant="detail"
          title="Classement des parieurs"
          backHref="/betting"
        />

        {/* Season/Year Selector - Below header */}
        <div className="flex items-center justify-center gap-2 mb-6 -mt-2">
          <button
            onClick={goToPreviousSeason}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
            aria-label="Saison precedente"
          >
            <MdChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full min-w-[180px] justify-center">
            <span className="text-white font-medium">
              {getSeasonLabel(selectedSeason)} {selectedYear}
            </span>
          </div>

          <button
            onClick={goToNextSeason}
            disabled={isNextDisabled()}
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 transition-colors ${
              isNextDisabled()
                ? 'text-neutral-600 cursor-not-allowed'
                : 'text-neutral-400 hover:text-white hover:border-neutral-600'
            }`}
            aria-label="Saison suivante"
          >
            <MdChevronRight className="w-6 h-6" />
          </button>
        </div>

        {rankings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-regular text-neutral-400">
              Aucun classement disponible pour cette période.
            </p>
          </Card>
        ) : (
          <>
            {/* Podium */}
            {topThree.length > 0 && (
              <div className="mb-8">
                <div className="max-w-sm mx-auto grid grid-cols-3 items-end gap-2 px-2">
                  {/* 2nd place */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center mt-8">
                      <Card
                        variant="default"
                        className="max-w-[120px] mx-auto w-full p-3 bg-silver-500/10 border-silver-500"
                      >
                        <div className="text-center">
                          <span className="text-2xl">🥈</span>
                          <UserAvatar src={topThree[1].profilePictureUrl} name={topThree[1].userName} size="lg" className="mx-auto my-1.5" />
                          <h3 className="text-sm font-bold text-white truncate">
                            {topThree[1].firstName ?? topThree[1].userName}
                          </h3>
                          <span className="text-statistic font-bold text-silver-500">
                            {topThree[1].totalPoints.toFixed(1)}
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <FlameIndicator streak={topThree[1].currentMonthlyStreak} variant="compact" type="monthly" />
                            {topThree[1].currentWinStreak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">✅ {topThree[1].currentWinStreak}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* 1st place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center">
                      <Card
                        variant="primary"
                        className="max-w-[140px] mx-auto w-full p-3 bg-gold-500/10 border-gold-500"
                      >
                        <div className="text-center">
                          <span className="text-3xl">🏆</span>
                          <UserAvatar src={topThree[0].profilePictureUrl} name={topThree[0].userName} size="xl" className="mx-auto my-1.5" />
                          <h3 className="text-sm font-bold text-white truncate">
                            {topThree[0].firstName ?? topThree[0].userName}
                          </h3>
                          <span className="text-statistic font-bold text-2xl text-gold-500">
                            {topThree[0].totalPoints.toFixed(1)}
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <FlameIndicator streak={topThree[0].currentMonthlyStreak} variant="compact" type="monthly" />
                            {topThree[0].currentWinStreak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">✅ {topThree[0].currentWinStreak}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* 3rd place */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center mt-12">
                      <Card
                        variant="default"
                        className="max-w-[120px] mx-auto w-full p-3 bg-bronze-500/10 border-bronze-500"
                      >
                        <div className="text-center">
                          <span className="text-2xl">🥉</span>
                          <UserAvatar src={topThree[2].profilePictureUrl} name={topThree[2].userName} size="lg" className="mx-auto my-1.5" />
                          <h3 className="text-sm font-bold text-white truncate">
                            {topThree[2].firstName ?? topThree[2].userName}
                          </h3>
                          <span className="text-statistic font-bold text-bronze-500">
                            {topThree[2].totalPoints.toFixed(1)}
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <FlameIndicator streak={topThree[2].currentMonthlyStreak} variant="compact" type="monthly" />
                            {topThree[2].currentWinStreak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">✅ {topThree[2].currentWinStreak}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mb-6 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1">🔥 = série de paris</span>
              <span className="inline-flex items-center gap-1">✅ = victoires d&apos;affilée</span>
            </div>

            {/* Other rankings */}
            {others.length > 0 && (
              <div>
                <h2 className="text-heading text-white mb-4">Autres classés</h2>
                <div className="space-y-2">
                  {others.map((ranking) => (
                    <Card key={ranking.userId} className="p-3" hover>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Badge variant="default" size="md">
                            #{ranking.rank}
                          </Badge>
                          <UserAvatar src={ranking.profilePictureUrl} name={ranking.userName} size="md" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-bold text-white truncate">
                              {ranking.userName}
                            </h3>
                            <p className="text-sub text-neutral-500">
                              {ranking.betsPlaced} paris · {ranking.winRate}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1">
                            <FlameIndicator
                              streak={ranking.currentMonthlyStreak}
                              variant="compact"
                              type="monthly"
                            />
                            {ranking.currentWinStreak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">✅ {ranking.currentWinStreak}</span>
                            )}
                          </div>
                          <span className="text-statistic font-bold text-primary-500">
                            {ranking.totalPoints.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RankingsPage;
