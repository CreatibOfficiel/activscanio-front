"use client";

import { FC, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SeasonsRepository,
  SeasonArchive,
  ArchivedCompetitorRanking,
  ArchivedBettorRanking,
  SeasonBettingWeek,
} from '@/app/repositories/SeasonsRepository';
import { Card, Badge, Button, PageHeader } from '@/app/components/ui';
import {
  MdEmojiEvents,
  MdPerson,
  MdCalendarToday,
} from 'react-icons/md';
import { toast } from 'sonner';

enum TabType {
  COMPETITORS = 'competitors',
  BETTORS = 'bettors',
  WEEKS = 'weeks',
}

const SeasonDetailPage: FC = () => {
  const router = useRouter();
  const params = useParams();
  const year = parseInt(params.year as string);
  const month = parseInt(params.month as string);

  const [season, setSeason] = useState<SeasonArchive | null>(null);
  const [competitorRankings, setCompetitorRankings] = useState<ArchivedCompetitorRanking[]>([]);
  const [bettorRankings, setBettorRankings] = useState<ArchivedBettorRanking[]>([]);
  const [weeks, setWeeks] = useState<SeasonBettingWeek[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.COMPETITORS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        setIsLoading(true);

        // Load season info
        const seasonData = await SeasonsRepository.getSeason(year, month);
        setSeason(seasonData);

        // Load all data in parallel
        const [competitors, bettors, weeksData] = await Promise.all([
          SeasonsRepository.getCompetitorRankings(year, month),
          SeasonsRepository.getBettorRankings(year, month),
          SeasonsRepository.getSeasonWeeks(year, month),
        ]);

        setCompetitorRankings(competitors);
        setBettorRankings(bettors);
        setWeeks(weeksData);
      } catch (error) {
        console.error('Error loading season data:', error);
        toast.error('Erreur lors du chargement de la saison');
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonData();
  }, [year, month]);

  const getMonthName = (month: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement de la saison...</p>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-regular text-neutral-400">Saison introuvable</p>
          <Button variant="primary" onClick={() => router.push('/seasons')} className="mt-4">
            Retour aux saisons
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <PageHeader
          variant="detail"
          title={`${getMonthName(season.month)} ${season.year}`}
          subtitle={season.seasonName || undefined}
          backHref="/seasons"
          rightAction={
            <Badge variant="primary" size="lg">
              Saison {season.month}
            </Badge>
          }
        />

          {/* Season stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sub text-neutral-400 mb-1">
                {season.totalCompetitors === 1 ? "Pilote" : "Pilotes"}
              </p>
              <p className="text-statistic text-white">{season.totalCompetitors}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sub text-neutral-400 mb-1">
                {season.totalRaces === 1 ? "Course" : "Courses"}
              </p>
              <p className="text-statistic text-white">{season.totalRaces}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sub text-neutral-400 mb-1">
                {season.totalBets === 1 ? "Pari" : "Paris"}
              </p>
              <p className="text-statistic text-white">{season.totalBets}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sub text-neutral-400 mb-1">ELO moyen</p>
              <p className="text-statistic text-white">
                {Math.round(season.avgCompetitorRating)}
              </p>
            </Card>
          </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === TabType.COMPETITORS ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(TabType.COMPETITORS)}
          >
            <MdEmojiEvents className="mr-2" />
            Classement Compétiteurs ({competitorRankings.length})
          </Button>
          <Button
            variant={activeTab === TabType.BETTORS ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(TabType.BETTORS)}
          >
            <MdPerson className="mr-2" />
            Classement Parieurs ({bettorRankings.length})
          </Button>
          <Button
            variant={activeTab === TabType.WEEKS ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(TabType.WEEKS)}
          >
            <MdCalendarToday className="mr-2" />
            Semaines ({weeks.length})
          </Button>
        </div>

        {/* Content */}
        {activeTab === TabType.COMPETITORS && (
          <Card className="p-6">
            <h2 className="text-heading text-white mb-4">Classement des Compétiteurs</h2>
            {competitorRankings.length === 0 ? (
              <p className="text-regular text-neutral-400 text-center py-8">
                Aucun classement disponible
              </p>
            ) : (
              <div className="space-y-2">
                {competitorRankings.map((ranking) => (
                  <div
                    key={ranking.id}
                    className="flex items-center justify-between p-4 bg-neutral-750 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant={getRankBadgeVariant(ranking.rank)} size="md">
                        #{ranking.rank}
                      </Badge>
                      <div>
                        <p className="text-bold text-white">{ranking.competitorName}</p>
                        <p className="text-sub text-neutral-400">
                          {ranking.raceCount} courses · Streak: {ranking.winStreak}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-bold text-primary-500">
                        {Math.round(ranking.finalRating)}
                      </p>
                      <p className="text-sub text-neutral-400">
                        RD: {Math.round(ranking.finalRd)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === TabType.BETTORS && (
          <Card className="p-6">
            <h2 className="text-heading text-white mb-4">Classement des Parieurs</h2>
            {bettorRankings.length === 0 ? (
              <p className="text-regular text-neutral-400 text-center py-8">
                Aucun classement disponible
              </p>
            ) : (
              <div className="space-y-2">
                {bettorRankings.map((ranking) => (
                  <div
                    key={ranking.userId}
                    className="flex items-center justify-between p-4 bg-neutral-750 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant={getRankBadgeVariant(ranking.rank)} size="md">
                        #{ranking.rank}
                      </Badge>
                      <div>
                        <p className="text-bold text-white">{ranking.userName}</p>
                        <p className="text-sub text-neutral-400">
                          {ranking.betsPlaced} paris placés
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-bold text-primary-500">
                        {ranking.totalPoints.toFixed(2)} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === TabType.WEEKS && (
          <Card className="p-6">
            <h2 className="text-heading text-white mb-4">Semaines de Paris</h2>
            {weeks.length === 0 ? (
              <p className="text-regular text-neutral-400 text-center py-8">
                Aucune semaine disponible
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeks.map((week) => (
                  <Card key={week.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-bold text-white">
                        Semaine {week.weekNumber}
                      </h3>
                      <Badge
                        variant={week.status === 'finalized' ? 'success' : 'default'}
                        size="sm"
                      >
                        {week.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sub text-neutral-400">
                      <p>
                        {new Date(week.startDate).toLocaleDateString('fr-FR')} -{' '}
                        {new Date(week.endDate).toLocaleDateString('fr-FR')}
                      </p>
                      {week.finalizedAt && (
                        <p className="text-success-500">
                          Finalisée le{' '}
                          {new Date(week.finalizedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default SeasonDetailPage;
