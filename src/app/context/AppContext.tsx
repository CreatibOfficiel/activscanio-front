"use client";

import { createContext } from "react";
import { Competitor } from "../models/Competitor";
import { RaceEvent } from "../models/RaceEvent";
import { RaceResult } from "../models/RaceResult";
import { RecentRaceInfo } from "../models/RecentRaceInfo";

export interface AppContextType {
  isLoading: boolean;
  allCompetitors: Competitor[];
  allRaces: RaceEvent[];
  loadInitialData: () => Promise<void>;
  addCompetitor: (newCompetitor: Competitor) => Promise<void>;
  updateCompetitor: (competitor: Competitor) => Promise<void>;
  addRaceEvent: (results: RaceResult[]) => Promise<void>;
  analyzeRaceImage: (image: File, competitorIds: string[]) => Promise<any>;
  getRaceById: (raceId: string) => Promise<RaceEvent>;
  getRecentRacesOfCompetitor: (
    competitorId: string
  ) => Promise<RecentRaceInfo[]>;
  getSimilarRaces: (raceId: string) => Promise<RaceEvent[]>;
}

export const AppContext = createContext<AppContextType>({
  isLoading: false,
  allCompetitors: [],
  allRaces: [],
  loadInitialData: async () => {},
  addCompetitor: async () => {},
  updateCompetitor: async () => {},
  addRaceEvent: async () => {},
  analyzeRaceImage: async () => { throw new Error("Not implemented"); },
  getRaceById: async () => {
    throw new Error("Not implemented");
  },
  getRecentRacesOfCompetitor: async () => [],
  getSimilarRaces: async () => [],
});
