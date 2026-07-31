import { apiFetch } from '../utils/api-fetch';
import { StreakLossesResponse } from '../types/streak-loss';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Streak losses, for the modal that tells a user their streak broke.
 *
 * These endpoints used to live under /betting because the weekly streak was
 * triggered by placing a bet. They now sit under /achievements: the play
 * streak they also report is pure Mario Kart and outlives the betting module.
 */
export class StreaksRepository {
  static async getUnseenStreakLosses(
    authToken: string,
  ): Promise<StreakLossesResponse | null> {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/achievements/streaks/unseen-losses`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch streak losses: ${response.statusText}`,
        );
      }

      return (await response.json()) as StreakLossesResponse;
    } catch (error) {
      console.error('Error fetching unseen streak losses:', error);
      return null;
    }
  }

  static async markStreakLossesSeen(authToken: string): Promise<void> {
    try {
      await apiFetch(
        `${API_BASE_URL}/achievements/streaks/mark-losses-seen`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
    } catch (error) {
      console.error('Error marking streak losses as seen:', error);
    }
  }
}
