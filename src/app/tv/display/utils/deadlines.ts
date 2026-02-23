/**
 * Calculate the betting deadline from a week's start date.
 * Displayed as Monday 23:00 UTC (= midnight CET/Paris time).
 * The backend cron closes at Tuesday 00:00 UTC, giving 1h of grace after the UI shows "Fermé".
 */
export function getBettingDeadline(weekStartDate: string): Date {
  const start = new Date(weekStartDate);
  const deadline = new Date(start);
  deadline.setUTCHours(23, 0, 0, 0); // Monday 23:00 UTC = midnight Paris time
  return deadline;
}

/**
 * Calculate the end of the current betting season (1st of next month, 00:00 UTC).
 * Bettor rankings are accumulated monthly and reset on the 1st.
 * Handles December -> January rollover.
 */
export function getSeasonEndDate(now?: Date): Date {
  const d = now ?? new Date();
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  // Next month: if December (11), wrap to January of next year
  return new Date(Date.UTC(month === 11 ? year + 1 : year, (month + 1) % 12, 1, 0, 0, 0, 0));
}

/**
 * Calculate the end of the current race season (last day of the month, 23:59:59 UTC).
 * Competitor ELO rankings reset at the end of the month.
 * Handles December -> January rollover.
 */
export function getRaceSeasonEndDate(now?: Date): Date {
  const d = now ?? new Date();
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  // Day 0 of next month = last day of current month
  return new Date(Date.UTC(month === 11 ? year + 1 : year, (month + 1) % 12, 0, 23, 59, 59, 999));
}
