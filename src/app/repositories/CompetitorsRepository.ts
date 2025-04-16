import { Competitor } from "../models/Competitor";

export class CompetitorsRepository {
  constructor(private baseUrl: string) {}

  // GET /competitors
  async fetchCompetitors(): Promise<Competitor[]> {
    const res = await fetch(`${this.baseUrl}/competitors`);
    if (!res.ok) {
      throw new Error(`Error fetching competitors: ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((jsonObj: Competitor) => jsonObj as Competitor);
  }

  // POST /competitors
  async createCompetitor(competitor: Competitor): Promise<Competitor> {
    const res = await fetch(`${this.baseUrl}/competitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: competitor.firstName,
        lastName: competitor.lastName,
        mu: competitor.mu,
        sigma: competitor.sigma,
        profilePictureUrl: competitor.profilePictureUrl,
        raceCount: competitor.raceCount,
        avgRank12: competitor.avgRank12,
        rank: competitor.rank,
      }),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error creating competitor: ${errMsg}`);
    }
  }

  // PUT /competitors/{id}
  async updateCompetitor(competitor: Competitor): Promise<Competitor> {
    const res = await fetch(`${this.baseUrl}/competitors/${competitor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(competitor),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error updating competitor: ${errMsg}`);
    }
  }

  // POST /competitors/:id/unlink-character
  async unlinkCharacterFromCompetitor(
    competitorId: string
  ): Promise<Competitor> {
    const res = await fetch(
      `${this.baseUrl}/competitors/${competitorId}/unlink-character`,
      {
        method: "POST",
      }
    );
    if (res.ok) {
      return await res.json();
    } else {
      const errMsg = await res.text();
      throw new Error(`Error unlinking character from competitor: ${errMsg}`);
    }
  }
}
