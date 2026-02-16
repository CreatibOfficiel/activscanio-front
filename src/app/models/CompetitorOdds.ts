/**
 * Reason why a competitor is not eligible for betting
 */
export type IneligibilityReason =
  | 'calibrating' // Less than 5 total lifetime races
  | 'inactive' // Less than 2 races in 30-day rolling window
  | null; // Eligible

export interface CompetitorOdds {
  competitorId: string;
  /** @deprecated Use competitor.firstName/lastName instead */
  competitorName?: string;
  /** @deprecated Use oddFirst, oddSecond, oddThird instead */
  odd: number;
  oddFirst?: number;
  oddSecond?: number;
  oddThird?: number;
  probability?: number;
  isEligible?: boolean;
  ineligibilityReason?: IneligibilityReason;
  calibrationProgress?: number; // X out of 5
  recentRacesIn14Days?: number;
  competitor?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    totalLifetimeRaces?: number;
    recentPositions?: number[];
    avgRank12?: number;
    vol?: number;
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
  currentWinStreak: number;
  /**
   * Previous week rank for trend calculation.
   * Used to show if bettor is rising/falling in rankings.
   */
  previousWeekRank?: number | null;
}
