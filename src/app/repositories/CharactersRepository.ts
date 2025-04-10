import { Character } from "../models/Character";

export class CharactersRepository {
  constructor(private baseUrl: string) {}

  // GET /characters
  async fetchAllCharacters(): Promise<Character[]> {
    const res = await fetch(`${this.baseUrl}/characters`);
    if (!res.ok) {
      throw new Error(`Error fetching characters: ${res.statusText}`);
    }
    return await res.json();
  }

  // GET /characters/available
  async fetchAvailableCharacters(): Promise<Character[]> {
    const res = await fetch(`${this.baseUrl}/characters/available`);
    if (!res.ok) {
      throw new Error(`Error fetching available characters: ${res.statusText}`);
    }
    return await res.json();
  }
}