import { RaceEvent } from "../models/RaceEvent";
import { RecentRaceInfo } from "../models/RecentRaceInfo";

export class RacesRepository {
  constructor(private baseUrl: string) {
    this.baseUrl = baseUrl + "/api";
  }

  // POST /races
  async createRace(race: RaceEvent): Promise<RaceEvent> {
    const res = await fetch(`${this.baseUrl}/races`, {
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
    const res = await fetch(`${this.baseUrl}/races?recent=true`);
    if (res.ok) {
      const data = await res.json();
      return data.map((jsonObj: RaceEvent) => jsonObj as RaceEvent);
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching recent races: ${errMsg}`);
    }
  }

  // GET /competitors/:competitorId/recent-races
  async fetchRecentRacesOfCompetitor(competitorId: string): Promise<RecentRaceInfo[]> {
    const res = await fetch(`${this.baseUrl}/competitors/${competitorId}/recent-races`);
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
    const res = await fetch(`${this.baseUrl}/races/${raceId}/similar`);
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching similar races for ${raceId}: ${errMsg}`);
    }
  }

  // GET /races/:raceId
  async fetchRaceById(raceId: string): Promise<RaceEvent> {
    const res = await fetch(`${this.baseUrl}/races/${raceId}`);
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error fetching race ${raceId}: ${errMsg}`);
    }
  }
}
