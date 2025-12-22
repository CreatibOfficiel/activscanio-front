import { Bet, CreateBetDto } from '../models/Bet';
import { BettingWeek } from '../models/BettingWeek';
import { CompetitorOdds, BettorRanking } from '../models/CompetitorOdds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class BettingRepository {
  /**
   * Get current betting week
   */
  static async getCurrentWeek(): Promise<BettingWeek | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/betting/current-week`, {
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
   * Get odds for current week
   */
  static async getCurrentWeekOdds(): Promise<CompetitorOdds[]> {
    try {
      const week = await this.getCurrentWeek();
      if (!week) {
        return [];
      }

      const response = await fetch(
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
      const response = await fetch(`${API_BASE_URL}/betting/bets`, {
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

      const response = await fetch(
        `${API_BASE_URL}/betting/bets/my-bet?weekId=${week.id}`,
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

      return await response.json();
    } catch (error) {
      console.error('Error fetching current bet:', error);
      throw error;
    }
  }

  /**
   * Get user's bet history
   */
  static async getBetHistory(
    userId: string,
    authToken: string
  ): Promise<Bet[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/betting/bets/my-bets`,
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
      const response = await fetch(
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
      const response = await fetch(`${API_BASE_URL}/betting/weeks`, {
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
      const response = await fetch(`${API_BASE_URL}/betting/boost-availability`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boost availability: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching boost availability:', error);
      throw error;
    }
  }
}
