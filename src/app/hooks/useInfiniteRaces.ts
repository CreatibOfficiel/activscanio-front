"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RaceEvent } from "@/app/models/RaceEvent";
import { RacesRepository } from "@/app/repositories/RacesRepository";

const racesRepo = new RacesRepository(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
);

const PAGE_SIZE = 20;

type PeriodFilter = "all" | "today" | "week" | "season";

interface UseInfiniteRacesOptions {
  period: PeriodFilter;
  competitorId: string | null;
}

interface UseInfiniteRacesResult {
  races: RaceEvent[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useInfiniteRaces({
  period,
  competitorId,
}: UseInfiniteRacesOptions): UseInfiniteRacesResult {
  const [races, setRaces] = useState<RaceEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // Track the current filter key to discard stale responses
  const filterKeyRef = useRef("");

  const getFilterKey = useCallback(
    () => `${period}|${competitorId ?? ""}`,
    [period, competitorId]
  );

  // Reset and load first page when filters change
  useEffect(() => {
    const key = getFilterKey();
    filterKeyRef.current = key;
    setRaces([]);
    setCursor(null);
    setHasMore(false);
    setIsLoading(true);

    const apiPeriod = period === "all" ? undefined : period === "season" ? "season" : period;

    racesRepo
      .fetchPaginated({
        limit: PAGE_SIZE,
        period: apiPeriod,
        competitorId: competitorId ?? undefined,
      })
      .then((data) => {
        if (filterKeyRef.current !== key) return; // stale
        setRaces(data.races);
        setTotal(data.total);
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      })
      .catch((err) => {
        console.error("Failed to load races:", err);
      })
      .finally(() => {
        if (filterKeyRef.current === key) {
          setIsLoading(false);
        }
      });
  }, [period, competitorId, getFilterKey]);

  const loadMore = useCallback(() => {
    if (!cursor || isLoadingMore) return;

    const key = getFilterKey();
    setIsLoadingMore(true);

    const apiPeriod = period === "all" ? undefined : period === "season" ? "season" : period;

    racesRepo
      .fetchPaginated({
        limit: PAGE_SIZE,
        cursor,
        period: apiPeriod,
        competitorId: competitorId ?? undefined,
      })
      .then((data) => {
        if (filterKeyRef.current !== key) return;
        setRaces((prev) => [...prev, ...data.races]);
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      })
      .catch((err) => {
        console.error("Failed to load more races:", err);
      })
      .finally(() => {
        if (filterKeyRef.current === key) {
          setIsLoadingMore(false);
        }
      });
  }, [cursor, isLoadingMore, period, competitorId, getFilterKey]);

  return { races, total, isLoading, isLoadingMore, hasMore, loadMore };
}
