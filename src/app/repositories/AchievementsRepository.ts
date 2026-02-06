import {
  Achievement,
  UserAchievement,
  UserStats,
  AchievementQueryParams,
  EquipTitleDto,
  EquipTitleResponse,
} from '../models/Achievement';
import { apiFetch } from '../utils/api-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AchievementsRepository {
  /**
   * Get all achievements with optional filters
   * If authToken is provided, includes user-specific data (unlocked status, progress)
   */
  static async getAchievements(
    params?: AchievementQueryParams,
    authToken?: string
  ): Promise<Achievement[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.category) {
        queryParams.append('category', params.category);
      }
      if (params?.rarity) {
        queryParams.append('rarity', params.rarity);
      }
      if (params?.unlockedOnly !== undefined) {
        queryParams.append('unlockedOnly', params.unlockedOnly.toString());
      }
      if (params?.lockedOnly !== undefined) {
        queryParams.append('lockedOnly', params.lockedOnly.toString());
      }

      const url = `${API_BASE_URL}/achievements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }

  /**
   * Get current user's unlocked achievements
   */
  static async getMyAchievements(authToken: string): Promise<UserAchievement[]> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/achievements/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch user achievements: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  }

  /**
   * Get user stats
   * Use "me" as userId to get current user's stats
   */
  static async getUserStats(
    userId: string,
    authToken?: string
  ): Promise<UserStats> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await apiFetch(
        `${API_BASE_URL}/achievements/stats/${userId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Get current user's stats
   */
  static async getMyStats(authToken: string): Promise<UserStats> {
    return this.getUserStats('me', authToken);
  }

  /**
   * Equip a title from an unlocked achievement
   */
  static async equipTitle(
    dto: EquipTitleDto,
    authToken: string
  ): Promise<EquipTitleResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/achievements/equip-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to equip title: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error equipping title:', error);
      throw error;
    }
  }

  /**
   * Remove currently equipped title
   */
  static async unequipTitle(authToken: string): Promise<{ message: string }> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/achievements/unequip-title`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to unequip title: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error unequipping title:', error);
      throw error;
    }
  }
}
