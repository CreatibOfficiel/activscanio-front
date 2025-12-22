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
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  betsPlaced: number;
  betsWon: number;
  perfectBets: number;
  boostsUsed: number;
  winRate: number;
  currentMonthlyStreak: number;
}
