export interface CompetitorOdds {
  competitorId: string;
  /** @deprecated Use competitor.firstName/lastName instead */
  competitorName?: string;
  odd: number;
  probability?: number;
  formFactor?: number;
  isEligible?: boolean;
  competitor?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
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
