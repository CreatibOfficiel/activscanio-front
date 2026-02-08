import { apiFetch } from '../utils/api-fetch';
import { Bet, CreateBetDto } from '../models/Bet';
import { BettingWeek } from '../models/BettingWeek';
import { CompetitorOdds, BettorRanking } from '../models/CompetitorOdds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export class BettingRepository {
  /**
   * Get current betting week
   */
  static async getCurrentWeek(): Promise<BettingWeek | null> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/betting/current-week`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch current week: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching current week:', error);
      throw error;
    }
  }

  /**
   * Get odds for a specific week by ID
   */
  static async getWeekOdds(weekId: string): Promise<CompetitorOdds[]> {
    const response = await apiFetch(
      `${API_BASE_URL}/betting/weeks/${weekId}/odds`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch odds: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get odds for current week
   */
  static async getCurrentWeekOdds(): Promise<CompetitorOdds[]> {
    try {
      const week = await this.getCurrentWeek();
      if (!week) {
        return [];
      }

      const response = await apiFetch(
        `${API_BASE_URL}/betting/weeks/${week.id}/odds`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching odds:', error);
      throw error;
    }
  }

  /**
   * Place a bet for the current week
   */
  static async placeBet(
    userId: string,
    createBetDto: CreateBetDto,
    authToken: string
  ): Promise<Bet> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/betting/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(createBetDto),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to place bet: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  /**
   * Get user's bet for current week
   */
  static async getCurrentBet(
    userId: string,
    authToken: string
  ): Promise<Bet | null> {
    try {
      const week = await this.getCurrentWeek();
      if (!week) {
        return null;
      }

      const response = await apiFetch(
        `${API_BASE_URL}/betting/bets/my-bets?weekId=${week.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch bet: ${response.statusText}`);
      }

      // Handle empty response (no bet found)
      const text = await response.text();
      if (!text || text === 'null') {
        return null;
      }

      return JSON.parse(text) as Bet;
    } catch (error) {
      console.error('Error fetching current bet:', error);
      throw error;
    }
  }

  /**
   * Get user's bet history with pagination
   */
  static async getBetHistory(
    userId: string,
    authToken: string,
    limit = 10,
    offset = 0
  ): Promise<PaginatedResponse<Bet>> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/betting/bets/my-bets?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bet history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bet history:', error);
      throw error;
    }
  }

  /**
   * Get monthly rankings
   */
  static async getMonthlyRankings(
    month: number,
    year: number
  ): Promise<{
    month: number;
    year: number;
    count: number;
    rankings: BettorRanking[];
  }> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/betting/rankings/monthly?month=${month}&year=${year}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.statusText}`);
      }

      const data = await response.json();
      // Backend returns { month, year, count, rankings: [...] }
      return data;
    } catch (error) {
      console.error('Error fetching rankings:', error);
      throw error;
    }
  }

  /**
   * Get all weeks
   */
  static async getAllWeeks(): Promise<BettingWeek[]> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/betting/weeks`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch weeks: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weeks:', error);
      throw error;
    }
  }

  /**
   * Get boost availability for current user
   */
  static async getBoostAvailability(
    authToken: string
  ): Promise<{ available: boolean; lastUsedMonth: number | null; lastUsedYear: number | null }> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/betting/boost-availability`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boost availability: ${response.statusText}`);
      }

      // Backend returns { canUseBoost, lastUsed, resetsOn }
      // Map to frontend expected format { available, lastUsedMonth, lastUsedYear }
      const data = await response.json() as {
        canUseBoost: boolean;
        lastUsed: { month: number; year: number } | null;
        resetsOn: string;
      };

      return {
        available: data.canUseBoost,
        lastUsedMonth: data.lastUsed?.month ?? null,
        lastUsedYear: data.lastUsed?.year ?? null,
      };
    } catch (error) {
      console.error('Error fetching boost availability:', error);
      throw error;
    }
  }
}
