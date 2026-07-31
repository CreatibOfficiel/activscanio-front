import {
  PingpongEloSnapshot,
  PingpongHeadToHead,
  PingpongMatch,
  PingpongPlayer,
  RecordMatchPayload,
} from '../models/Pingpong';
import { apiFetch } from '../utils/api-fetch';

/**
 * Ping-pong API.
 *
 * Reads are public, writes need a token — the same split as the races API.
 */
export class PingpongRepository {
  constructor(private baseUrl: string) {}

  /**
   * Everyone, ranked or not.
   *
   * Players still calibrating come back with `rank: null` rather than being
   * left out: a newcomer who cannot find themselves on the board assumes the
   * app is broken.
   */
  async fetchLeaderboard(): Promise<PingpongPlayer[]> {
    const res = await apiFetch(`${this.baseUrl}/pingpong/leaderboard`);
    if (!res.ok) {
      throw new Error(
        `Error fetching ping-pong leaderboard: ${await res.text()}`,
      );
    }
    return await res.json();
  }

  // GET /pingpong/players/:competitorId
  async fetchPlayer(competitorId: string): Promise<PingpongPlayer | null> {
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/players/${competitorId}`,
    );
    // A competitor who has never played is a normal state, not a failure —
    // the profile page shows an invitation to record a first match.
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Error fetching ping-pong player: ${await res.text()}`);
    }
    return await res.json();
  }

  // GET /pingpong/players/:competitorId/history
  async fetchPlayerHistory(
    competitorId: string,
    days?: number,
  ): Promise<PingpongEloSnapshot[]> {
    const query = days === undefined ? '' : `?days=${days}`;
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/players/${competitorId}/history${query}`,
    );
    if (!res.ok) {
      throw new Error(`Error fetching ping-pong history: ${await res.text()}`);
    }
    return await res.json();
  }

  // GET /pingpong/players/:competitorId/matches
  async fetchPlayerMatches(competitorId: string): Promise<PingpongMatch[]> {
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/players/${competitorId}/matches`,
    );
    if (!res.ok) {
      throw new Error(`Error fetching player matches: ${await res.text()}`);
    }
    return await res.json();
  }

  // GET /pingpong/matches
  async fetchRecentMatches(limit = 50): Promise<PingpongMatch[]> {
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/matches?limit=${limit}`,
    );
    if (!res.ok) {
      throw new Error(`Error fetching ping-pong matches: ${await res.text()}`);
    }
    return await res.json();
  }

  // GET /pingpong/head-to-head/:idA/:idB
  async fetchHeadToHead(
    playerAId: string,
    playerBId: string,
  ): Promise<PingpongHeadToHead> {
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/head-to-head/${playerAId}/${playerBId}`,
    );
    if (!res.ok) {
      throw new Error(`Error fetching head-to-head: ${await res.text()}`);
    }
    return await res.json();
  }

  /**
   * Record a match.
   *
   * The server validates the scores again, so a rejection here is a real
   * error worth surfacing rather than something to swallow — the message it
   * returns names which rule was broken.
   */
  async recordMatch(
    payload: RecordMatchPayload,
    authToken: string,
  ): Promise<PingpongMatch> {
    const res = await apiFetch(`${this.baseUrl}/pingpong/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Error recording match: ${await res.text()}`);
    }
    return await res.json();
  }

  // POST /pingpong/players
  async enrolPlayer(
    competitorId: string,
    authToken: string,
  ): Promise<PingpongPlayer> {
    const res = await apiFetch(`${this.baseUrl}/pingpong/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ competitorId }),
    });
    if (!res.ok) {
      throw new Error(`Error enrolling player: ${await res.text()}`);
    }
    return await res.json();
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const pingpongRepository = new PingpongRepository(API_BASE_URL);
