"use client";

import { FC, useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SeasonsRepository } from "@/app/repositories/SeasonsRepository";
import { CompetitorsRepository } from "@/app/repositories/CompetitorsRepository";
import { pingpongRepository } from "@/app/repositories/PingpongRepository";
import { CompetitorRankingsView } from "./components/CompetitorRankingsView";
import { PingpongRankingsView } from "./components/PingpongRankingsView";
import { ArchivedSeasonsView } from "./components/ArchivedSeasonsView";
import TVProgressBar from "./components/TVProgressBar";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import {
  DisplayView,
  TVDisplayData,
  computeActiveViews,
  viewLabels,
  viewTitles,
} from "./active-views";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * 15 seconds per view.
 *
 * Above every pass-by signage recommendation, which lands at 8-12s. The
 * dwell is still fixed, but the scroll inside it is no longer: the interval
 * is handed to `useAutoScroll` as a budget, so a four-row board and a
 * thirty-five-row board both finish their pass within the same 15s rather
 * than the long one being yanked away mid-scroll.
 */
const DEFAULT_ROTATION_INTERVAL = 15000; // 15 seconds default
const REFRESH_INTERVAL = 300000; // 5 minutes

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
    pingpongPlayers: [],
    archivedSeasons: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rotationKey, setRotationKey] = useState(0);
  // Each view provides its own scrollable ref (right column or single-column wrapper)
  const scrollRef = useRef<HTMLDivElement>(null);

  // The dwell is the scroll's budget, not just the rotation timer: handing
  // `rotationInterval` to the hook is what lets a thirty-five-row board
  // reach its bottom before the view rotates, and what makes a longer
  // `?interval=` buy a gentler scroll instead of the same rushed one.
  useAutoScroll(scrollRef, rotationKey, {
    delay: 5000,
    budget: rotationInterval,
    enabled: !isTransitioning,
  });

  // Skip views with no data. The rule itself lives in ./active-views as a
  // pure function so it can be tested without mounting this page.
  const activeViews = useMemo(() => computeActiveViews(data), [data]);

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

        // Each call swallows its own failure, so one board being down
        // leaves the others on screen instead of blanking the whole wall.
        const [competitors, pingpong, seasons] = await Promise.all([
          competitorsRepo.fetchCompetitors().catch(() => []),
          pingpongRepository.fetchLeaderboard().catch(() => []),
          SeasonsRepository.getAllSeasons().catch(() => []),
        ]);

        setData({
          competitorRankings: competitors,
          pingpongPlayers: pingpong,
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

  /*
   * The root padding is the TV title-safe area, not decoration.
   *
   * Panels with overscan enabled crop the outer edge of the signal, and the
   * long-standing broadcast allowance is 5% per side: at 1920x1080 that is
   * 96px horizontal and 54px vertical. The previous `p-2 lg:p-3` (8-12px)
   * left the header, the view indicators and the footer inside the cropped
   * band, where an overscanning panel cuts them off the screen entirely.
   *
   * Expressed in vw/vh so it scales with the panel rather than assuming
   * 1080p, and floored with `max()` so a small browser window does not end
   * up with a hairline margin. Inline rather than a Tailwind class because
   * `max()` of two different units is not expressible in the arbitrary-value
   * syntax without escaping that reads worse than this.
   */
  return (
    <div
      className="h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-slate-900 to-black text-neutral-100 flex flex-col"
      style={{
        paddingInline: "max(0.75rem, 5vw)",
        paddingBlock: "max(0.5rem, 5vh)",
      }}
    >
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
          {/* `rotationKey` doubles as the view-entry signal: it increments
              when a board comes on screen and at no other time, so the rows
              animate on entry instead of replaying mid-dwell whenever a
              five-minute poll reorders them. */}
          {currentView === DisplayView.COMPETITOR_RANKINGS && (
            <CompetitorRankingsView
              rankings={data.competitorRankings}
              scrollRef={scrollRef}
              viewEntryKey={rotationKey}
            />
          )}
          {currentView === DisplayView.PINGPONG_RANKINGS && (
            <PingpongRankingsView
              players={data.pingpongPlayers}
              scrollRef={scrollRef}
              viewEntryKey={rotationKey}
            />
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
