import {
  PingpongBestWin,
  PingpongEloSnapshot,
  SelectablePlayer,
  PingpongHeadToHead,
  PingpongMatch,
  PingpongMatchesPage,
  PingpongPlayer,
  RecordMatchPayload,
} from '../models/Pingpong';
import { apiFetch } from '../utils/api-fetch';

/**
 * Ping-pong API.
 *
 * Reads are public, writes need a token — the same split as the races API.
 */
/**
 * What the history can be narrowed by.
 *
 * `playerId` is a `PingpongPlayer.id`, NOT a competitor id — the ping-pong
 * API is keyed on its own player ids and the two are different strings that
 * both type-check, so passing the wrong one silently returns nothing.
 */
export interface PingpongMatchFilters {
  playerId?: string;
  /**
   * Same vocabulary as the race history — 'today' | 'week' | 'season' —
   * resolved server-side by the shared `resolvePeriodRange`, so "cette
   * semaine" means the same Monday on both screens. 'all' filters nothing.
   */
  period?: string;
}

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

  /**
   * Everyone who could play, enrolled or not.
   *
   * The entry form needs this rather than the leaderboard: on day one
   * nobody is enrolled, so a form listing only enrolled players shows an
   * empty search box with no explanation and no way forward. Enrolment
   * happens on the first recorded match.
   */
  async fetchSelectable(): Promise<SelectablePlayer[]> {
    const res = await apiFetch(`${this.baseUrl}/pingpong/selectable`);
    if (!res.ok) {
      throw new Error(`Error fetching selectable players: ${await res.text()}`);
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

  /**
   * The strongest opponent this player has beaten, or null if they have
   * never won. Null rather than a zero-rated placeholder: "beat someone
   * rated 0" is not a thing that happened.
   */
  async fetchBestWin(competitorId: string): Promise<PingpongBestWin | null> {
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/players/${competitorId}/best-win`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Error fetching best win: ${await res.text()}`);
    }
    const body = await res.text();
    return body ? (JSON.parse(body) as PingpongBestWin) : null;
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

  /**
   * GET /pingpong/matches — the newest few, as a bare array.
   *
   * Kept as it was. The history now scrolls through `fetchMatchesPage`
   * instead, but this shape is what the existing callers index into, and
   * wrapping it in an envelope would break each of them for no gain.
   */
  async fetchRecentMatches(limit = 50): Promise<PingpongMatch[]> {
    const res = await apiFetch(
      `${this.baseUrl}/pingpong/matches?limit=${limit}`,
    );
    if (!res.ok) {
      throw new Error(`Error fetching ping-pong matches: ${await res.text()}`);
    }
    return await res.json();
  }

  /**
   * GET /pingpong/matches/paginated — one page of history.
   *
   * The cursor is opaque here on purpose. It is the server's `playedAt|id`
   * keyset position, and the only correct thing a client can do with it is
   * hand back the last one it was given. Parsing or rebuilding it here would
   * duplicate the ordering rule on the side that does not own it.
   */
  async fetchMatchesPage(
    cursor?: string,
    limit = 20,
    filters: PingpongMatchFilters = {},
  ): Promise<PingpongMatchesPage> {
    const params = new URLSearchParams({ limit: String(limit) });
    // Only on later pages. An empty `cursor=` would be a falsy string the
    // server still has to reason about.
    if (cursor) params.set('cursor', cursor);

    // Filtering is the SERVER's job here, not a `.filter()` on what came
    // back. A page holds twenty rows; narrowing those locally would show an
    // empty list beside a "load more" button whenever the matching games sit
    // further down, which reads as "this player never played".
    if (filters.playerId) params.set('playerId', filters.playerId);
    // 'all' is the server's default; sending it is noise on every request.
    if (filters.period && filters.period !== 'all') {
      params.set('period', filters.period);
    }

    const res = await apiFetch(
      `${this.baseUrl}/pingpong/matches/paginated?${params.toString()}`,
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
