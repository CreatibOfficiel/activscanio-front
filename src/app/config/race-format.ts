/**
 * The Mario Kart 8 Deluxe race format, in one place.
 *
 * Mirror of `mushroom-bet-api/src/config/race-format.config.ts`. The two files
 * are not shared at build time and must be edited together.
 *
 * These are game rules, not application choices: Nintendo owns them, and they
 * move. The September 2026 Switch 2 update (4.0.0) raised local split-screen
 * from 4 to 8 players without touching anything else.
 */

/** Total finishers on the results screen, humans and CPUs alike. */
export const MAX_RANK = 12;

/** Lowest score a finisher can be credited with on the cup results screen. */
export const MIN_SCORE = 0;

/** Highest reachable cup score: 4 races at 15 points. */
export const MAX_SCORE = 60;

/** A flawless cup — first place in all four races. */
export const PERFECT_SCORE = 60;

/** A race worth recording needs at least two humans to compare. */
export const MIN_HUMAN_PLAYERS = 2;

/**
 * Humans on a single console.
 *
 * Four until the 4.0.0 update of September 2026, which added 5-8 player
 * split-screen on Switch 2.
 */
export const MAX_HUMAN_PLAYERS = 8;
