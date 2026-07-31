import { apiFetch } from '../utils/api-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SeasonArchive {
  id: string;
  month: number;
  seasonNumber: number;
  year: number;
  seasonName: string | null;
  totalCompetitors: number;
  totalRaces: number;
  /** Betting leftovers. Always 0 on new archives, kept so old ones load. */
  totalBettors: number;
  totalBets: number;
  /**
   * Optional: seasons archived before ping-pong existed have neither column,
   * so callers must default them rather than assume a number.
   */
  totalPingpongPlayers?: number;
  totalPingpongMatches?: number;
  avgCompetitorRating: number;
  createdAt: string;
}

export interface ArchivedCompetitorRanking {
  id: string;
  competitorId: string;
  competitorName: string;
  rank: number | null;
  provisional?: boolean;
  finalRating: number;
  finalRd: number;
  finalVol: number;
  totalRaces: number;
  avgRank12: number;
  winStreak: number;
  profilePictureUrl: string | null;
  characterImageUrl: string | null;
}

/** A player's ping-pong standing when a season closed. */
export interface ArchivedPingpongRanking {
  id: string;
  playerId: string;
  playerName: string;
  /** Null for anyone who was still calibrating when the season closed. */
  rank: number | null;
  provisional: boolean;
  finalRating: number;
  finalRd: number;
  finalVol: number;
  totalMatches: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  bestStreak: number;
}

export interface SeasonBettingWeek {
  id: string;
  weekNumber: number;
  seasonWeekNumber?: number;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: string;
  finalizedAt: string | null;
}

/**
 * What the season recap can show.
 *
 * The API returns exactly three fields. An earlier version of this type
 * declared eight — five of them betting highlights that went away with the
 * feature — and the recap called `.length` on one the server never sends.
 * That crashed the whole app on the highlights slide, with no error until
 * render.
 *
 * The response is cast rather than parsed, so TypeScript could not see it:
 * the type said the fields were there, and nothing checked.
 */
export interface SeasonHighlights {
  longestWinStreak: { competitorName: string; streak: number } | null;
  mostRaces: { competitorName: string; count: number } | null;
  bestRaceScorers:
    | { competitorName: string; maxScore: number; perfectCount: number }[]
    | null;
}

export interface SeasonRecapData {
  season: SeasonArchive;
  competitors: ArchivedCompetitorRanking[];
  pingpong: ArchivedPingpongRanking[];
  highlights: SeasonHighlights;
}

export class SeasonsRepository {
  /**
   * Get all archived seasons
   */
  static async getAllSeasons(): Promise<SeasonArchive[]> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/seasons`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch seasons: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching seasons:', error);
      throw error;
    }
  }

  /**
   * Get specific season
   */
  static async getSeason(year: number, month: number): Promise<SeasonArchive | null> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/seasons/${year}/${month}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch season: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) return null;

      return JSON.parse(text);
    } catch (error) {
      console.error('Error fetching season:', error);
      throw error;
    }
  }

  /**
   * Get competitor rankings for a season
   */
  static async getCompetitorRankings(
    year: number,
    month: number
  ): Promise<ArchivedCompetitorRanking[]> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/seasons/${year}/${month}/competitors`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch competitor rankings: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching competitor rankings:', error);
      throw error;
    }
  }

  /**
   * Get ping-pong rankings for a season.
   *
   * Replaces the bettor rankings, whose endpoint went away with the betting
   * system. Players still calibrating come back with `rank: null` rather than
   * being left out, so the archive reports who was around that season.
   */
  static async getPingpongRankings(
    year: number,
    month: number
  ): Promise<ArchivedPingpongRanking[]> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/seasons/${year}/${month}/pingpong`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ping-pong rankings: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ping-pong rankings:', error);
      throw error;
    }
  }

  /**
   * Get betting weeks for a season
   */
  static async getSeasonWeeks(
    year: number,
    month: number
  ): Promise<SeasonBettingWeek[]> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/seasons/${year}/${month}/weeks`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch season weeks: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching season weeks:', error);
      throw error;
    }
  }

  /**
   * Get season highlights for the recap
   */
  static async getSeasonHighlights(
    year: number,
    month: number
  ): Promise<SeasonHighlights> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/seasons/${year}/${month}/highlights`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch season highlights: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching season highlights:', error);
      throw error;
    }
  }

  /**
   * Get all data needed for the season recap modal
   */
  static async getSeasonRecapData(
    year: number,
    month: number
  ): Promise<SeasonRecapData | null> {
    const season = await this.getSeason(year, month);
    if (!season) return null;

    const [competitors, pingpong, highlights] = await Promise.all([
      this.getCompetitorRankings(year, month),
      // Seasons archived before ping-pong existed have no standings to
      // return, and the endpoint may 404 on them. That must not take the
      // whole recap down — the Mario Kart half is still worth showing.
      this.getPingpongRankings(year, month).catch(() => []),
      this.getSeasonHighlights(year, month),
    ]);

    return { season, competitors, pingpong, highlights };
  }
}
