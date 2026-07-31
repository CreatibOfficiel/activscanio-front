import { Competitor } from '../models/Competitor';
import { PingpongPlayer } from '../models/Pingpong';
import type { CompetitorStats } from '../profile/page';

/**
 * Personal bests: the numbers nobody else can move.
 *
 * The app celebrates rank, and a rank is zero-sum. In a 25-person office
 * half the players are in the bottom half by construction, and the only way
 * up is for someone else to go down. A record is not like that. Strava,
 * Peloton, Garmin and Apple Fitness all run the same two surfaces over one
 * event: a comparative leaderboard anyone can displace, and a personal best
 * nobody can touch. Strava's own words — medals are "awarded for your best
 * personal performances", kept separate from the leaderboard.
 *
 * Every function here answers to one test: can another person's activity
 * change this number? If yes, it does not belong in this file. That is why
 * each function takes a single competitor and never a list — there is no
 * other player's data in scope to accidentally read.
 *
 * Null, never 0, when there is no data. Inherited from `winRate` in
 * `pingpong-leaderboard.ts`: "0%" reads as having lost everything, and
 * "meilleure position : 0" is not a position at all.
 *
 * Deliberately absent, and why:
 *
 * - Peak rating. Glicko-2 falls as well as rises, and the RD decay cron
 *   drops a rating over a holiday nobody played through. A peak you have
 *   fallen below is a goal you have already failed.
 * - "Most improved". It is a ranking wearing a medal's clothes: one winner,
 *   24 losers, gameable by sandbagging, and structurally unwinnable for a
 *   top-4 player — which is exactly what makes it read as a consolation
 *   prize. No major fitness platform ships it.
 * - Volume counters (races played, matches played). The achievement system
 *   already covers those, with better copy than a bare number.
 */

/** A recent-form reading, always relative to the player's own history. */
export interface FormReading {
  /** Mean of the recent finishing positions. Lower is better. */
  recentAvg: number;
  /** The player's own lifetime mean. The only baseline used. */
  lifetimeAvg: number;
  /**
   * Distance between the two, as a positive magnitude in places.
   * The sign lives in `direction` so a display cannot render "-2" for an
   * improvement and have it read as a loss.
   */
  delta: number;
  direction: 'better' | 'worse' | 'level';
}

export interface StreakReading {
  best: number;
  current: number;
  /** The current run has equalled the record. Worth saying out loud. */
  isAtBest: boolean;
}

export interface PersonalBests {
  bestPosition: number | null;
  form: FormReading | null;
  streak: StreakReading | null;
  setsRatio: number | null;
  /** Nothing to celebrate yet. Drives the invitation, not an empty box. */
  isEmpty: boolean;
}

export interface PersonalBestsInput {
  competitor: Competitor | null;
  stats: CompetitorStats | null;
  pingpongPlayer: PingpongPlayer | null;
}

/**
 * Below this, a difference in average placing is float noise rather than
 * form. A tenth of a place is not something anyone felt.
 */
const FORM_LEVEL_THRESHOLD = 0.1;

/**
 * Positions the API can hand back that are not places anyone finished in.
 * A 0 leaking through would otherwise become an unbeatable record.
 */
function usablePositions(positions: number[] | undefined): number[] {
  return (positions ?? []).filter((p) => Number.isFinite(p) && p > 0);
}

/**
 * The best finishing position on record.
 *
 * Lower is better: 1 is a win. Nobody else's race can raise this number, and
 * a bad run cannot lower it — which is the whole point of putting it here.
 */
export function bestFinishingPosition(
  competitor: Competitor | null,
): number | null {
  if (!competitor) return null;
  const positions = usablePositions(competitor.recentPositions);
  if (positions.length === 0) return null;
  return Math.min(...positions);
}

/**
 * Recent placing against the player's own lifetime placing.
 *
 * The comparison is entirely internal. A player improving from a lifetime
 * average of 8th to a recent 6th has improved, whatever everyone else did
 * that week — and that reading is available to the 20th-placed player on
 * exactly the same terms as the 2nd.
 *
 * Direction is computed as `lifetimeAvg - recentAvg`, positive when the
 * recent average sits higher up the field. Getting that subtraction the
 * wrong way round would congratulate players for sliding down the order.
 */
export function currentForm(competitor: Competitor | null): FormReading | null {
  if (!competitor) return null;

  const positions = usablePositions(competitor.recentPositions);
  if (positions.length === 0) return null;

  const lifetimeAvg = competitor.lifetimeAvgRank;
  // 0 is the profile page's fallback for "no races", not a perfect average.
  // Comparing against it would report every player as wildly declining.
  if (lifetimeAvg == null || !Number.isFinite(lifetimeAvg) || lifetimeAvg <= 0) {
    return null;
  }

  const recentAvg = positions.reduce((sum, p) => sum + p, 0) / positions.length;
  const improvement = lifetimeAvg - recentAvg;

  const direction =
    Math.abs(improvement) < FORM_LEVEL_THRESHOLD
      ? 'level'
      : improvement > 0
        ? 'better'
        : 'worse';

  return {
    recentAvg,
    lifetimeAvg,
    delta: Math.abs(improvement),
    direction,
  };
}

/**
 * The longest run of participation ever strung together.
 *
 * Attendance, not results. Someone who shows up every day owns this number
 * outright: no opponent's win can shorten it and no rating decay touches it.
 */
export function bestStreak(stats: CompetitorStats | null): StreakReading | null {
  if (!stats) return null;

  const best = stats.bestPlayStreak ?? 0;
  // Not 0: a "record : 0" is a medal for never having turned up.
  if (best <= 0) return null;

  const current = stats.playStreak ?? 0;

  return {
    best,
    current,
    isAtBest: current > 0 && current >= best,
  };
}

/**
 * Share of ping-pong sets taken, as a whole percentage.
 *
 * Sets rather than matches: a set won in a lost match still happened, and
 * counting them gives a player who loses close matches something true to
 * read. Null with no sets played, for the `winRate` reason.
 */
export function setsWonRatio(player: PingpongPlayer | null): number | null {
  if (!player) return null;

  const played = (player.setsWon ?? 0) + (player.setsLost ?? 0);
  if (played === 0) return null;

  return Math.round((player.setsWon / played) * 100);
}

/**
 * Everything the section renders, in one pass.
 *
 * `isEmpty` is true only when not a single best could be computed. One
 * available medal is enough to show the section — requiring all four would
 * blank it for everyone in their first week, which is precisely the player
 * this feature exists for.
 */
export function buildPersonalBests(input: PersonalBestsInput): PersonalBests {
  const bestPosition = bestFinishingPosition(input.competitor);
  const form = currentForm(input.competitor);
  const streak = bestStreak(input.stats);
  const setsRatio = setsWonRatio(input.pingpongPlayer);

  return {
    bestPosition,
    form,
    streak,
    setsRatio,
    isEmpty:
      bestPosition === null &&
      form === null &&
      streak === null &&
      setsRatio === null,
  };
}
