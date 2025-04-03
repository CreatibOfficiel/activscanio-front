export interface Competitor {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  mu?: number;
  sigma?: number;
  rank?: number;
  raceCount?: number;
  avgRank12?: number;
}

export function getFullName(competitor: Competitor): string {
  return `${competitor.firstName} ${competitor.lastName[0]}.`;
}

export function getDisplayScore(competitor: Competitor): string {
  if (!competitor.mu || !competitor.sigma) {
    return "N/A";
  }
  const baseSkill = competitor.mu - 3 * competitor.sigma;
  const A = 1500;
  const B = 30;
  const rawScore = A + B * baseSkill;
  return Math.max(0, Math.round(rawScore)).toString();
}
