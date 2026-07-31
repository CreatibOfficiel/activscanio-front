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
  /**
   * Rank held at the start of the day, for the movement indicator.
   *
   * Written daily by the API's rank-snapshot cron. Null when the player
   * carried no rank at capture time, which is not the same as having been
   * last — rankMovement treats the two differently.
   */
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

/**
 * Just enough of a player to name them on a match.
 *
 * A trimmed shape, not a whole `PingpongPlayer`: a match card renders a name
 * and an avatar, and a fifty-row history has no use for rd, vol, streaks or a
 * rank. The API sends exactly these five fields on each side of a match.
 */
export interface PingpongMatchPlayer {
  id: string;
  competitorId: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
}

export interface PingpongMatch {
  id: string;
  playerAId: string;
  playerBId: string;
  /**
   * The two sides, embedded by the API.
   *
   * Null when the player row could not be loaded — archived, deleted, or a
   * relation the database could not resolve. A consumer must render a
   * placeholder rather than assume a name, which is why this is nullable
   * instead of optional: `undefined` slips through a template silently,
   * `null` has to be handled.
   *
   * `playerAId` / `playerBId` stay alongside them. They are what `winnerId`
   * is compared against, and a null player must not cost the winner check.
   */
  playerA: PingpongMatchPlayer | null;
  playerB: PingpongMatchPlayer | null;
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

/**
 * One day's rating, for the history chart.
 *
 * Field names mirror the API entity exactly. An earlier version of this
 * interface declared `recordedAt` and `conservativeScore`, neither of which
 * the API sends — a chart reading them would have plotted `undefined`
 * without any error, because the response is cast rather than parsed.
 */
export interface PingpongEloSnapshot {
  id: string;
  playerId: string;
  /** ISO date, day precision. One snapshot per player per day. */
  date: string;
  rating: number;
  rd: number;
  vol: number;
  matchCount: number;
}

/**
 * Someone who can be picked for a match, whether or not they have played.
 *
 * `playerId` is null until their first match, which is when enrolment
 * happens. The entry form sends `competitorId`; the API enrols both sides
 * before recording.
 */
export interface SelectablePlayer {
  competitorId: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  playerId: string | null;
}

/**
 * The strongest opponent this player has beaten.
 *
 * Monotone by construction: it reads only matches the player won, and only
 * the opponent's rating from BEFORE that match. Nothing anyone else does
 * can lower it — which is the whole point, since a rank is zero-sum and
 * half a 25-person office sits in its bottom half by construction.
 *
 * Deliberately not a peak rating: a Glicko-2 rating falls as well as rises,
 * and the decay cron lowers one during a holiday. A summit you have dropped
 * below is a goal you have already failed.
 */
export interface PingpongBestWin {
  matchId: string;
  opponentId: string;
  /** The opponent's rating before the match, not after. */
  opponentRating: number;
  /** The player's own rating before that match, for the gap. Null if unknown. */
  playerRating: number | null;
  playedAt: string;
  opponent: {
    id: string;
    competitorId: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
  } | null;
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
