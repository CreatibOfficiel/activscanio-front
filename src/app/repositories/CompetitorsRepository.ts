import {
  Competitor,
  UpdateCompetitorPayload,
} from "@/app/models/Competitor";
import { apiFetch } from '../utils/api-fetch';

export class CompetitorsRepository {
  constructor(private readonly baseUrl: string) {}

  /* ───────── READ ───────── */

  // GET /competitors
  async fetchCompetitors(): Promise<Competitor[]> {
    const res = await apiFetch(`${this.baseUrl}/competitors`);
    if (!res.ok) {
      throw new Error(`Error fetching competitors: ${res.statusText}`);
    }
    return (await res.json()) as Competitor[];
  }

  /* ───────── CREATE ───────── */

  // POST /competitors
  async createCompetitor(competitor: Competitor): Promise<Competitor> {
    const res = await apiFetch(`${this.baseUrl}/competitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: competitor.firstName,
        lastName: competitor.lastName,
        rating: competitor.rating,
        rd: competitor.rd,
        vol: competitor.vol,
        profilePictureUrl: competitor.profilePictureUrl,
        raceCount: competitor.raceCount,
        avgRank12: competitor.avgRank12,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Error creating competitor: ${await res.text()}`,
      );
    }
    return (await res.json()) as Competitor;
  }

  /* ───────── READ BY ID ───────── */

  // GET /competitors/:id
  async fetchCompetitorById(id: string): Promise<Competitor> {
    const res = await apiFetch(`${this.baseUrl}/competitors/${id}`);
    if (!res.ok) {
      throw new Error(`Error fetching competitor: ${await res.text()}`);
    }
    return (await res.json()) as Competitor;
  }

  /* ───────── UPDATE ───────── */

  // PUT /competitors/:id
  async updateCompetitor(
    id: string,
    payload: UpdateCompetitorPayload,
  ): Promise<Competitor> {
    const res = await apiFetch(`${this.baseUrl}/competitors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(
        `Error updating competitor: ${await res.text()}`,
      );
    }
    return (await res.json()) as Competitor;
  }

  /* ───────── LINK / UNLINK CHARACTER VARIANT ───────── */

  // POST /competitors/:id/character-variant
  async linkCharacterToCompetitor(
    competitorId: string,
    variantId: string,
  ): Promise<Competitor> {
    const res = await apiFetch(
      `${this.baseUrl}/competitors/${competitorId}/character-variant`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterVariantId: variantId }),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Error linking character: ${await res.text()}`,
      );
    }
    return (await res.json()) as Competitor;
  }

  // DELETE /competitors/:id/character-variant
  async unlinkCharacterFromCompetitor(
    competitorId: string,
  ): Promise<Competitor> {
    const res = await apiFetch(
      `${this.baseUrl}/competitors/${competitorId}/character-variant`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      throw new Error(
        `Error unlinking character: ${await res.text()}`,
      );
    }
    return (await res.json()) as Competitor;
  }
}
