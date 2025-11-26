/**
 * Application constants
 */

/**
 * French month names
 */
export const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

/**
 * Bet position labels (using enum string values as keys)
 */
export const BET_POSITION_LABELS = {
  first: '1er',
  second: '2ème',
  third: '3ème',
} as const;

/**
 * Race constraints
 */
export const RACE_CONSTRAINTS = {
  MIN_COMPETITORS: 3,
  MAX_COMPETITORS: 100,
  MIN_RANK: 1,
} as const;

/**
 * Betting constraints
 */
export const BETTING_CONSTRAINTS = {
  MIN_PODIUM_SELECTIONS: 3,
  BOOST_MULTIPLIER: 2,
} as const;
