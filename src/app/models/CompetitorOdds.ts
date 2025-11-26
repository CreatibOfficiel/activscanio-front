export interface CompetitorOdds {
  competitorId: string;
  competitorName: string;
  odd: number;
  probability: number;
  formFactor: number;
  isEligible: boolean;
  metadata: {
    elo: number;
    rd: number;
    recentWins: number;
    winStreak: number;
    raceCount: number;
    avgRank: number;
    formFactor: number;
    probability: number;
  };
}

export interface BettorRanking {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalPoints: number;
  rank: number;
  createdAt: string;
  updatedAt: string;
}
