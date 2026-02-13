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
  raceCount?: number;
  avgRank12?: number;
  lastRaceDate?: string;
  conservativeScore?: number;
  provisional?: boolean;
  /**
   * Recent race positions (last 5 races).
   * Format: [most_recent, ..., oldest]
   * Example: [1, 4, 2, 3, 1] means last race was 1st place
   */
  recentPositions?: number[];
  /**
   * Lifetime average rank across all races (never resets).
   * Used as baseline for relative form calculation.
   */
  lifetimeAvgRank?: number;
  /**
   * Previous day rank for trend calculation.
   * Used to show if competitor is rising/falling in rankings.
   */
  previousDayRank?: number | null;
  winStreak?: number;
  bestWinStreak?: number;
  totalWins?: number;
  playStreak?: number;
  bestPlayStreak?: number;
  totalLifetimeRaces?: number;
  currentMonthRaceCount?: number;
}

// Competitor with availability status (for onboarding)
export interface CompetitorWithAvailability {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  characterVariant?: {
    id: string;
    label: string;
    imageUrl: string;
    baseCharacter: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  } | null;
  isAvailable: boolean;
}

/* -------- Helpers types -------- */

export const getFullName = (c: Competitor) =>
  `${c.firstName} ${c.lastName[0]}.`;

export function getDisplayScore(c: Competitor): string {
  if (c.conservativeScore == null) return 'N/A';
  return Math.round(c.conservativeScore).toString();
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
