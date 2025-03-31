export interface Competitor {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  elo: number;
  rank: number;
  raceCount: number;
  avgRank12: number;
}

export function getFullName(competitor: Competitor): string {
  return `${competitor.firstName} ${competitor.lastName[0]}.`;
}
