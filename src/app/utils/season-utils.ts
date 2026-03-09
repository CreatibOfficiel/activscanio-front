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

/** Return the ISO week range for a given season. */
export function getSeasonWeeks(seasonNumber: number): { start: number; end: number } {
  const firstAbsoluteWeek = (seasonNumber - 1) * WEEKS_PER_SEASON;
  const start = APP_START_WEEK + firstAbsoluteWeek;
  const end = start + WEEKS_PER_SEASON - 1;
  return { start, end };
}

/**
 * Get the Monday of a given ISO week.
 * ISO week 1 contains January 4th; weeks start on Monday.
 */
export function getMondayOfWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday=0
  const firstMonday = new Date(Date.UTC(year, 0, 4 - jan4Day));
  return new Date(firstMonday.getTime() + (week - 1) * 604800000);
}

/**
 * Get the end date of the current season (Sunday 23:59:59.999 UTC of the last week).
 */
export function getCurrentSeasonEndDate(now?: Date): Date {
  const d = now ?? new Date();
  const currentSeason = getSeasonNumber(getISOWeek(d), getISOYear(d));
  const { end } = getSeasonWeeks(currentSeason);
  // Sunday = Monday of `end` week + 6 days
  const monday = getMondayOfWeek(APP_START_YEAR, end);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

/** Get the start and end dates for a given season number. */
export function getSeasonDateRange(seasonNumber: number): { start: Date; end: Date } {
  const { start: startWeek, end: endWeek } = getSeasonWeeks(seasonNumber);
  const start = getMondayOfWeek(APP_START_YEAR, startWeek);
  const endMonday = getMondayOfWeek(APP_START_YEAR, endWeek);
  const end = new Date(endMonday.getTime() + 6 * 86400000); // Sunday
  return { start, end };
}

const SHORT_MONTHS = [
  "janv.", "fév.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/** Format a season date range like "10 fév. — 9 mars 2026". */
export function formatSeasonDateRange(seasonNumber: number): string {
  const { start, end } = getSeasonDateRange(seasonNumber);
  const startDay = start.getUTCDate();
  const startMonth = SHORT_MONTHS[start.getUTCMonth()];
  const endDay = end.getUTCDate();
  const endMonth = SHORT_MONTHS[end.getUTCMonth()];
  const endYear = end.getUTCFullYear();

  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${startDay} — ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} — ${endDay} ${endMonth} ${endYear}`;
}

/** Approximate total seasons per year. */
export const TOTAL_SEASONS = Math.ceil(52 / WEEKS_PER_SEASON);
