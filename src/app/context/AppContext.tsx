"use client";

import { createContext } from "react";
import { Competitor } from "../models/Competitor";
import { RaceEvent } from "../models/RaceEvent";
import { RaceResult } from "../models/RaceResult";
import { RecentRaceInfo } from "../models/RecentRaceInfo";
import { BaseCharacter, CharacterVariant } from "../models/Character";
import { RaceAnalysisResult } from "../repositories/RaceAnalysisRepository";

export interface AppContextType {
  isLoading: boolean;
  allCompetitors: Competitor[];
  allRaces: RaceEvent[];
  baseCharacters: BaseCharacter[];
  loadInitialData: () => Promise<[Competitor[], RaceEvent[], BaseCharacter[]]>;
  addCompetitor: (newCompetitor: Competitor) => Promise<Competitor>;
  updateCompetitor: (competitor: Competitor) => Promise<Competitor>;
  addRaceEvent: (results: RaceResult[]) => Promise<RaceEvent>;
  analyzeRaceImage: (
    image: File,
    competitorIds: string[]
  ) => Promise<RaceAnalysisResult>;
  getRaceById: (raceId: string) => Promise<RaceEvent>;
  getRecentRacesOfCompetitor: (
    competitorId: string
  ) => Promise<RecentRaceInfo[]>;
  getSimilarRaces: (raceId: string) => Promise<RaceEvent[]>;
  getCharacterVariants: (
    baseCharacterId: string
  ) => Promise<CharacterVariant[]>;
  getAvailableBaseCharacters: () => Promise<BaseCharacter[]>;
  unlinkCharacterFromCompetitor: (competitorId: string) => Promise<Competitor>;
  getAvailableVariantsForBaseCharacter: (
    baseCharacterId: string
  ) => Promise<CharacterVariant[]>;
}

export const AppContext = createContext<AppContextType>({
  isLoading: false,
  allCompetitors: [],
  allRaces: [],
  baseCharacters: [],

  loadInitialData: async (): Promise<
    [Competitor[], RaceEvent[], BaseCharacter[]]
  > => {
    return [[], [], []];
  },
  addCompetitor: async (newCompetitor: Competitor): Promise<Competitor> => {
    return { ...newCompetitor, id: "default-id" };
  },
  updateCompetitor: async (competitor: Competitor): Promise<Competitor> => {
    return { ...competitor };
  },
  addRaceEvent: async (results: RaceResult[]): Promise<RaceEvent> => {
    return {
      id: "default-race-id",
      date: new Date().toISOString(),
      results,
    };
  },
  analyzeRaceImage: async (
    image: File,
    competitorIds: string[]
  ): Promise<RaceAnalysisResult> => {
    return {
      results: competitorIds.map((id, index) => ({
        competitorId: id,
        rank12: index + 1,
        score: Math.random() * 100,
      })),
    };
  },
  getRaceById: async (raceId: string): Promise<RaceEvent> => {
    return {
      id: raceId,
      date: new Date().toISOString(),
      results: [],
    };
  },
  getRecentRacesOfCompetitor: async (): Promise<RecentRaceInfo[]> => {
    return [];
  },
  getSimilarRaces: async (): Promise<RaceEvent[]> => {
    return [];
  },
  getCharacterVariants: async (): Promise<CharacterVariant[]> => {
    return [];
  },
  getAvailableBaseCharacters: async (): Promise<BaseCharacter[]> => {
    return [];
  },
  unlinkCharacterFromCompetitor: async (competitorId: string): Promise<Competitor> => {
    return { id: competitorId, firstName: "Competitor", lastName: "Name", profilePictureUrl: "" };
  },
  getAvailableVariantsForBaseCharacter: async (
    baseCharacterId: string
  ): Promise<CharacterVariant[]> => {
    return [];
  },
});
