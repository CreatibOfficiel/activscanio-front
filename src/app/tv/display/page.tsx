"use client";

import { FC, useEffect, useState } from 'react';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { SeasonsRepository, SeasonArchive } from '@/app/repositories/SeasonsRepository';
import { CompetitorsRepository } from '@/app/repositories/CompetitorsRepository';
import { BettorRankingsView } from './components/BettorRankingsView';
import { CompetitorRankingsView } from './components/CompetitorRankingsView';
import { ArchivedSeasonsView } from './components/ArchivedSeasonsView';
import { BettorRanking } from '@/app/models/CompetitorOdds';
import { Competitor } from '@/app/models/Competitor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

enum DisplayView {
  BETTOR_RANKINGS = 'bettors',
  COMPETITOR_RANKINGS = 'competitors',
  ARCHIVED_SEASONS = 'seasons',
}

const ROTATION_INTERVAL = 15000; // 15 secondes
const REFRESH_INTERVAL = 300000; // 5 minutes

interface TVDisplayData {
  bettorRankings: {
    month: number;
    year: number;
    count: number;
    rankings: BettorRanking[];
  } | null;
  competitorRankings: Competitor[];
  archivedSeasons: SeasonArchive[];
}

const TVDisplayPage: FC = () => {
  const [currentView, setCurrentView] = useState(DisplayView.BETTOR_RANKINGS);
  const [data, setData] = useState<TVDisplayData>({
    bettorRankings: null,
    competitorRankings: [],
    archivedSeasons: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rotation automatique des vues
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView((prev) => {
        if (prev === DisplayView.BETTOR_RANKINGS) return DisplayView.COMPETITOR_RANKINGS;
        if (prev === DisplayView.COMPETITOR_RANKINGS) return DisplayView.ARCHIVED_SEASONS;
        return DisplayView.BETTOR_RANKINGS;
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Chargement et rafraîchissement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();

        // Instancier le repository des compétiteurs
        const competitorsRepo = new CompetitorsRepository(API_BASE_URL);

        // Charger toutes les données en parallèle
        const [bettors, competitors, seasons] = await Promise.all([
          BettingRepository.getMonthlyRankings(currentMonth, currentYear).catch(() => null),
          competitorsRepo.fetchCompetitors().catch(() => []),
          SeasonsRepository.getAllSeasons().catch(() => []),
        ]);

        setData({
          bettorRankings: bettors,
          competitorRankings: competitors,
          archivedSeasons: seasons,
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading TV display data:', error);
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
      }
    };

    loadData();

    // Rafraîchir les données toutes les 5 minutes
    const refreshInterval = setInterval(loadData, REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-heading">Chargement des classements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <p className="text-heading text-red-500 mb-4">{error}</p>
          <p className="text-sub text-neutral-400">La page va se rafraîchir automatiquement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header avec indicateur de rotation */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-display font-bold">
            {currentView === DisplayView.BETTOR_RANKINGS && 'Classement des Parieurs'}
            {currentView === DisplayView.COMPETITOR_RANKINGS && 'Classement des Coureurs'}
            {currentView === DisplayView.ARCHIVED_SEASONS && 'Saisons Archivées'}
          </h1>

          {/* Indicateurs de vue active */}
          <div className="flex gap-2">
            {Object.values(DisplayView).map((view) => (
              <div
                key={view}
                className={`h-2 w-12 rounded-full transition-colors ${
                  currentView === view ? 'bg-primary-500' : 'bg-neutral-700'
                }`}
                title={
                  view === DisplayView.BETTOR_RANKINGS ? 'Parieurs' :
                  view === DisplayView.COMPETITOR_RANKINGS ? 'Coureurs' :
                  'Saisons'
                }
              />
            ))}
          </div>
        </div>

        {/* Contenu dynamique basé sur la vue actuelle */}
        <div className="animate-fadeIn">
          {currentView === DisplayView.BETTOR_RANKINGS && (
            <BettorRankingsView rankings={data.bettorRankings} />
          )}
          {currentView === DisplayView.COMPETITOR_RANKINGS && (
            <CompetitorRankingsView rankings={data.competitorRankings} />
          )}
          {currentView === DisplayView.ARCHIVED_SEASONS && (
            <ArchivedSeasonsView seasons={data.archivedSeasons} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TVDisplayPage;
