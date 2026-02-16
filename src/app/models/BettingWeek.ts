export enum BettingWeekStatus {
  CALIBRATION = 'calibration', // First week of month - no betting allowed
  OPEN = 'open',
  CLOSED = 'closed',
  FINALIZED = 'finalized',
}

export interface BettingWeek {
  id: string;
  weekNumber: number;
  seasonWeekNumber?: number;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: BettingWeekStatus;
  isCalibrationWeek?: boolean;
  podiumFirstId?: string;
  podiumSecondId?: string;
  podiumThirdId?: string;
  finalizedAt?: string;
  createdAt: string;
}
