import { RaceEvent } from "../models/RaceEvent";
import { RecentRaceInfo } from "../models/RecentRaceInfo";
import { RaceAnalysisResult } from "./RaceAnalysisRepository";
import { apiFetch } from '../utils/api-fetch';

export class RacesRepository {
  constructor(private baseUrl: string) {}

  // POST /races
  async createRace(race: RaceEvent): Promise<RaceEvent> {
    const res = await apiFetch(`${this.baseUrl}/races`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(race),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error creating race: ${errMsg}`);
    }
  }

  // GET /races?recent=true
  async fetchRecentRaces(): Promise<RaceEvent[]> {
    const res = await apiFetch(`${this.baseUrl}/races?recent=true`);
    if (res.ok) {
      const data = await res.json();
      return data.map((jsonObj: RaceEvent) => jsonObj as RaceEvent);
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching recent races: ${errMsg}`);
    }
  }

  // GET /competitors/:competitorId/recent-races
  async fetchRecentRacesOfCompetitor(
    competitorId: string,
    limit?: number
  ): Promise<RecentRaceInfo[]> {
    const url = new URL(
      `${this.baseUrl}/competitors/${competitorId}/recent-races`
    );
    if (limit !== undefined) {
      url.searchParams.set('limit', limit.toString());
    }
    const res = await apiFetch(url.toString());
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(
        `Error fetching recent races of competitor ${competitorId}: ${errMsg}`
      );
    }
  }

  // GET /races/:raceId/similar
  async fetchSimilarRaces(raceId: string): Promise<RaceEvent[]> {
    const res = await apiFetch(`${this.baseUrl}/races/${raceId}/similar`);
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching similar races for ${raceId}: ${errMsg}`);
    }
  }

  // GET /races/:raceId
  async fetchRaceById(raceId: string): Promise<RaceEvent> {
    const res = await apiFetch(`${this.baseUrl}/races/${raceId}`);
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching race ${raceId}: ${errMsg}`);
    }
  }

  // POST /races/analyze-photo
  async analyzePhoto(file: File): Promise<RaceAnalysisResult> {
    const url = `${this.baseUrl}/races/analyze-photo`;
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de l’analyse de la photo (${response.statusText})`
      );
    }

    return response.json();
  }
}
