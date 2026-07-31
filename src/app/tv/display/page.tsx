"use client";

import { FC, useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SeasonsRepository,
  SeasonArchive,
} from "@/app/repositories/SeasonsRepository";
import { CompetitorsRepository } from "@/app/repositories/CompetitorsRepository";
import { CompetitorRankingsView } from "./components/CompetitorRankingsView";
import { ArchivedSeasonsView } from "./components/ArchivedSeasonsView";
import TVProgressBar from "./components/TVProgressBar";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import { Competitor } from "@/app/models/Competitor";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

enum DisplayView {
  COMPETITOR_RANKINGS = "competitors",
  ARCHIVED_SEASONS = "seasons",
}

const DEFAULT_ROTATION_INTERVAL = 15000; // 15 seconds default
const REFRESH_INTERVAL = 300000; // 5 minutes

interface TVDisplayData {
  competitorRankings: Competitor[];
  archivedSeasons: SeasonArchive[];
}

const ALL_VIEWS = [DisplayView.COMPETITOR_RANKINGS];

const viewLabels: Record<DisplayView, string> = {
  [DisplayView.COMPETITOR_RANKINGS]: "Pilotes",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons",
};

const viewTitles: Record<DisplayView, string> = {
  [DisplayView.COMPETITOR_RANKINGS]: "Classement des pilotes",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons archivées",
};

// Inner component that uses useSearchParams
const TVDisplayContent: FC = () => {
  const searchParams = useSearchParams();

  // Get interval from URL parameter (in seconds), default to 15
  const intervalParam = searchParams.get("interval");
  const rotationInterval = intervalParam
    ? parseInt(intervalParam, 10) * 1000
    : DEFAULT_ROTATION_INTERVAL;

  const [currentView, setCurrentView] = useState(DisplayView.COMPETITOR_RANKINGS);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [data, setData] = useState<TVDisplayData>({
    competitorRankings: [],
    archivedSeasons: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rotationKey, setRotationKey] = useState(0);
  // Each view provides its own scrollable ref (right column or single-column wrapper)
  const scrollRef = useRef<HTMLDivElement>(null);

  useAutoScroll(scrollRef, rotationKey, {
    delay: 5000,
    speed: 150,
    enabled: !isTransitioning,
  });

  // Compute active views (skip views with no data)
  const activeViews = useMemo(() => {
    return ALL_VIEWS.filter((view) => {
      switch (view) {
        case DisplayView.COMPETITOR_RANKINGS:
          return (
            data.competitorRankings.length > 0 &&
            data.competitorRankings.some((c) => c.raceCount && c.raceCount > 0)
          );
        case DisplayView.ARCHIVED_SEASONS:
          return data.archivedSeasons.length > 0;
        default:
          return true;
      }
    });
  }, [data.competitorRankings, data.archivedSeasons]);

  // If current view is no longer active (e.g. data disappeared after refresh), fallback
  useEffect(() => {
    if (activeViews.length > 0 && !activeViews.includes(currentView)) {
      setCurrentView(activeViews[0]);
    }
  }, [activeViews, currentView]);

  // Handle view transition
  const transitionToNextView = useCallback(() => {
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentView((prev) => {
        const currentIndex = activeViews.indexOf(prev);
        const nextIndex = (currentIndex + 1) % activeViews.length;
        return activeViews[nextIndex];
      });

      setTimeout(() => {
        setIsTransitioning(false);
        setRotationKey((k) => k + 1);
      }, 50);
    }, 300);
  }, [activeViews]);

  // Handle manual view selection (click on step indicator)
  const goToView = useCallback((view: DisplayView) => {
    if (view === currentView) return;
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentView(view);
      setTimeout(() => {
        setIsTransitioning(false);
        setRotationKey((k) => k + 1);
      }, 50);
    }, 300);
  }, [currentView]);

  // Automatic rotation (resets when rotationKey changes, e.g. manual navigation)
  useEffect(() => {
    const interval = setInterval(transitionToNextView, rotationInterval);
    return () => clearInterval(interval);
  }, [rotationInterval, transitionToNextView, rotationKey]);

  // Data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        const competitorsRepo = new CompetitorsRepository(API_BASE_URL);

        const [competitors, seasons] = await Promise.all([
          competitorsRepo.fetchCompetitors().catch(() => []),
          SeasonsRepository.getAllSeasons().catch(() => []),
        ]);

        setData({
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

  if (activeViews.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <p className="text-tv-heading text-neutral-400">
            Aucune donnée disponible pour le moment
          </p>
          <p className="text-tv-body text-neutral-500 mt-4">
            La page va se rafraîchir automatiquement...
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = activeViews.indexOf(currentView);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-slate-900 to-black text-neutral-100 p-2 lg:p-3 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1
            className={`text-tv-display font-bold transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"
              }`}
          >
            {viewTitles[currentView]}
          </h1>
          {lastUpdate && (
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Mis à jour à {lastUpdate.toLocaleTimeString("fr-FR")}
            </p>
          )}
        </div>

        {/* View indicators */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {activeViews.map((view) => (
              <button
                key={view}
                onClick={() => goToView(view)}
                className="flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <div
                  className={`h-2 w-10 rounded-full transition-all duration-300 ${currentView === view
                    ? "bg-primary-500 shadow-lg shadow-primary-500/30"
                    : "bg-neutral-700 hover:bg-neutral-600"
                    }`}
                  title={viewLabels[view]}
                />
                <span
                  className={`text-[8px] transition-colors ${currentView === view
                    ? "text-primary-400"
                    : "text-neutral-600"
                    }`}
                >
                  {viewLabels[view]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow overflow-hidden flex flex-col min-h-0">
        <div
          className={`flex-1 min-h-0 transition-all duration-300 ${isTransitioning
            ? "opacity-0 transform -translate-x-8"
            : "opacity-100 transform translate-x-0"
            }`}
        >
          {currentView === DisplayView.COMPETITOR_RANKINGS && (
            <CompetitorRankingsView rankings={data.competitorRankings} scrollRef={scrollRef} />
          )}
          {currentView === DisplayView.ARCHIVED_SEASONS && (
            <ArchivedSeasonsView seasons={data.archivedSeasons} scrollRef={scrollRef} />
          )}
        </div>
      </main>

      {/* Footer with progress bar */}
      <footer className="mt-2 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500">
            Vue suivante: {viewLabels[activeViews[(currentIndex + 1) % activeViews.length]]}
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
