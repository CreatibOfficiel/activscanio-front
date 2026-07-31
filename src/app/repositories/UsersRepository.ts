import { apiFetch } from '../utils/api-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Which sport a user follows.
 *
 * Separate from `role`, which already means three things at once. Mirrors
 * SportPreference in the API.
 */
export type SportPreference = 'mario-kart' | 'ping-pong' | 'both';

export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** 'bettor' is a legacy value: betting is gone, but old rows still carry it. */
  role: 'pending' | 'bettor' | 'player';
  /**
   * Optional because a user record written before the column existed comes
   * back without it. Callers must default it rather than assume a value.
   */
  sportPreference?: SportPreference;
  hasCompletedOnboarding: boolean;
  competitorId?: string;
  competitor?: {
    id: string;
    firstName: string;
    lastName: string;
    characterVariant?: {
      id: string;
      label: string;
      imageUrl?: string;
      baseCharacter: {
        id: string;
        name: string;
        imageUrl?: string;
        variants?: { id: string; label: string; imageUrl?: string }[];
      };
    };
  };
}

/**
 * Repository for user-related API calls
 */
export class UsersRepository {
  /**
   * Get current authenticated user
   * @param authToken - JWT token from Clerk
   * @returns User data with competitor and character information
   */
  static async getMe(authToken: string): Promise<UserData> {
    const response = await apiFetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = new Error(`Failed to fetch user: ${response.statusText}`);
      (error as unknown as Record<string, number>).status = response.status;
      throw error;
    }

    return await response.json();
  }

  /**
   * Change the character variant for the current user
   * @param characterVariantId - UUID of the new character variant
   * @param authToken - JWT token from Clerk
   * @returns Updated user data
   */
  static async changeCharacter(
    characterVariantId: string,
    authToken: string,
  ): Promise<UserData> {
    const response = await apiFetch(`${API_BASE_URL}/users/me/character`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ characterVariantId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to change character: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Change which sport the current user follows.
   *
   * Its own endpoint rather than the generic PATCH :id, whose body accepts
   * role and competitorId too.
   */
  static async changeSportPreference(
    sportPreference: SportPreference,
    authToken: string,
  ): Promise<UserData> {
    const response = await apiFetch(
      `${API_BASE_URL}/users/me/sport-preference`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sportPreference }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to change sport preference: ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
