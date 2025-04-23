"use client";

import React, {
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { AppContext } from "./AppContext";
import { Competitor } from "../models/Competitor";
import { RaceEvent } from "../models/RaceEvent";
import { RaceResult } from "../models/RaceResult";
import { RecentRaceInfo } from "../models/RecentRaceInfo";
import { BaseCharacter, CharacterVariant } from "../models/Character";
import { CompetitorsRepository } from "../repositories/CompetitorsRepository";
import { RacesRepository } from "../repositories/RacesRepository";
import {
  RaceAnalysisRepository,
  RaceAnalysisResult,
} from "../repositories/RaceAnalysisRepository";
import { CharactersRepository } from "../repositories/CharactersRepository";

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const competitorsRepo = new CompetitorsRepository(baseUrl);
const racesRepo = new RacesRepository(baseUrl);
const raceAnalysisRepo = new RaceAnalysisRepository(baseUrl);
const charactersRepo = new CharactersRepository(baseUrl);

export function AppProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [raceEvents, setRaceEvents] = useState<RaceEvent[]>([]);
  const [baseCharacters, setBaseCharacters] = useState<BaseCharacter[]>([]);

  useEffect(() => {
    loadInitialData().catch(console.error);
  }, []);

  const loadInitialData = async (): Promise<
    [Competitor[], RaceEvent[], BaseCharacter[]]
  > => {
    try {
      setIsLoading(true);
      const [remoteCompetitors, remoteRaces, remoteBaseChars] =
        await Promise.all([
          competitorsRepo.fetchCompetitors(),
          racesRepo.fetchRecentRaces(),
          charactersRepo.fetchBaseCharacters(),
        ]);

      setCompetitors(remoteCompetitors);
      setRaceEvents(remoteRaces);
      setBaseCharacters(remoteBaseChars);

      return [remoteCompetitors, remoteRaces, remoteBaseChars];
    } catch (err) {
      console.error("Error loading data:", err);
      return [[], [], []];
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterVariants = async (
    baseCharacterId: string
  ): Promise<CharacterVariant[]> => {
    try {
      return await charactersRepo.fetchCharacterVariants(baseCharacterId);
    } catch (err) {
      console.error("Error fetching character variants:", err);
      return [];
    }
  };

  const addCompetitor = async (
    newCompetitor: Competitor
  ): Promise<Competitor> => {
    try {
      const created = await competitorsRepo.createCompetitor(newCompetitor);
      setCompetitors((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("Error adding competitor:", err);
      throw err;
    }
  };

  const updateCompetitor = async (
    competitor: Competitor
  ): Promise<Competitor> => {
    try {
      const updated = await competitorsRepo.updateCompetitor(competitor);
      setCompetitors((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      return updated;
    } catch (err) {
      console.error("Error updating competitor:", err);
      throw err;
    }
  };

  const addRaceEvent = async (results: RaceResult[]): Promise<RaceEvent> => {
    const generatedId = Math.floor(Math.random() * 999999).toString();
    const newEvent: RaceEvent = {
      id: generatedId,
      date: new Date().toISOString(),
      results,
    };

    try {
      const createdRace = await racesRepo.createRace(newEvent);
      setRaceEvents((prev) => [createdRace, ...prev]);
      await loadInitialData();
      return createdRace;
    } catch (err) {
      console.error("Error saving race event:", err);
      throw err;
    }
  };

  const analyzeRaceImage = async (
    image: File,
    competitorIds: string[]
  ): Promise<RaceAnalysisResult> => {
    try {
      return await raceAnalysisRepo.uploadImageForAnalysis(
        image,
        competitorIds
      );
    } catch (err) {
      console.error("Error analyzing race image:", err);
      throw err;
    }
  };

  const getRaceById = async (raceId: string): Promise<RaceEvent> => {
    return racesRepo.fetchRaceById(raceId);
  };

  const getRecentRacesOfCompetitor = async (
    competitorId: string
  ): Promise<RecentRaceInfo[]> => {
    try {
      return await racesRepo.fetchRecentRacesOfCompetitor(competitorId);
    } catch (err) {
      console.error("Error fetching recent races of competitor:", err);
      return [];
    }
  };

  const getSimilarRaces = async (raceId: string): Promise<RaceEvent[]> => {
    try {
      return await racesRepo.fetchSimilarRaces(raceId);
    } catch (err) {
      console.error("Error fetching similar races:", err);
      return [];
    }
  };

  const getAvailableBaseCharacters = async (): Promise<BaseCharacter[]> => {
    try {
      const characters = await charactersRepo.fetchAvailableBaseCharacters();
      return characters;
    } catch (err) {
      console.error("Error fetching available base characters:", err);
      return [];
    }
  };

  const unlinkCharacterFromCompetitor = async (
    competitorId: string
  ): Promise<Competitor> => {
    try {
      const updatedCompetitor =
        await competitorsRepo.unlinkCharacterFromCompetitor(competitorId);
      setCompetitors((prev) =>
        prev.map((c) => (c.id === updatedCompetitor.id ? updatedCompetitor : c))
      );
      return updatedCompetitor;
    } catch (err) {
      console.error("Error unlinking character from competitor:", err);
      throw err;
    }
  };

  const getAvailableVariantsForBaseCharacter = async (baseCharacterId: string): Promise<CharacterVariant[]> => {
    console.log("Fetching available variants for base character:", baseCharacterId);
    try {
      return await charactersRepo.fetchAvailableVariantsForBaseCharacter(baseCharacterId);
    } catch (err) {
      console.error("Error fetching available variants for base character:", err);
      return [];
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        allCompetitors: competitors,
        allRaces: raceEvents,
        baseCharacters,
        loadInitialData,
        addCompetitor,
        updateCompetitor,
        addRaceEvent,
        analyzeRaceImage,
        getRaceById,
        getRecentRacesOfCompetitor,
        getSimilarRaces,
        getCharacterVariants,
        getAvailableBaseCharacters,
        unlinkCharacterFromCompetitor,
        getAvailableVariantsForBaseCharacter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
