"use client";

import { createContext, useContext } from "react";
import {
  Competitor,
  UpdateCompetitorPayload,
} from "../models/Competitor";
import { RaceEvent } from "../models/RaceEvent";
import { RaceResult } from "../models/RaceResult";
import { RecentRaceInfo } from "../models/RecentRaceInfo";
import { BaseCharacter, CharacterVariant } from "../models/Character";
import { RaceAnalysisResult } from "../repositories/RaceAnalysisRepository";

export interface AppContextType {
  /* ---- global ---- */
  isLoading: boolean;
  allCompetitors: Competitor[];
  allRaces: RaceEvent[];
  baseCharacters: BaseCharacter[];

  /* ---- loading ---- */
  loadInitialData: () => Promise<
    [Competitor[], RaceEvent[], BaseCharacter[]]
  >;

  /* ---- competitors ---- */
  addCompetitor: (newCompetitor: Competitor) => Promise<Competitor>;
  getCompetitorById: (id: string) => Promise<Competitor>;
  updateCompetitor: (
    id: string,
    payload: UpdateCompetitorPayload
  ) => Promise<Competitor>;
  linkCharacterToCompetitor: (
    competitorId: string,
    variantId: string
  ) => Promise<Competitor>;
  unlinkCharacterFromCompetitor: (competitorId: string) => Promise<Competitor>;

  /* ---- races ---- */
  addRaceEvent: (results: RaceResult[]) => Promise<RaceEvent>;
  getRaceById: (raceId: string) => Promise<RaceEvent>;
  getRecentRacesOfCompetitor: (
    competitorId: string
  ) => Promise<RecentRaceInfo[]>;
  getBestScoreOfCompetitor: (
    competitorId: string
  ) => Promise<{ bestScore: number | null }>;
  getSimilarRaces: (raceId: string) => Promise<RaceEvent[]>;

  /* ---- image analysis ---- */
  analyzeRaceImage: (
    image: File,
    competitorIds: string[]
  ) => Promise<RaceAnalysisResult>;

  /* ---- characters ---- */
  getCharacterVariants: (
    baseCharacterId: string
  ) => Promise<CharacterVariant[]>;
  getAvailableBaseCharacters: () => Promise<BaseCharacter[]>;
  getAvailableVariantsForBaseCharacter: (
    baseCharacterId: string
  ) => Promise<CharacterVariant[]>;
}

export const AppContext = createContext<AppContextType>({
  isLoading: false,
  allCompetitors: [],
  allRaces: [],
  baseCharacters: [],

  loadInitialData: async () => [[], [], []],

  addCompetitor: async (c) => ({ ...c, id: "tmp" }),
  getCompetitorById: async () => {
    throw new Error("getCompetitorById not initialised");
  },
  updateCompetitor: async () => {
    throw new Error("updateCompetitor not initialised");
  },
  linkCharacterToCompetitor: async () => {
    throw new Error("linkCharacterToCompetitor not initialised");
  },
  unlinkCharacterFromCompetitor: async () => {
    throw new Error("unlinkCharacterFromCompetitor not initialised");
  },

  addRaceEvent: async () => {
    throw new Error("addRaceEvent not initialised");
  },
  getRaceById: async () => {
    throw new Error("getRaceById not initialised");
  },
  getRecentRacesOfCompetitor: async () => [],
  getBestScoreOfCompetitor: async () => ({ bestScore: null }),
  getSimilarRaces: async () => [],

  analyzeRaceImage: async () => {
    throw new Error("analyzeRaceImage not initialised");
  },

  getCharacterVariants: async () => [],
  getAvailableBaseCharacters: async () => [],
  getAvailableVariantsForBaseCharacter: async () => [],
});

export const useApp = () => useContext(AppContext);