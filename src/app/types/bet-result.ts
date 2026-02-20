export interface BetResultPick {
  competitorName: string;
  position: string;
  isCorrect: boolean;
  oddAtBet: number;
  hasBoost: boolean;
  pointsEarned: number;
  usedBogOdd: boolean;
}

export interface BetResultPayload {
  betId: string;
  weekId: string;
  status: 'won' | 'lost';
  pointsEarned: number;
  isPerfectPodium: boolean;
  perfectPodiumBonus: number;
  correctPicks: number;
  totalPicks: number;
  hasBoost: boolean;
  picks: BetResultPick[];
}

export interface StreakLossPayload {
  type: 'betting' | 'play';
  lostValue: number;
  lostAt: string | Date;
}

export interface StreakLossesResponse {
  bettingStreakLoss: { lostValue: number; lostAt: string } | null;
  playStreakLoss: { lostValue: number; lostAt: string } | null;
}
