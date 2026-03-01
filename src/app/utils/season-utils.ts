/**
 * Season utilities for 4-week fixed seasons (frontend).
 *
 * Season layout (13 seasons per year, aligned on ISO weeks):
 *   Season 1  = weeks 1-4
 *   Season 2  = weeks 5-8
 *   ...
 *   Season 12 = weeks 45-48
 *   Season 13 = weeks 49-53 (absorbs the occasional week 53)
 */

/** Get ISO week number for a date. */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / 604800000);
}

/** Map an ISO week number (1-53) to a season number (1-13). */
export function getSeasonNumber(weekNumber: number): number {
  return Math.min(Math.ceil(weekNumber / 4), 13);
}

/** Get the current season number based on today's date. */
export function getCurrentSeasonNumber(): number {
  return getSeasonNumber(getISOWeek(new Date()));
}

/** Get a display label like "Saison 3" for a given season number. */
export function getSeasonLabel(seasonNumber: number): string {
  return `Saison ${seasonNumber}`;
}

/** Total number of seasons per year. */
export const TOTAL_SEASONS = 13;
