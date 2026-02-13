import { RaceEvent } from "../models/RaceEvent";
import { RecentRaceInfo } from "../models/RecentRaceInfo";
import { apiFetch } from '../utils/api-fetch';

export class RacesRepository {
  constructor(private baseUrl: string) {}

  // POST /races
  async createRace(race: RaceEvent, authToken: string): Promise<RaceEvent> {
    const res = await apiFetch(`${this.baseUrl}/races`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
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
    limit?: number,
    authToken?: string
  ): Promise<RecentRaceInfo[]> {
    const url = new URL(
      `${this.baseUrl}/competitors/${competitorId}/recent-races`
    );
    if (limit !== undefined) {
      url.searchParams.set('limit', limit.toString());
    }
    const headers: HeadersInit = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const res = await apiFetch(url.toString(), { headers });
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(
        `Error fetching recent races of competitor ${competitorId}: ${errMsg}`
      );
    }
  }

  // GET /competitors/:competitorId/best-score
  async fetchBestScore(competitorId: string): Promise<{ bestScore: number | null }> {
    const res = await apiFetch(
      `${this.baseUrl}/competitors/${competitorId}/best-score`
    );
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(
        `Error fetching best score for competitor ${competitorId}: ${errMsg}`
      );
    }
  }

  // GET /races/:raceId/similar
  async fetchSimilarRaces(raceId: string, authToken?: string): Promise<RaceEvent[]> {
    const headers: HeadersInit = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const res = await apiFetch(`${this.baseUrl}/races/${raceId}/similar`, { headers });
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching similar races for ${raceId}: ${errMsg}`);
    }
  }

  // GET /races/:raceId
  async fetchRaceById(raceId: string, authToken?: string): Promise<RaceEvent> {
    const headers: HeadersInit = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const res = await apiFetch(`${this.baseUrl}/races/${raceId}`, { headers });
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching race ${raceId}: ${errMsg}`);
    }
  }

}
