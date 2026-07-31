export interface RankMovement {
  direction: 'up' | 'down';
  /** How many places, always positive. */
  places: number;
}

export interface RankMovementInput {
  rank: number | null;
  /** The rank captured at the start of the window. */
  previousRank: number | null | undefined;
  /** When this player last raced or played a match. */
  lastActiveAt: string | Date | null | undefined;
  now?: Date;
}

/**
 * How long after playing a movement still counts as yours.
 *
 * Two days rather than one: the comparison rank is captured at the start of
 * the day, so a match played yesterday evening is exactly what moved it.
 */
const ACTIVITY_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Should this player see a movement arrow, and which way?
 *
 * The rule is not "did your rank change" but "did YOU do something".
 *
 * In a 25-person office roughly half of all rank changes happen to people
 * who did not play: A wins, overtakes B, and B's row would sprout a red
 * arrow for a day they were not even there. Simulating a season with fixed
 * true skill put passive movements at 46% of the total, split almost evenly
 * between passive climbs and passive falls.
 *
 * So the arrow belongs to the player, not the table. It appears only for
 * someone who played inside the window. That costs the passive climber
 * their arrow too, which is the honest price: their rank number still
 * changes on screen — that is the information — while the arrow only claims
 * a reason, and in their case the reason was somebody else.
 *
 * No surveyed app shows a persistent "you fell" mark driven by another
 * person's activity. Strava sends a lost-KOM notification privately, and
 * Duolingo says "someone passed you" without ever naming them.
 */
export function rankMovement({
  rank,
  previousRank,
  lastActiveAt,
  now = new Date(),
}: RankMovementInput): RankMovement | null {
  // Unranked at either end: nothing to compare. A null previous rank means
  // "held no rank", not "was last", so treating it as a climb from the
  // bottom would invent a movement that never happened.
  if (rank === null || previousRank === null || previousRank === undefined) {
    return null;
  }
  if (rank === previousRank) return null;

  if (!lastActiveAt) return null;
  const lastActive =
    lastActiveAt instanceof Date ? lastActiveAt : new Date(lastActiveAt);
  if (Number.isNaN(lastActive.getTime())) return null;

  const idleMs = now.getTime() - lastActive.getTime();
  if (idleMs > ACTIVITY_WINDOW_MS) return null;

  return {
    direction: previousRank > rank ? 'up' : 'down',
    places: Math.abs(previousRank - rank),
  };
}
