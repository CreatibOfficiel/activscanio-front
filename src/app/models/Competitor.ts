import { CharacterVariant } from './Character';

/* -------- Principal types -------- */

export interface Competitor {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  characterVariant?: CharacterVariant | null;
  rating: number;
  rd: number;
  vol: number;
  rank?: number;
  raceCount?: number;
  avgRank12?: number;
  lastRaceDate?: string;
  conservativeScore: number;
  provisional: boolean;
}

/* -------- Helpers types -------- */

export const getFullName = (c: Competitor) =>
  `${c.firstName} ${c.lastName[0]}.`;

export function getDisplayScore(c: Competitor): string {
  if (c.rating == null || c.rd == null) return 'N/A';
  return Math.round(c.rating).toString();
}

/* -------- Update payload types -------- */

export interface UpdateCompetitorPayload {
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  /**
   * UUID of the CharacterVariant to link,
   * null to unlink,
   * or absent to not change
   */
  characterVariantId?: string | null;
}