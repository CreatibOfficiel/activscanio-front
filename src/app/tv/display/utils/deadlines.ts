/**
 * Calculate the betting deadline (Thursday 23:59 UTC) from a week's start date.
 * The startDate is the Monday of the betting week, so deadline = startDate + 3 days + 23h59m59s.
 */
export function getBettingDeadline(weekStartDate: string): Date {
  const start = new Date(weekStartDate);
  const deadline = new Date(start);
  deadline.setUTCDate(deadline.getUTCDate() + 3); // Monday -> Thursday
  deadline.setUTCHours(23, 59, 59, 999);
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
