"use client";

import { FC, useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BettingRepository } from "@/app/repositories/BettingRepository";
import {
  SeasonsRepository,
  SeasonArchive,
} from "@/app/repositories/SeasonsRepository";
import { CompetitorsRepository } from "@/app/repositories/CompetitorsRepository";
import { BettorRankingsView } from "./components/BettorRankingsView";
import { CompetitorRankingsView } from "./components/CompetitorRankingsView";
import { ArchivedSeasonsView } from "./components/ArchivedSeasonsView";
import TVProgressBar from "./components/TVProgressBar";
import { BettorRanking } from "@/app/models/CompetitorOdds";
import { Competitor } from "@/app/models/Competitor";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

enum DisplayView {
  BETTOR_RANKINGS = "bettors",
  COMPETITOR_RANKINGS = "competitors",
  ARCHIVED_SEASONS = "seasons",
}

const DEFAULT_ROTATION_INTERVAL = 15000; // 15 seconds default
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

const viewOrder = [
  DisplayView.BETTOR_RANKINGS,
  DisplayView.COMPETITOR_RANKINGS,
  DisplayView.ARCHIVED_SEASONS,
];

const viewLabels: Record<DisplayView, string> = {
  [DisplayView.BETTOR_RANKINGS]: "Parieurs",
  [DisplayView.COMPETITOR_RANKINGS]: "Coureurs",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons",
};

const viewTitles: Record<DisplayView, string> = {
  [DisplayView.BETTOR_RANKINGS]: "Classement des Parieurs",
  [DisplayView.COMPETITOR_RANKINGS]: "Classement des Coureurs",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons Archivées",
};

// Inner component that uses useSearchParams
const TVDisplayContent: FC = () => {
  const searchParams = useSearchParams();

  // Get interval from URL parameter (in seconds), default to 15
  const intervalParam = searchParams.get("interval");
  const rotationInterval = intervalParam
    ? parseInt(intervalParam, 10) * 1000
    : DEFAULT_ROTATION_INTERVAL;

  const [currentView, setCurrentView] = useState(DisplayView.BETTOR_RANKINGS);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [data, setData] = useState<TVDisplayData>({
    bettorRankings: null,
    competitorRankings: [],
    archivedSeasons: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rotationKey, setRotationKey] = useState(0);

  // Handle view transition
  const transitionToNextView = useCallback(() => {
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentView((prev) => {
        const currentIndex = viewOrder.indexOf(prev);
        const nextIndex = (currentIndex + 1) % viewOrder.length;
        return viewOrder[nextIndex];
      });

      setTimeout(() => {
        setIsTransitioning(false);
        setRotationKey((k) => k + 1);
      }, 50);
    }, 300);
  }, []);

  // Automatic rotation
  useEffect(() => {
    const interval = setInterval(transitionToNextView, rotationInterval);
    return () => clearInterval(interval);
  }, [rotationInterval, transitionToNextView]);

  // Data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const competitorsRepo = new CompetitorsRepository(API_BASE_URL);

        const [bettors, competitors, seasons] = await Promise.all([
          BettingRepository.getMonthlyRankings(currentMonth, currentYear).catch(
            () => null
          ),
          competitorsRepo.fetchCompetitors().catch(() => []),
          SeasonsRepository.getAllSeasons().catch(() => []),
        ]);

        setData({
          bettorRankings: bettors,
          competitorRankings: competitors,
          archivedSeasons: seasons,
        });
        setLastUpdate(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading TV display data:", error);
        setError("Erreur lors du chargement des données");
        setIsLoading(false);
      }
    };

    loadData();

    const refreshInterval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary-500 mx-auto mb-6"></div>
          <p className="text-tv-heading">Chargement des classements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <p className="text-tv-heading text-red-500 mb-4">{error}</p>
          <p className="text-tv-body text-neutral-400">
            La page va se rafraîchir automatiquement...
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = viewOrder.indexOf(currentView);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 lg:p-12 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1
            className={`text-tv-display font-bold transition-opacity duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            {viewTitles[currentView]}
          </h1>
          {lastUpdate && (
            <p className="text-base text-neutral-500 mt-2">
              Mis à jour à {lastUpdate.toLocaleTimeString("fr-FR")}
            </p>
          )}
        </div>

        {/* View indicators */}
        <div className="flex items-center gap-6">
          <div className="flex gap-3">
            {viewOrder.map((view) => (
              <div key={view} className="flex flex-col items-center gap-1">
                <div
                  className={`h-3 w-16 rounded-full transition-all duration-300 ${
                    currentView === view
                      ? "bg-primary-500 shadow-lg shadow-primary-500/30"
                      : "bg-neutral-700"
                  }`}
                  title={viewLabels[view]}
                />
                <span
                  className={`text-xs transition-colors ${
                    currentView === view
                      ? "text-primary-400"
                      : "text-neutral-600"
                  }`}
                >
                  {viewLabels[view]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div
          className={`transition-all duration-300 ${
            isTransitioning
              ? "opacity-0 transform -translate-x-8"
              : "opacity-100 transform translate-x-0"
          }`}
        >
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
      </main>

      {/* Footer with progress bar */}
      <footer className="mt-8 pt-6 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500">
            Vue suivante: {viewLabels[viewOrder[(currentIndex + 1) % viewOrder.length]]}
          </span>
          <span className="text-sm text-neutral-500">
            Rotation: {rotationInterval / 1000}s
          </span>
        </div>
        <TVProgressBar
          key={rotationKey}
          duration={rotationInterval}
          className="w-full"
        />
      </footer>
    </div>
  );
};

// Main page component with Suspense boundary
const TVDisplayPage: FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
          <div className="text-center text-neutral-100">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary-500 mx-auto mb-6"></div>
            <p className="text-tv-heading">Initialisation...</p>
          </div>
        </div>
      }
    >
      <TVDisplayContent />
    </Suspense>
  );
};

export default TVDisplayPage;
