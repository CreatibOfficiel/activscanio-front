"use client";

import React, { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { AppContext } from "./AppContext";
import { queryKeys } from "../query/keys";
import { useCompetitorsQuery, useInvalidateCompetitors } from "../query/useCompetitors";
import { Competitor, UpdateCompetitorPayload } from "../models/Competitor";
import { RaceEvent } from "../models/RaceEvent";
import { RaceResult } from "../models/RaceResult";
import { BaseCharacter } from "../models/Character";
import { CompetitorsRepository } from "../repositories/CompetitorsRepository";
import { RacesRepository } from "../repositories/RacesRepository";
import {
  RaceAnalysisRepository,
  RaceAnalysisResult,
} from "../repositories/RaceAnalysisRepository";
import { CharactersRepository } from "../repositories/CharactersRepository";
import { del as idbDel } from "idb-keyval";
import { authenticatedFetch } from "../utils/authenticated-fetch";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const competitorsRepo = new CompetitorsRepository(baseUrl);
const racesRepo = new RacesRepository(baseUrl);
const raceAnalysisRepo = new RaceAnalysisRepository(baseUrl);
const charactersRepo = new CharactersRepository(baseUrl);

/** Stable identity, so consumers memoising on `allCompetitors` don't rerun
 *  every render while the query is still pending. */
const EMPTY_COMPETITORS: Competitor[] = [];

export function AppProvider({ children }: PropsWithChildren) {
  /* ───────── state ───────── */
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isLoadingRest, setIsLoadingRest] = useState(false);
  const [raceEvents, setRaceEvents] = useState<RaceEvent[]>([]);
  const [baseCharacters, setBaseCharacters] = useState<BaseCharacter[]>([]);

  /* ───────── competitors: owned by React Query ───────── */
  // Held in the query cache rather than local state so that the leaderboard
  // survives navigation, dedupes concurrent readers, and can be invalidated
  // from SocketWrapper without routing a callback through this provider.
  const competitorsQuery = useCompetitorsQuery();
  const competitors = competitorsQuery.data ?? EMPTY_COMPETITORS;
  const invalidateCompetitors = useInvalidateCompetitors();

  /** Write a single competitor back into the cached list. */
  const patchCompetitorInCache = useCallback(
    (updated: Competitor) => {
      queryClient.setQueryData<Competitor[]>(queryKeys.competitors, (prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
      );
    },
    [queryClient],
  );

  // `isLoading` keeps its old meaning for consumers: true while the initial
  // payload is still in flight. Competitors now report through the query.
  const isLoading = isLoadingRest || competitorsQuery.isPending;

  /* ───────── bootstrap ───────── */
  useEffect(() => {
    // Only load data when user is authenticated. Competitors are fetched by
    // the query above, so this only covers races and base characters.
    if (isLoaded && isSignedIn) {
      loadSecondaryData().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const loadSecondaryData = async (): Promise<[RaceEvent[], BaseCharacter[]]> => {
    try {
      setIsLoadingRest(true);

      const [racesRes, charsRes] = await Promise.all([
        authenticatedFetch(getToken, `${baseUrl}/races?recent=true`),
        authenticatedFetch(getToken, `${baseUrl}/base-characters`),
      ]);

      if (!racesRes.ok) throw new Error('Failed to fetch races');
      if (!charsRes.ok) throw new Error('Failed to fetch characters');

      const [remoteRaces, remoteBaseChars] = await Promise.all([
        racesRes.json(),
        charsRes.json(),
      ]);

      setRaceEvents(remoteRaces);
      setBaseCharacters(remoteBaseChars);
      return [remoteRaces, remoteBaseChars];
    } finally {
      setIsLoadingRest(false);
    }
  };

  /**
   * Kept for API compatibility: still returns the same tuple, but competitors
   * now come from the query cache (refetched here so the returned value is
   * fresh, as callers of the old version would expect).
   */
  const loadInitialData = async (): Promise<
    [Competitor[], RaceEvent[], BaseCharacter[]]
  > => {
    const [competitorsResult, secondary] = await Promise.all([
      competitorsQuery.refetch(),
      loadSecondaryData(),
    ]);
    return [competitorsResult.data ?? [], secondary[0], secondary[1]];
  };

  /* ───────── lightweight refresh ───────── */
  // Same signature as before (`() => Promise<void>`), but an invalidation:
  // React Query collapses concurrent calls into one request, which is what
  // makes a burst of socket events cost a single fetch instead of four.
  const refreshCompetitors = useCallback(async (): Promise<void> => {
    try {
      await invalidateCompetitors();
    } catch (err) {
      console.error('refreshCompetitors failed:', err);
    }
  }, [invalidateCompetitors]);

  /* ───────── characters helpers ───────── */
  const getCharacterVariants = (baseCharacterId: string) =>
    charactersRepo.fetchCharacterVariants(baseCharacterId);

  const getAvailableBaseCharacters = () =>
    charactersRepo.fetchAvailableBaseCharacters();

  const getAvailableVariantsForBaseCharacter = (bcId: string) =>
    charactersRepo.fetchAvailableVariantsForBaseCharacter(bcId);

  /* ───────── competitor CRUD ───────── */
  const addCompetitor = async (newCompetitor: Competitor) => {
    const token = await getToken();
    const created = await competitorsRepo.createCompetitor(newCompetitor, token!);
    queryClient.setQueryData<Competitor[]>(queryKeys.competitors, (prev) =>
      prev ? [...prev, created] : prev,
    );
    return created;
  };

  const getCompetitorById = (id: string) => {
    const competitor = competitors.find((c) => c.id === id);
    if (competitor) return Promise.resolve(competitor);
    return competitorsRepo.fetchCompetitorById(id);
  };

  const updateCompetitor = async (
    id: string,
    payload: UpdateCompetitorPayload
  ) => {
    const token = await getToken();
    const updated = await competitorsRepo.updateCompetitor(id, payload, token!);
    patchCompetitorInCache(updated);
    return updated;
  };

  const linkCharacterToCompetitor = async (
    competitorId: string,
    variantId: string
  ) => {
    const token = await getToken();
    const updated = await competitorsRepo.linkCharacterToCompetitor(
      competitorId,
      variantId,
      token!,
    );
    patchCompetitorInCache(updated);
    return updated;
  };

  const unlinkCharacterFromCompetitor = async (competitorId: string) => {
    const token = await getToken();
    const updated = await competitorsRepo.unlinkCharacterFromCompetitor(
      competitorId,
      token!,
    );
    patchCompetitorInCache(updated);
    return updated;
  };

  /* ───────── races ───────── */
  const addRaceEvent = async (results: RaceResult[]) => {
    const token = await getToken();
    const generatedId = Math.floor(Math.random() * 999_999).toString();
    const newEvent: RaceEvent = {
      id: generatedId,
      date: new Date().toISOString(),
      results,
    };
    const created = await racesRepo.createRace(newEvent, token!);
    await idbDel("raceImage");
    await idbDel("racePhotoTimestamp");
    setRaceEvents((prev) => [created, ...prev]);
    await refreshCompetitors();
    return created;
  };

  const getRaceById = useCallback(async (raceId: string) => {
    const token = await getToken();
    return racesRepo.fetchRaceById(raceId, token!);
  }, [getToken]);

  const getRecentRacesOfCompetitor = useCallback(async (competitorId: string) => {
    const token = await getToken();
    return racesRepo.fetchRecentRacesOfCompetitor(competitorId, undefined, token!);
  }, [getToken]);

  const getBestScoreOfCompetitor = useCallback(async (competitorId: string) => {
    return racesRepo.fetchBestScore(competitorId);
  }, []);

  const getSimilarRaces = useCallback(async (raceId: string) => {
    const token = await getToken();
    return racesRepo.fetchSimilarRaces(raceId, token!);
  }, [getToken]);

  /* ───────── image analyse ───────── */
  const analyzeRaceImage = async (
    image: File,
    competitorIds: string[]
  ): Promise<RaceAnalysisResult> => {
    const token = await getToken();
    return raceAnalysisRepo.uploadImageForAnalysis(image, competitorIds, token!);
  };

  /* ───────── context value ───────── */
  return (
    <AppContext.Provider
      value={{
        isLoading,
        allCompetitors: competitors,
        allRaces: raceEvents,
        baseCharacters,

        loadInitialData,
        refreshCompetitors,

        addCompetitor,
        getCompetitorById,
        updateCompetitor,
        linkCharacterToCompetitor,
        unlinkCharacterFromCompetitor,

        addRaceEvent,
        getRaceById,
        getRecentRacesOfCompetitor,
        getBestScoreOfCompetitor,
        getSimilarRaces,

        analyzeRaceImage,

        getCharacterVariants,
        getAvailableBaseCharacters,
        getAvailableVariantsForBaseCharacter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
