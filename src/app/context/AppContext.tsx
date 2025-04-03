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
  addRaceEvent: (results: RaceResult[]) => Promise<void>;
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
  addRaceEvent: async () => {},
  getRaceById: async () => {
    throw new Error("Not implemented");
  },
  getRecentRacesOfCompetitor: async () => [],
  getSimilarRaces: async () => [],
});
