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
 * Calculate the end of the current season (Sunday 23:59:59 UTC of the last week).
 * Seasons are 4-week blocks starting from app launch (ISO week 7, 2026).
 * Both bettor rankings and competitor ELO reset at season boundaries.
 */
export { getCurrentSeasonEndDate as getSeasonEndDate } from '../../../utils/season-utils';
export { getCurrentSeasonEndDate as getRaceSeasonEndDate } from '../../../utils/season-utils';
