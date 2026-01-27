const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'pending' | 'bettor' | 'player';
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
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
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
    const response = await fetch(`${API_BASE_URL}/users/me/character`, {
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
}
