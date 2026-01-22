import { Competitor } from '../models/Competitor';
import { BaseCharacter, CharacterVariant } from '../models/Character';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CompleteOnboardingDto {
  isSpectator?: boolean;
  existingCompetitorId?: string;
  newCompetitor?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  characterVariantId?: string;
}

export class OnboardingRepository {
  /**
   * Search competitors by name
   */
  static async searchCompetitors(query: string, authToken: string): Promise<Competitor[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/onboarding/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search competitors: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching competitors:', error);
      throw error;
    }
  }

  /**
   * Complete onboarding (link to competitor and select character variant)
   */
  static async completeOnboarding(
    dto: CompleteOnboardingDto,
    authToken: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/complete`, {
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
          errorData.message || `Failed to complete onboarding: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Skip onboarding
   */
  static async skipOnboarding(authToken: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to skip onboarding: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      throw error;
    }
  }

  /**
   * Get all character variants
   */
  static async getAllCharacterVariants(authToken: string): Promise<CharacterVariant[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/character-variants`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch character variants: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching character variants:', error);
      throw error;
    }
  }

  /**
   * Get all base characters with their available variants
   */
  static async getAvailableBaseCharacters(authToken: string): Promise<BaseCharacter[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/base-characters/available`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch base characters: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching base characters:', error);
      throw error;
    }
  }

  /**
   * Get available variants for a specific base character
   */
  static async getAvailableVariants(baseCharacterId: string, authToken: string): Promise<CharacterVariant[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/base-characters/${baseCharacterId}/available-variants`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available variants: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available variants:', error);
      throw error;
    }
  }
}
