/**
 * StatsRepository
 *
 * Handles API calls for advanced statistics and analytics
 */
import { apiFetch } from '../utils/api-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DailyStats {
  date: string;
  betsPlaced: number;
  betsWon: number;
  pointsEarned: number;
  xpEarned: number;
  achievementsUnlocked: number;
}

export interface ComparisonStats {
  user: {
    totalBets: number;
    winRate: number;
    avgPointsPerBet: number;
    avgXPPerDay: number;
  };
  average: {
    totalBets: number;
    winRate: number;
    avgPointsPerBet: number;
    avgXPPerDay: number;
  };
}

export interface BestDayResult {
  day: string;
  dayNumber: number;
  totalBets: number;
  wins: number;
  winRate: number;
}

export interface FavoriteCompetitor {
  competitorId: string;
  competitorName: string;
  betCount: number;
  winCount: number;
  winRate: number;
  totalPointsEarned: number;
}

export interface BettingPatterns {
  averageBetsPerWeek: number;
  mostActiveHour: number | null;
  preferredPositions: {
    first: number;
    second: number;
    third: number;
  };
  avgOddsPlayed: number;
  totalBetsPlaced: number;
  totalWeeksActive: number;
}

export interface WinRateTrendPoint {
  date: string;
  betsPlaced: number;
  betsWon: number;
  winRate: number;
}

export interface AdvancedStats {
  bestDay: BestDayResult | null;
  favoriteCompetitors: FavoriteCompetitor[];
  patterns: BettingPatterns;
  winRateTrend: WinRateTrendPoint[];
}

export interface XPHistoryEntry {
  id: string;
  userId: string;
  xpAmount: number;
  source: string;
  relatedEntityId: string | null;
  description: string | null;
  earnedAt: string;
}

export interface LevelReward {
  id: string;
  level: number;
  rewardType: 'TITLE' | 'BADGE' | 'AVATAR' | 'XP_MULTIPLIER';
  rewardData: {
    title?: string;
    badgeIcon?: string;
    avatarUrl?: string;
    multiplier?: number;
  };
  description: string;
}

export interface UserLevelRewards {
  unlockedRewards: LevelReward[];
  nextReward: LevelReward | null;
  activeMultiplier: number;
}

export class StatsRepository {
  /**
   * Get stats history for graphs
   */
  static async getStatsHistory(
    userId: string,
    period: '7d' | '30d' | '3m' | '1y' = '30d',
    authToken?: string
  ): Promise<DailyStats[]> {
    try {
      const url = `${API_BASE_URL}/achievements/stats/${userId}/history?period=${period}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stats history:', error);
      throw error;
    }
  }

  /**
   * Get comparison stats (user vs average)
   */
  static async getComparisonStats(
    userId: string,
    authToken?: string
  ): Promise<ComparisonStats> {
    try {
      const url = `${API_BASE_URL}/achievements/stats/${userId}/comparison`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch comparison stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching comparison stats:', error);
      throw error;
    }
  }

  /**
   * Get advanced stats (best day, favorite competitors, patterns, trends)
   */
  static async getAdvancedStats(
    userId: string,
    authToken?: string
  ): Promise<AdvancedStats> {
    try {
      const url = `${API_BASE_URL}/achievements/stats/${userId}/advanced`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch advanced stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
      throw error;
    }
  }

  /**
   * Get XP history
   */
  static async getXPHistory(
    userId: string,
    limit: number = 50,
    authToken?: string
  ): Promise<XPHistoryEntry[]> {
    try {
      const url = `${API_BASE_URL}/achievements/xp-history/${userId}?limit=${limit}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch XP history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching XP history:', error);
      throw error;
    }
  }

  /**
   * Get all level rewards
   */
  static async getAllLevelRewards(authToken?: string): Promise<LevelReward[]> {
    try {
      const url = `${API_BASE_URL}/achievements/level-rewards`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch level rewards: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching level rewards:', error);
      throw error;
    }
  }

  /**
   * Get unlocked rewards for a user
   */
  static async getUserLevelRewards(
    userId: string,
    authToken?: string
  ): Promise<UserLevelRewards> {
    try {
      const url = `${API_BASE_URL}/achievements/level-rewards/${userId}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch user level rewards: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user level rewards:', error);
      throw error;
    }
  }
}
