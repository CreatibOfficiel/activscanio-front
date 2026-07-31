import { CharacterVariant } from './Character';

/* -------- Principal types -------- */

/**
 * One set, from player A's point of view.
 *
 * A and B are the two sides of the table as recorded, not "me" and "them" —
 * the same match reads the same whoever opens it.
 */
export interface SetScore {
  a: number;
  b: number;
}

/**
 * A player's standing on the ping-pong leaderboard.
 *
 * The rating is on its own scale and is never comparable to a Mario Kart
 * rating: the two measure different things and share only a starting value.
 */
export interface PingpongPlayer {
  id: string;
  competitorId: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  characterVariant?: CharacterVariant | null;
  rating: number;
  rd: number;
  vol: number;
  /** Rating − 2×RD. What the leaderboard actually sorts on. */
  conservativeScore: number;
  matchCount: number;
  /**
   * Sum of applied weights, not a raw count. Repeat matches against the same
   * opponent in one week count for less, so this is the number that decides
   * whether a rating has left calibration.
   */
  weightedMatchCount: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  currentStreak: number;
  bestStreak: number;
  lastMatchAt: string | null;
  previousDayRank: number | null;
  /** Still calibrating: fewer than 8 weighted matches, or RD above 150. */
  provisional: boolean;
  /** No match for 14 days. Still shown, but without a rank. */
  inactive: boolean;
  /** No match for 180 days. Hidden from the default view. */
  archived: boolean;
  isRankingEligible: boolean;
  /**
   * Distinct opponents over the last three weeks, and how evenly the matches
   * were spread (0 = one opponent only, 1 = perfectly even). Shown as a
   * badge; neither figure withholds a rank.
   */
  distinctOpponents21d: number;
  diversityScore21d: number;
  /** Null when the player carries no rank. */
  rank: number | null;
}

export interface PingpongMatch {
  id: string;
  playerAId: string;
  playerBId: string;
  winnerId: string;
  sets: SetScore[];
  playedAt: string;
  /** How much this match counted toward the rating, from 0 to 1. */
  appliedWeight: number;
  /** True when the gap was wide enough that ratings were pinned. */
  ratingFrozen: boolean;
  ratingABefore: number;
  ratingAAfter: number;
  ratingBBefore: number;
  ratingBAfter: number;
}

export interface PingpongHeadToHead {
  playerAId: string;
  playerBId: string;
  winsA: number;
  winsB: number;
  matches: PingpongMatch[];
}

export interface PingpongEloSnapshot {
  id: string;
  playerId: string;
  rating: number;
  rd: number;
  conservativeScore: number;
  recordedAt: string;
}

/* -------- Request payloads -------- */

export interface RecordMatchPayload {
  playerAId: string;
  playerBId: string;
  /** Two or three sets, from player A's point of view. */
  sets: SetScore[];
  playedAt?: string;
}

/* -------- Scoring rules -------- */

/**
 * Sets needed to take a match. Best of three.
 *
 * Official table tennis plays best of five or seven; three is a lunch-break
 * compromise, and the only rule here that departs from the ITTF.
 */
export const SETS_TO_WIN = 2;
export const MAX_SETS = 3;

/**
 * Is this a legal set score?
 *
 * A set goes to 11, but from 10-10 it runs until someone leads by two — so
 * 11-9 is legal and 11-10 is not, while 13-11 is legal and 13-10 is not.
 *
 * Mirrors `isValidSetScore` in the API. Kept here so the entry form can
 * refuse an impossible score without a round trip; the server validates
 * again regardless.
 */
export function isValidSetScore(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0) return false;
  if (a === b) return false;

  const winner = Math.max(a, b);
  const loser = Math.min(a, b);

  if (winner === 11) return loser <= 9;
  if (winner > 11) return winner - loser === 2;
  return false;
}

export interface MatchValidation {
  valid: boolean;
  /** Set indices that are individually impossible. */
  invalidSetIndices: number[];
  /** 'A' | 'B' once someone has taken two sets. */
  winner: 'A' | 'B' | null;
  setsA: number;
  setsB: number;
  /** Human-readable reason, for the form to show. Null when valid. */
  error: string | null;
}

/**
 * Check a whole match: legal scores, and a legal shape.
 *
 * Rejects a third set played after the match was already decided — a 2-0 is
 * over, and recording a third set means someone mistyped.
 */
export function validateMatchSets(sets: SetScore[]): MatchValidation {
  const invalidSetIndices = sets
    .map((set, i) => (isValidSetScore(set.a, set.b) ? -1 : i))
    .filter((i) => i !== -1);

  const base: MatchValidation = {
    valid: false,
    invalidSetIndices,
    winner: null,
    setsA: 0,
    setsB: 0,
    error: null,
  };

  if (sets.length < SETS_TO_WIN) {
    return { ...base, error: 'Il faut au moins 2 sets' };
  }
  if (sets.length > MAX_SETS) {
    return { ...base, error: 'Un match se joue au maximum en 3 sets' };
  }
  if (invalidSetIndices.length > 0) {
    return { ...base, error: 'Un score de set est impossible' };
  }

  let setsA = 0;
  let setsB = 0;
  for (const [i, set] of sets.entries()) {
    // Reaching two sets ends the match, so anything after it is a mistake.
    if (setsA === SETS_TO_WIN || setsB === SETS_TO_WIN) {
      return {
        ...base,
        setsA,
        setsB,
        error: `Le match était déjà terminé avant le set ${i + 1}`,
      };
    }
    if (set.a > set.b) setsA += 1;
    else setsB += 1;
  }

  if (setsA < SETS_TO_WIN && setsB < SETS_TO_WIN) {
    return { ...base, setsA, setsB, error: 'Aucun joueur n’a gagné 2 sets' };
  }

  return {
    valid: true,
    invalidSetIndices: [],
    winner: setsA > setsB ? 'A' : 'B',
    setsA,
    setsB,
    error: null,
  };
}

/**
 * Does the match need another set to be decided?
 *
 * Drives the entry form: two sets are asked for up front, and the third
 * appears only when the first two were split.
 */
export function needsDecidingSet(sets: SetScore[]): boolean {
  const played = sets.filter((s) => isValidSetScore(s.a, s.b));
  if (played.length !== 2) return false;

  const setsA = played.filter((s) => s.a > s.b).length;
  return setsA === 1;
}
