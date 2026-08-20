"use client";

import { useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "../../context/AppContext";
import { RaceEvent } from "../../models/RaceEvent";
import { getDateLabel } from "../../utils/formatters";
import RaceCard from "./RaceCard";
import RacesStatsHeader from "./RacesStatsHeader";
import RaceFilters, { type FilterState } from "./RaceFilters";
import DateSeparator from "./DateSeparator";
import SkeletonRaceCard from "./SkeletonRaceCard";
import { Button, Countdown } from "../ui";
import { MdFlag } from "react-icons/md";
import { getSeasonEndDate } from "../../tv/display/utils/deadlines";
import { useInfiniteRaces } from "../../hooks/useInfiniteRaces";
import { authenticatedFetch } from "../../utils/authenticated-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

interface RaceHistoryProps {
  /**
   * Rendered once the list has at least one race, below the cards.
   *
   * The add control is the one thing the two entry points place differently:
   * `/races` has the screen to itself, the board renders this inside a tab
   * panel with the bar's own add button already on screen. Passing it in keeps
   * the `total > 0` gate in one place — here, where `total` is known — without
   * this component having an opinion about which control belongs on which
   * screen.
   */
  renderAddControl?: () => React.ReactNode;
  /** Suppresses the season countdown where the surrounding page shows one. */
  showCountdown?: boolean;
}

/**
 * The Mario Kart race history: filters, date-grouped cards, infinite scroll.
 *
 * Extracted verbatim from `/races` when the nav collapsed to one tab per
 * sport. The board at `/` now carries the same ranking/history selector the
 * ping-pong board has, so this had to render both inside a tab panel and as a
 * standalone page. Copying it would mean maintaining 474 races' worth of
 * pagination twice.
 *
 * The extraction was mechanical because the page owned no route state: no
 * params, no `useSearchParams`, no scroll restoration. Local filter state, the
 * paginated hook and a header-stats fetch, all moved unchanged.
 *
 * THE SENTINEL IS A CALLBACK REF, which is what makes it safe inside a tab
 * panel. The panel is conditionally rendered, so switching to the ranking
 * unmounts the sentinel and switching back mounts a new node. React calls the
 * callback with each new node, so the observer disconnects and re-attaches to
 * whatever is actually in the document. Written the other obvious way —
 * `useRef` plus `useEffect(..., [])` — it would observe a node from the first
 * mount and silently never fire again after a tab switch: the list would just
 * stop loading at race 20, with no error to notice.
 */
export default function RaceHistory({
  renderAddControl,
  showCountdown = true,
}: RaceHistoryProps) {
  const { isLoading: isContextLoading, allCompetitors } = useContext(AppContext);
  const { getToken } = useAuth();
  const [headerStats, setHeaderStats] = useState<{
    total: number;
    weekly: number;
    mostActive: { firstName: string; lastName: string; profilePictureUrl: string; raceCount: number } | null;
  } | undefined>(undefined);
  const [filters, setFilters] = useState<FilterState>({
    period: "all",
    competitorId: null,
  });
  const seasonEndDate = useMemo(() => getSeasonEndDate(), []);

  // Fetch all-time stats for header
  useEffect(() => {
    authenticatedFetch(getToken, `${API_URL}/races/count`)
      .then((res) => (res.ok ? res.json() : { total: 0, weekly: 0, mostActive: null }))
      .then(setHeaderStats)
      .catch(() => {});
  }, [getToken]);

  // Infinite scroll
  const { races, total, isLoading, isLoadingMore, hasMore, loadMore } = useInfiniteRaces({
    period: filters.period,
    competitorId: filters.competitorId,
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
    const labelOrder = [
      "Aujourd'hui",
      "Hier",
      "Cette semaine",
      "Semaine dernière",
    ];
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

  // Gated on the race load ALONE, deliberately. `AppContext.isLoading` covers
  // three parallel requests — competitors, recent races, base characters — and
  // stays true until the slowest answers. This component reads exactly one
  // thing from that context (`allCompetitors`, for the filter dropdown) and
  // gets its cards from `useInfiniteRaces`, so waiting on the context held the
  // whole list behind two requests it never uses.
  //
  // The competitor filter absorbs the difference on its own: it renders with
  // an empty list, at full size, and re-renders with the names once the
  // context settles. See the `competitorsLoading` note below.
  if (isLoading) {
    return (
      <div>
        <div className="px-4 pt-6 pb-4">
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
    <div>
      {/* Stats Header */}
      <RacesStatsHeader totalRaces={headerStats?.total} weeklyRaces={headerStats?.weekly} mostActive={headerStats?.mostActive} />

      {/* Season countdown. Suppressed on the board, which already shows one
          above the podium — two countdowns to the same instant on one screen
          invites the reader to check whether they disagree. */}
      {showCountdown && (
        <div className="px-4 pb-3">
          <Countdown
            label="Fin de saison"
            targetDate={seasonEndDate}
            thresholds={{ warningSeconds: 259200, criticalSeconds: 86400 }}
            expiredLabel="Saison terminée"
          />
        </div>
      )}

      {/* Filters.

          `competitorsLoading` is what lets the cards render ahead of the
          context. The strip keeps its exact geometry either way — the period
          chips are static, and the player button is sized by its padding, not
          its contents — so the names arriving late swap a label without moving
          a pixel. Without the flag the dropdown would open onto "Tous les
          joueurs" and nothing else, which reads as "this league has no
          players" rather than "still loading".

          A filter already chosen survives the wait: `filters` is local state,
          untouched by the context, and `useInfiniteRaces` queries by
          `competitorId` rather than by any object looked up in
          `allCompetitors`. The list stays correctly filtered while the button
          is still resolving the name to show for it. */}
      <RaceFilters
        competitors={allCompetitors}
        competitorsLoading={isContextLoading && allCompetitors.length === 0}
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

      {/* Still gated on total > 0: with no races the empty state's own call to
          action is a few pixels away, and two identical prompts on one screen
          is one too many. Where the control actually goes is the caller's
          business. */}
      {total > 0 && renderAddControl?.()}
    </div>
  );
}
