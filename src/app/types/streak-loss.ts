export interface StreakLossPayload {
  /**
   * `participation` is the weekly attendance streak, `play` the Mario Kart
   * race streak carried by the competitor.
   */
  type: 'participation' | 'play';
  lostValue: number;
  lostAt: string | Date;
  missedDays?: string[];
}

export interface StreakLossesResponse {
  participationStreakLoss: { lostValue: number; lostAt: string } | null;
  playStreakLoss: {
    lostValue: number;
    lostAt: string;
    missedDays?: string[];
  } | null;
}
