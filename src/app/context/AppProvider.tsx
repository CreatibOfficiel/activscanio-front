"use client";

import React, { useState, useEffect, PropsWithChildren } from "react";
import { AppContext } from "./AppContext";
import { Competitor } from "../models/Competitor";
import { RaceEvent } from "../models/RaceEvent";
import { RaceResult } from "../models/RaceResult";
import { RecentRaceInfo } from "../models/RecentRaceInfo";
import { Character } from "../models/Character";
import { CompetitorsRepository } from "../repositories/CompetitorsRepository";
import { RacesRepository } from "../repositories/RacesRepository";
import { RaceAnalysisRepository } from "../repositories/RaceAnalysisRepository";
import { CharactersRepository } from "../repositories/CharactersRepository";

// We assume the base URL is in an environment variable
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Create the repository instances
const competitorsRepo = new CompetitorsRepository(baseUrl);
const racesRepo = new RacesRepository(baseUrl);
const raceAnalysisRepo = new RaceAnalysisRepository(baseUrl);
const charactersRepo = new CharactersRepository(baseUrl);

export function AppProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [raceEvents, setRaceEvents] = useState<RaceEvent[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);

  useEffect(() => {
    // On initial load, fetch data
    loadInitialData().catch(console.error);
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [remoteCompetitors, remoteRaces, remoteAvailableChars, remoteAllChars] = await Promise.all([
        competitorsRepo.fetchCompetitors(),
        racesRepo.fetchRecentRaces(),
        charactersRepo.fetchAvailableCharacters(),
        charactersRepo.fetchAllCharacters()
      ]);
      
      setCompetitors(remoteCompetitors);
      setRaceEvents(remoteRaces);
      setAvailableCharacters(remoteAvailableChars);
      setAllCharacters(remoteAllChars);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCompetitor = async (newCompetitor: Competitor) => {
    try {
      const created = await competitorsRepo.createCompetitor(newCompetitor);
      setCompetitors((prev) => [...prev, created]);
      
      // Refresh available characters after adding a competitor
      const updatedAvailableChars = await charactersRepo.fetchAvailableCharacters();
      setAvailableCharacters(updatedAvailableChars);
    } catch (err) {
      console.error("Error adding competitor:", err);
    }
  };

  const updateCompetitor = async (competitor: Competitor) => {
    try {
      const updated = await competitorsRepo.updateCompetitor(competitor);
      setCompetitors((prev) => 
        prev.map(c => c.id === updated.id ? updated : c)
      );
      
      // Refresh available characters after updating a competitor
      const updatedAvailableChars = await charactersRepo.fetchAvailableCharacters();
      setAvailableCharacters(updatedAvailableChars);
    } catch (err) {
      console.error("Error updating competitor:", err);
    }
  };

  const addRaceEvent = async (results: RaceResult[]) => {
    // We generate an ID client-side just as in the Flutter code (Random).
    const generatedId = Math.floor(Math.random() * 999999).toString();
    const newEvent: RaceEvent = {
      id: generatedId,
      date: new Date().toISOString(),
      results,
    };

    try {
      const createdRace = await racesRepo.createRace(newEvent);
      // Insert it at the beginning
      setRaceEvents((prev) => [createdRace, ...prev]);
      // Reload to update rank, etc if needed
      await loadInitialData();
    } catch (err) {
      console.error("Error saving race event:", err);
    }
  };

  const analyzeRaceImage = async (image: File, competitorIds: string[]) => {
    try {
      return await raceAnalysisRepo.uploadImageForAnalysis(image, competitorIds);
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

  return (
    <AppContext.Provider
      value={{
        isLoading,
        allCompetitors: competitors,
        allRaces: raceEvents,
        availableCharacters,
        allCharacters,
        loadInitialData,
        addCompetitor,
        updateCompetitor,
        addRaceEvent,
        analyzeRaceImage,
        getRaceById,
        getRecentRacesOfCompetitor,
        getSimilarRaces,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}