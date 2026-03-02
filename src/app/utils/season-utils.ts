/**
 * Season utilities for 4-week fixed seasons (frontend).
 *
 * Seasons are 4-week blocks starting from the app launch week (ISO week 7, 2026).
 *   Season 1 = weeks 7–10
 *   Season 2 = weeks 11–14
 *   ...
 */

const APP_START_WEEK = 7;
const APP_START_YEAR = 2026;
const WEEKS_PER_SEASON = 4;

/** Get ISO week number for a date. */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / 604800000);
}

/** Get the ISO year for a date (the year of the Thursday of that week). */
function getISOYear(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  return target.getFullYear();
}

/** Map an ISO week number to a season number (1-based, from app start). */
export function getSeasonNumber(weekNumber: number, year: number = APP_START_YEAR): number {
  const yearOffset = (year - APP_START_YEAR) * 52;
  const absoluteWeek = yearOffset + weekNumber - APP_START_WEEK;
  return Math.floor(absoluteWeek / WEEKS_PER_SEASON) + 1;
}

/** Get the current season number based on today's date. */
export function getCurrentSeasonNumber(): number {
  const now = new Date();
  return getSeasonNumber(getISOWeek(now), getISOYear(now));
}

/** Get a display label like "Saison 3" for a given season number. */
export function getSeasonLabel(seasonNumber: number): string {
  return `Saison ${seasonNumber}`;
}

/** Approximate total seasons per year. */
export const TOTAL_SEASONS = Math.ceil(52 / WEEKS_PER_SEASON);
