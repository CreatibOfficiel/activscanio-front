import { CharacterVariant } from './Character';

/* -------- Types principaux -------- */

export interface Competitor {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  characterVariant?: CharacterVariant | null;
  mu?: number;
  sigma?: number;
  rank?: number;
  raceCount?: number;
  avgRank12?: number;
}

/* -------- Helpers -------- */

export const getFullName = (c: Competitor) =>
  `${c.firstName} ${c.lastName[0]}.`;

export function getDisplayScore(c: Competitor): string {
  if (c.mu == null || c.sigma == null) return 'N/A';
  const baseSkill = c.mu - 3 * c.sigma;
  const A = 1500;
  const B = 30;
  return Math.max(0, Math.round(A + B * baseSkill)).toString();
}

/* -------- Payload de mise à jour -------- */

export interface UpdateCompetitorPayload {
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  /**
   * UUID du CharacterVariant à lier,
   * null pour délier,
   * ou absent pour ne rien changer
   */
  characterVariantId?: string | null;
}