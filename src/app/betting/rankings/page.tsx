"use client";

import { FC, useEffect, useState, useCallback } from 'react';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { BettorRanking } from '@/app/models/CompetitorOdds';
import { Card, Badge, PageHeader, UserAvatar } from '@/app/components/ui';
import { FlameIndicator } from '@/app/components/achievements';
import { getCurrentSeasonNumber, getSeasonLabel, TOTAL_SEASONS } from '@/app/utils/season-utils';
import { MdTrendingUp, MdChevronLeft, MdChevronRight } from 'react-icons/md';

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
                <div className="flex items-end justify-center gap-4 mb-4">
                  {/* 2nd place */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center flex-1">
                      <Badge variant="silver" size="lg" className="mb-2">
                        2ème
                      </Badge>
                      <Card
                        variant="default"
                        className="w-full p-4 bg-silver-500/10 border-silver-500"
                      >
                        <div className="text-center">
                          <UserAvatar src={topThree[1].profilePictureUrl} name={topThree[1].userName} size="xl" className="mx-auto mb-2" />
                          <h3 className="text-bold text-white mb-1">
                            {topThree[1].userName}
                          </h3>
                          <div className="flex items-center justify-center gap-1 text-silver-500 mb-2">
                            <MdTrendingUp />
                            <span className="text-statistic font-bold">
                              {topThree[1].totalPoints.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <FlameIndicator streak={topThree[1].currentMonthlyStreak} variant="compact" type="monthly" />
                            {topThree[1].currentWinStreak > 0 && (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{topThree[1].currentWinStreak}W</span>
                            )}
                          </div>
                        </div>
                      </Card>
                      <div className="w-full h-24 bg-silver-500/20 rounded-t-lg mt-2"></div>
                    </div>
                  )}

                  {/* 1st place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center flex-1">
                      <Badge variant="gold" size="lg" className="mb-2">
                        🏆 1er
                      </Badge>
                      <Card
                        variant="primary"
                        className="w-full p-4 bg-gold-500/10 border-gold-500"
                      >
                        <div className="text-center">
                          <UserAvatar src={topThree[0].profilePictureUrl} name={topThree[0].userName} size="2xl" className="mx-auto mb-2" />
                          <h3 className="text-heading text-white mb-1">
                            {topThree[0].userName}
                          </h3>
                          <div className="flex items-center justify-center gap-1 text-gold-500 mb-2">
                            <MdTrendingUp />
                            <span className="text-statistic font-bold text-2xl">
                              {topThree[0].totalPoints.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <FlameIndicator streak={topThree[0].currentMonthlyStreak} variant="compact" type="monthly" />
                            {topThree[0].currentWinStreak > 0 && (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{topThree[0].currentWinStreak}W</span>
                            )}
                          </div>
                        </div>
                      </Card>
                      <div className="w-full h-32 bg-gold-500/20 rounded-t-lg mt-2"></div>
                    </div>
                  )}

                  {/* 3rd place */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center flex-1">
                      <Badge variant="bronze" size="lg" className="mb-2">
                        3ème
                      </Badge>
                      <Card
                        variant="default"
                        className="w-full p-4 bg-bronze-500/10 border-bronze-500"
                      >
                        <div className="text-center">
                          <UserAvatar src={topThree[2].profilePictureUrl} name={topThree[2].userName} size="xl" className="mx-auto mb-2" />
                          <h3 className="text-bold text-white mb-1">
                            {topThree[2].userName}
                          </h3>
                          <div className="flex items-center justify-center gap-1 text-bronze-500 mb-2">
                            <MdTrendingUp />
                            <span className="text-statistic font-bold">
                              {topThree[2].totalPoints.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <FlameIndicator streak={topThree[2].currentMonthlyStreak} variant="compact" type="monthly" />
                            {topThree[2].currentWinStreak > 0 && (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{topThree[2].currentWinStreak}W</span>
                            )}
                          </div>
                        </div>
                      </Card>
                      <div className="w-full h-16 bg-bronze-500/20 rounded-t-lg mt-2"></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other rankings */}
            {others.length > 0 && (
              <div>
                <h2 className="text-heading text-white mb-4">Autres classés</h2>
                <div className="space-y-2">
                  {others.map((ranking) => (
                    <Card key={ranking.userId} className="p-4" hover>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="default" size="md">
                            #{ranking.rank}
                          </Badge>
                          <UserAvatar src={ranking.profilePictureUrl} name={ranking.userName} size="lg" />
                          <div>
                            <h3 className="text-bold text-white">
                              {ranking.userName}
                            </h3>
                            <p className="text-sub text-neutral-500">
                              {getSeasonLabel(selectedSeason)} {selectedYear}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <FlameIndicator
                              streak={ranking.currentMonthlyStreak}
                              variant="compact"
                              type="monthly"
                            />
                            {ranking.currentWinStreak > 0 && (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{ranking.currentWinStreak}W</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-primary-500">
                              <MdTrendingUp />
                              <span className="text-statistic font-bold">
                                {ranking.totalPoints.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-sub text-neutral-500">points</p>
                          </div>
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
