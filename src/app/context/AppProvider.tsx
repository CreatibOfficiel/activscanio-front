"use client";

import React, { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AppContext } from "./AppContext";
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

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

const competitorsRepo = new CompetitorsRepository(baseUrl);
const racesRepo = new RacesRepository(baseUrl);
const raceAnalysisRepo = new RaceAnalysisRepository(baseUrl);
const charactersRepo = new CharactersRepository(baseUrl);

export function AppProvider({ children }: PropsWithChildren) {
  /* ───────── state ───────── */
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [raceEvents, setRaceEvents] = useState<RaceEvent[]>([]);
  const [baseCharacters, setBaseCharacters] = useState<BaseCharacter[]>([]);

  /* ───────── bootstrap ───────── */
  useEffect(() => {
    // Only load data when user is authenticated
    if (isLoaded && isSignedIn) {
      loadInitialData().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const loadInitialData = async (): Promise<
    [Competitor[], RaceEvent[], BaseCharacter[]]
  > => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [competitorsRes, racesRes, charsRes] = await Promise.all([
        fetch(`${baseUrl}/competitors`, { headers }),
        fetch(`${baseUrl}/races?recent=true`, { headers }),
        fetch(`${baseUrl}/base-characters`, { headers }),
      ]);

      if (!competitorsRes.ok) throw new Error('Failed to fetch competitors');
      if (!racesRes.ok) throw new Error('Failed to fetch races');
      if (!charsRes.ok) throw new Error('Failed to fetch characters');

      const [remoteCompetitors, remoteRaces, remoteBaseChars] = await Promise.all([
        competitorsRes.json(),
        racesRes.json(),
        charsRes.json(),
      ]);

      setCompetitors(remoteCompetitors);
      setRaceEvents(remoteRaces);
      setBaseCharacters(remoteBaseChars);
      return [remoteCompetitors, remoteRaces, remoteBaseChars];
    } finally {
      setIsLoading(false);
    }
  };

  /* ───────── characters helpers ───────── */
  const getCharacterVariants = (baseCharacterId: string) =>
    charactersRepo.fetchCharacterVariants(baseCharacterId);

  const getAvailableBaseCharacters = () =>
    charactersRepo.fetchAvailableBaseCharacters();

  const getAvailableVariantsForBaseCharacter = (bcId: string) =>
    charactersRepo.fetchAvailableVariantsForBaseCharacter(bcId);

  /* ───────── competitor CRUD ───────── */
  const addCompetitor = async (newCompetitor: Competitor) => {
    const created = await competitorsRepo.createCompetitor(newCompetitor);
    setCompetitors((prev) => [...prev, created]);
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
    const updated = await competitorsRepo.updateCompetitor(id, payload);
    setCompetitors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    return updated;
  };

  const linkCharacterToCompetitor = async (
    competitorId: string,
    variantId: string
  ) => {
    const updated = await competitorsRepo.linkCharacterToCompetitor(
      competitorId,
      variantId
    );
    setCompetitors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    return updated;
  };

  const unlinkCharacterFromCompetitor = async (competitorId: string) => {
    const updated = await competitorsRepo.unlinkCharacterFromCompetitor(
      competitorId
    );
    setCompetitors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    return updated;
  };

  /* ───────── races ───────── */
  const addRaceEvent = async (results: RaceResult[]) => {
    const generatedId = Math.floor(Math.random() * 999_999).toString();
    const newEvent: RaceEvent = {
      id: generatedId,
      date: new Date().toISOString(),
      results,
    };
    const created = await racesRepo.createRace(newEvent);
    setRaceEvents((prev) => [created, ...prev]);
    await loadInitialData();
    return created;
  };

  const getRaceById = (raceId: string) => racesRepo.fetchRaceById(raceId);

  const getRecentRacesOfCompetitor = (competitorId: string) =>
    racesRepo.fetchRecentRacesOfCompetitor(competitorId);

  const getSimilarRaces = (raceId: string) =>
    racesRepo.fetchSimilarRaces(raceId);

  /* ───────── image analyse ───────── */
  const analyzeRaceImage = (
    image: File,
    competitorIds: string[]
  ): Promise<RaceAnalysisResult> =>
    raceAnalysisRepo.uploadImageForAnalysis(image, competitorIds);

  /* ───────── context value ───────── */
  return (
    <AppContext.Provider
      value={{
        isLoading,
        allCompetitors: competitors,
        allRaces: raceEvents,
        baseCharacters,

        loadInitialData,

        addCompetitor,
        getCompetitorById,
        updateCompetitor,
        linkCharacterToCompetitor,
        unlinkCharacterFromCompetitor,

        addRaceEvent,
        getRaceById,
        getRecentRacesOfCompetitor,
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
