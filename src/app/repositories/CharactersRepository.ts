import { BaseCharacter, CharacterVariant } from "../models/Character";
import { apiFetch } from '../utils/api-fetch';

export class CharactersRepository {
  constructor(private baseUrl: string) {}

  // GET /base-characters
  async fetchBaseCharacters(): Promise<BaseCharacter[]> {
    const res = await apiFetch(`${this.baseUrl}/base-characters`);
    if (!res.ok) {
      throw new Error(`Error fetching base characters: ${res.statusText}`);
    }
    return await res.json();
  }

  // GET /base-characters/:id/variants
  async fetchCharacterVariants(
    baseCharacterId: string
  ): Promise<CharacterVariant[]> {
    const res = await apiFetch(
      `${this.baseUrl}/base-characters/${baseCharacterId}/variants`
    );
    if (!res.ok) {
      throw new Error(`Error fetching character variants: ${res.statusText}`);
    }
    return await res.json();
  }

  // GET /character-variants/available
  async fetchAvailableCharacterVariants(): Promise<CharacterVariant[]> {
    const res = await apiFetch(`${this.baseUrl}/character-variants/available`);
    if (!res.ok) {
      throw new Error(`Error fetching available character variants: ${res.statusText}`);
    }
    return await res.json();
  }

  // GET /base-characters/available
  async fetchAvailableBaseCharacters(): Promise<BaseCharacter[]> {
    const res = await apiFetch(`${this.baseUrl}/base-characters/available`);
    if (!res.ok) {
      throw new Error(`Error fetching available base characters: ${res.statusText}`);
    }
    return await res.json();
  }

  // GET /base-characters/:id/available-variants
  async fetchAvailableVariantsForBaseCharacter(baseCharacterId: string): Promise<CharacterVariant[]> {
    const res = await apiFetch(`${this.baseUrl}/base-characters/${baseCharacterId}/available-variants`);
    if (!res.ok) throw new Error("Failed to fetch available variants");
    return res.json();
  }
}
