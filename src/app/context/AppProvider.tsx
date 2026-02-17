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
import { del as idbDel } from "idb-keyval";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

  /* ───────── lightweight refresh ───────── */
  const refreshCompetitors = async (): Promise<void> => {
    try {
      const token = await getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const res = await fetch(`${baseUrl}/competitors`, { headers });
      if (!res.ok) throw new Error('Failed to fetch competitors');
      const data = await res.json();
      setCompetitors(data);
    } catch (err) {
      console.error('refreshCompetitors failed:', err);
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
    const token = await getToken();
    const created = await competitorsRepo.createCompetitor(newCompetitor, token!);
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
    const token = await getToken();
    const updated = await competitorsRepo.updateCompetitor(id, payload, token!);
    setCompetitors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
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
    setCompetitors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    return updated;
  };

  const unlinkCharacterFromCompetitor = async (competitorId: string) => {
    const token = await getToken();
    const updated = await competitorsRepo.unlinkCharacterFromCompetitor(
      competitorId,
      token!,
    );
    setCompetitors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
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
    setRaceEvents((prev) => [created, ...prev]);
    return created;
  };

  const getRaceById = async (raceId: string) => {
    const token = await getToken();
    return racesRepo.fetchRaceById(raceId, token!);
  };

  const getRecentRacesOfCompetitor = async (competitorId: string) => {
    const token = await getToken();
    return racesRepo.fetchRecentRacesOfCompetitor(competitorId, undefined, token!);
  };

  const getBestScoreOfCompetitor = async (competitorId: string) => {
    return racesRepo.fetchBestScore(competitorId);
  };

  const getSimilarRaces = async (raceId: string) => {
    const token = await getToken();
    return racesRepo.fetchSimilarRaces(raceId, token!);
  };

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
