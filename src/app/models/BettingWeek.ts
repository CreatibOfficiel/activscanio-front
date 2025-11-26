export enum BettingWeekStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  FINALIZED = 'finalized',
}

export interface BettingWeek {
  id: string;
  weekNumber: number;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: BettingWeekStatus;
  podiumFirstId?: string;
  podiumSecondId?: string;
  podiumThirdId?: string;
  finalizedAt?: string;
  createdAt: string;
}
