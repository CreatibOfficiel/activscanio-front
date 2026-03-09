"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { getSeasonEndDate } from "../tv/display/utils/deadlines";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "../context/AppContext";
import { RaceEvent } from "../models/RaceEvent";
import { getDateLabel } from "../utils/formatters";
import RaceCard from "../components/race/RaceCard";
import RacesStatsHeader from "../components/race/RacesStatsHeader";
import RaceFilters, { type FilterState } from "../components/race/RaceFilters";
import DateSeparator from "../components/race/DateSeparator";
import SkeletonRaceCard from "../components/race/SkeletonRaceCard";
import { Button, Countdown } from "../components/ui";
import { MdAdd, MdFlag } from "react-icons/md";
import { useRaceStats } from "../hooks/useRaceStats";
import { useInfiniteRaces } from "../hooks/useInfiniteRaces";
import { RacesRepository } from "../repositories/RacesRepository";

const racesRepo = new RacesRepository(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
);

const groupRacesByDate = (
  races: RaceEvent[],
  dateFormatter: (dateStr: string) => string
): Record<string, RaceEvent[]> => {
  const grouped: Record<string, RaceEvent[]> = {};

  races.forEach((race) => {
    const label = dateFormatter(race.date);
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(race);
  });

  return grouped;
};

const RacesPage: NextPage = () => {
  const { isLoading: isContextLoading, allCompetitors } = useContext(AppContext);
  const [raceCountStats, setRaceCountStats] = useState<{ total: number; weekly: number } | undefined>(undefined);
  const [filters, setFilters] = useState<FilterState>({
    period: "all",
    competitorId: null,
  });
  const seasonEndDate = useMemo(() => getSeasonEndDate(), []);

  // Fetch all-time stats for header
  useEffect(() => {
    racesRepo.fetchStats().then(setRaceCountStats).catch(() => {});
  }, []);

  // Infinite scroll
  const { races, total, isLoading, isLoadingMore, hasMore, loadMore } = useInfiniteRaces({
    period: filters.period,
    competitorId: filters.competitorId,
  });

  // Stats based on loaded races
  const raceStats = useRaceStats({
    races,
    competitors: allCompetitors,
  });

  // Intersection observer sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      sentinelRef.current = node;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasMore, isLoadingMore, loadMore]
  );

  // Group by date (races are already sorted DESC from backend)
  const racesByDate = useMemo(() => {
    return groupRacesByDate(races, getDateLabel);
  }, [races]);

  // Get ordered date labels
  const orderedDateLabels = useMemo(() => {
    const labelOrder = ["Aujourd'hui", "Hier", "Cette semaine"];
    const labels = Object.keys(racesByDate);

    return labels.sort((a, b) => {
      const indexA = labelOrder.indexOf(a);
      const indexB = labelOrder.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  }, [racesByDate]);

  if (isContextLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-center text-title mb-6">Courses</h1>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-neutral-800 rounded-xl p-3 border border-neutral-700 animate-pulse"
              >
                <div className="h-3 w-12 bg-neutral-700 rounded mb-2" />
                <div className="h-6 w-8 bg-neutral-700 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 space-y-3">
          <SkeletonRaceCard count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Stats Header */}
      <RacesStatsHeader stats={raceStats} totalRaces={raceCountStats?.total} weeklyRaces={raceCountStats?.weekly} />

      {/* Season countdown */}
      <div className="px-4 pb-3">
        <Countdown
          label="Fin de saison"
          targetDate={seasonEndDate}
          thresholds={{ warningSeconds: 259200, criticalSeconds: 86400 }}
          expiredLabel="Saison terminée"
        />
      </div>

      {/* Filters */}
      <RaceFilters
        competitors={allCompetitors}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Content */}
      {total === 0 && !isLoading ? (
        filters.period === "all" && !filters.competitorId ? (
          // Empty state - no races at all
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6">
              <Image
                src="/illustrations/empty-races.svg"
                alt="Aucune course"
                width={240}
                height={200}
                priority
              />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-heading text-white mb-2">
                Prêt pour la course ?
              </h2>
              <p className="text-regular text-neutral-400 mb-6">
                Aucune course n&apos;a encore été enregistrée.
                Créez votre première course et que la compétition commence !
              </p>
              <Link href="/races/add">
                <Button variant="primary" className="gap-2">
                  <MdFlag className="text-lg" />
                  Ajouter une course
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          // Empty state - no races matching filters
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
              <MdFlag className="text-4xl text-neutral-600" />
            </div>
            <h2 className="text-heading text-white mb-2">Aucun résultat</h2>
            <p className="text-regular text-neutral-400 text-center max-w-sm">
              Aucune course ne correspond à vos filtres.
              Essayez de modifier vos critères de recherche.
            </p>
            <button
              onClick={() => setFilters({ period: "all", competitorId: null })}
              className="mt-4 px-4 py-2 text-primary-500 text-regular hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )
      ) : (
        // Race list grouped by date
        <div className="pb-4">
          {orderedDateLabels.map((dateLabel) => (
            <section key={dateLabel}>
              <DateSeparator label={dateLabel} count={racesByDate[dateLabel].length} />
              <div className="space-y-3 px-4">
                {racesByDate[dateLabel].map((race) => (
                  <RaceCard key={race.id} race={race} />
                ))}
              </div>
            </section>
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelCallback} className="px-4 pt-4 space-y-3">
              {isLoadingMore && <SkeletonRaceCard count={3} />}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button - Add Race */}
      {total > 0 && (
        <Link
          href="/races/add"
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary-500/20 backdrop-blur-xl border-2 border-primary-500/50 text-primary-400 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary-500/30 hover:border-primary-400 hover:text-primary-300 z-40 group"
          aria-label="Ajouter une course"
        >
          <div className="absolute inset-0 rounded-2xl bg-primary-500/10 blur-xl group-hover:bg-primary-500/20 transition-colors" />
          <MdAdd className="text-3xl relative z-10" />
        </Link>
      )}
    </div>
  );
};

export default RacesPage;
