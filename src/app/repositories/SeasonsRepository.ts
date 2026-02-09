import { apiFetch } from '../utils/api-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SeasonArchive {
  id: string;
  month: number;
  year: number;
  seasonName: string | null;
  totalCompetitors: number;
  totalBettors: number;
  totalRaces: number;
  totalBets: number;
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
  raceCount: number;
  avgRank12: number;
  winStreak: number;
}

export interface ArchivedBettorRanking {
  userId: string;
  userName: string;
  rank: number;
  totalPoints: number;
  betsPlaced: number;
}

export interface SeasonBettingWeek {
  id: string;
  weekNumber: number;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: string;
  finalizedAt: string | null;
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
  static async getSeason(year: number, month: number): Promise<SeasonArchive> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/seasons/${year}/${month}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch season: ${response.statusText}`);
      }

      return await response.json();
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
   * Get bettor rankings for a season
   */
  static async getBettorRankings(
    year: number,
    month: number
  ): Promise<ArchivedBettorRanking[]> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/seasons/${year}/${month}/bettors`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bettor rankings: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bettor rankings:', error);
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
}
