"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "../context/AppContext";
import { RaceEvent } from "../models/RaceEvent";
import { getDateLabel } from "../utils/formatters";
import RaceCard from "../components/race/RaceCard";
import RacesStatsHeader from "../components/race/RacesStatsHeader";
import RaceFilters, { FilterState, PeriodFilter } from "../components/race/RaceFilters";
import DateSeparator from "../components/race/DateSeparator";
import SkeletonRaceCard from "../components/race/SkeletonRaceCard";
import { Button } from "../components/ui";
import { MdAdd, MdFlag } from "react-icons/md";
import { useRaceStats } from "../hooks/useRaceStats";

const sortRacesByDate = (races: RaceEvent[]): RaceEvent[] => {
  return [...races].sort(
    (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
  );
};

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

const filterRacesByPeriod = (races: RaceEvent[], period: PeriodFilter): RaceEvent[] => {
  if (period === "all") return races;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return races.filter((race) => {
    const raceDate = new Date(race.date);

    switch (period) {
      case "today":
        return raceDate >= todayStart;
      case "week": {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        return raceDate >= weekStart;
      }
      case "month": {
        const monthStart = new Date(todayStart);
        monthStart.setMonth(monthStart.getMonth() - 1);
        return raceDate >= monthStart;
      }
      default:
        return true;
    }
  });
};

const filterRacesByCompetitor = (races: RaceEvent[], competitorId: string | null): RaceEvent[] => {
  if (!competitorId) return races;

  return races.filter((race) =>
    race.results.some((result) => result.competitorId === competitorId)
  );
};

const RacesPage: NextPage = () => {
  const { isLoading, allRaces, allCompetitors } = useContext(AppContext);
  const [now, setNow] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    period: "all",
    competitorId: null,
  });

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Calculate stats
  const raceStats = useRaceStats({
    races: allRaces,
    competitors: allCompetitors,
  });

  // Filter and sort races
  const filteredRaces = useMemo(() => {
    let races = allRaces;
    races = filterRacesByPeriod(races, filters.period);
    races = filterRacesByCompetitor(races, filters.competitorId);
    return sortRacesByDate(races);
  }, [allRaces, filters]);

  // Group by date
  const racesByDate = useMemo(() => {
    return groupRacesByDate(filteredRaces, getDateLabel);
  }, [filteredRaces]);

  // Get ordered date labels
  const orderedDateLabels = useMemo(() => {
    // Define the order of labels
    const labelOrder = ["Aujourd'hui", "Hier", "Cette semaine"];
    const labels = Object.keys(racesByDate);

    return labels.sort((a, b) => {
      const indexA = labelOrder.indexOf(a);
      const indexB = labelOrder.indexOf(b);

      // If both are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only a is in the order array, it comes first
      if (indexA !== -1) return -1;
      // If only b is in the order array, it comes first
      if (indexB !== -1) return 1;
      // Otherwise, sort by date (newer first)
      return 0;
    });
  }, [racesByDate]);

  if (isLoading || !now) {
    return (
      <div className="min-h-screen bg-neutral-900 pb-24">
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
    <div className="min-h-screen bg-neutral-900 pb-24">
      {/* Stats Header */}
      <RacesStatsHeader stats={raceStats} />

      {/* Filters */}
      <RaceFilters
        competitors={allCompetitors}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Content */}
      {allRaces.length === 0 ? (
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
      ) : filteredRaces.length === 0 ? (
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
      ) : (
        // Race list grouped by date
        <div className="pb-4">
          {orderedDateLabels.map((dateLabel) => (
            <section key={dateLabel}>
              <DateSeparator label={dateLabel} count={racesByDate[dateLabel].length} />
              <div className="space-y-3 px-4">
                {racesByDate[dateLabel].map((race, index) => (
                  <RaceCard key={race.id} race={race} index={index} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Floating Action Button - Add Race */}
      {allRaces.length > 0 && (
        <Link
          href="/races/add"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-neutral-900 z-40"
          aria-label="Ajouter une course"
        >
          <MdAdd className="text-2xl" />
        </Link>
      )}
    </div>
  );
};

export default RacesPage;
