"use client";

import { FC, useState } from 'react';
import type {
  SeasonArchive,
  ArchivedCompetitorRanking,
  ArchivedPingpongRanking,
} from '@/app/repositories/SeasonsRepository';
import { Card, Badge, Button, PageHeader } from '@/app/components/ui';
import { MdEmojiEvents, MdPerson, MdAutoAwesome } from 'react-icons/md';
import SeasonRecapModal from '@/app/components/season/SeasonRecapModal';

enum TabType {
  COMPETITORS = 'competitors',
  PINGPONG = 'pingpong',
}

interface SeasonDetailViewProps {
  year: number;
  month: number;
  season: SeasonArchive;
  competitorRankings: ArchivedCompetitorRanking[];
  pingpongRankings: ArchivedPingpongRanking[];
}

const getRankBadgeVariant = (rank: number | null) => {
  if (rank === null) return 'default';
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'default';
};

/**
 * Client half of the season detail page: the tab toggle and the recap modal.
 *
 * Every ranking arrives prefetched from the server component, so switching
 * tabs is a pure local state flip with no network round trip.
 */
const SeasonDetailView: FC<SeasonDetailViewProps> = ({
  year,
  month,
  season,
  competitorRankings,
  pingpongRankings,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.COMPETITORS);
  const [showRecap, setShowRecap] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          variant="detail"
          title={`Saison ${season.seasonNumber} - ${season.year}`}
          subtitle={season.seasonName || undefined}
          backHref="/seasons"
          rightAction={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecap(true)}
              >
                <MdAutoAwesome className="mr-1" />
                Récap
              </Button>
              <Badge variant="primary" size="lg">
                Saison {season.seasonNumber}
              </Badge>
            </div>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sub text-neutral-400 mb-1">
              {season.totalCompetitors === 1 ? 'Pilote' : 'Pilotes'}
            </p>
            <p className="text-statistic text-white">{season.totalCompetitors}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sub text-neutral-400 mb-1">
              {season.totalRaces === 1 ? 'Course' : 'Courses'}
            </p>
            <p className="text-statistic text-white">{season.totalRaces}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sub text-neutral-400 mb-1">
              {season.totalBets === 1 ? 'Pari' : 'Paris'}
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

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === TabType.COMPETITORS ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(TabType.COMPETITORS)}
          >
            <MdEmojiEvents className="mr-2" />
            Classement Pilotes ({competitorRankings.length})
          </Button>
          <Button
            variant={activeTab === TabType.PINGPONG ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(TabType.PINGPONG)}
          >
            <MdPerson className="mr-2" />
            Classement des pongistes ({pingpongRankings.length})
          </Button>
        </div>

        {activeTab === TabType.COMPETITORS && (
          <Card className="p-6">
            <h2 className="text-heading text-white mb-4">Classement des pilotes</h2>
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
                        {ranking.rank !== null ? `#${ranking.rank}` : 'Cal.'}
                      </Badge>
                      <div>
                        <p className="text-bold text-white">{ranking.competitorName}</p>
                        <p className="text-sub text-neutral-400">
                          {ranking.totalRaces} courses · Streak: {ranking.winStreak}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-bold text-primary-500">
                        {Math.round(ranking.finalRating - 2 * ranking.finalRd)}
                      </p>
                      <p className="text-sub text-neutral-400">ELO</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === TabType.PINGPONG && (
          <Card className="p-6">
            <h2 className="text-heading text-white mb-4">Classement des pongistes</h2>
            {pingpongRankings.length === 0 ? (
              <p className="text-regular text-neutral-400 text-center py-8">
                Personne n&apos;a joué au ping-pong cette saison
              </p>
            ) : (
              <div className="space-y-2">
                {pingpongRankings.map((ranking) => (
                  <div
                    key={ranking.id}
                    className="flex items-center justify-between p-4 bg-neutral-750 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant={getRankBadgeVariant(ranking.rank)} size="md">
                        {ranking.rank !== null ? `#${ranking.rank}` : 'Cal.'}
                      </Badge>
                      <div>
                        <p className="text-bold text-white">{ranking.playerName}</p>
                        <p className="text-sub text-neutral-400">
                          {ranking.wins}V · {ranking.losses}D · Série: {ranking.bestStreak}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-bold text-primary-500">
                        {Math.round(ranking.finalRating - 2 * ranking.finalRd)}
                      </p>
                      <p className="text-sub text-neutral-400">ELO</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {showRecap && (
          <SeasonRecapModal
            year={year}
            month={month}
            onClose={() => setShowRecap(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SeasonDetailView;
