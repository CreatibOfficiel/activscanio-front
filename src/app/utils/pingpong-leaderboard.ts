import { PingpongPlayer } from '../models/Pingpong';

/**
 * The leaderboard, split into the three groups it is displayed in.
 *
 * The API already decides who is ranked, calibrating or inactive and hands
 * back a `rank` — this only groups what it sent. Recomputing the tiers here
 * would give two sources of truth for the same question, and they would
 * drift the first time a threshold changed on one side.
 */
export interface PingpongSegmentation {
  /** Settled ratings, in rank order. */
  ranked: PingpongPlayer[];
  /** Not enough matches yet. Visible, but without a rank. */
  calibrating: PingpongPlayer[];
  /** No match for two weeks. Visible, dimmed, without a rank. */
  inactive: PingpongPlayer[];
  /** The top three, when there are enough ranked players to warrant one. */
  podium: PingpongPlayer[];
  /** Ranked players below the podium. */
  rest: PingpongPlayer[];
  /** Nobody has played at all. */
  isEmpty: boolean;
}

export interface PingpongSegmentationOptions {
  /**
   * How many ranked players a podium needs before it is worth showing.
   * Below this the list reads better flat — a podium of one is a pedestal.
   */
  minPodiumSize?: number;
  podiumSize?: number;
  /** Players idle for six months. Hidden unless asked for. */
  includeArchived?: boolean;
}

/**
 * Group the leaderboard for display.
 *
 * Everyone the API returned is placed somewhere: a player who cannot find
 * themselves on the board assumes the app forgot them, which is worse than
 * seeing themselves unranked.
 */
export function segmentPingpongLeaderboard(
  players: PingpongPlayer[],
  options: PingpongSegmentationOptions = {},
): PingpongSegmentation {
  const {
    minPodiumSize = 3,
    podiumSize = 3,
    includeArchived = false,
  } = options;

  const visible = includeArchived
    ? players
    : players.filter((player) => !player.archived);

  // Ranked players carry a number; sort on it rather than re-deriving a
  // score, so the client and the API cannot disagree about the order.
  const ranked = visible
    .filter((player) => player.rank !== null)
    .sort((a, b) => (a.rank as number) - (b.rank as number));

  // Everyone else, most promising first. Inactive players keep a settled
  // rating, so the conservative score still orders them meaningfully.
  const byScore = (a: PingpongPlayer, b: PingpongPlayer) =>
    b.conservativeScore - a.conservativeScore;

  const unranked = visible.filter((player) => player.rank === null);
  // An inactive player may also still be calibrating. Inactivity is the more
  // useful label for someone who has not been seen in two weeks, so it wins.
  const inactive = unranked.filter((player) => player.inactive).sort(byScore);
  const calibrating = unranked
    .filter((player) => !player.inactive)
    .sort(byScore);

  const hasPodium = ranked.length >= minPodiumSize;

  return {
    ranked,
    calibrating,
    inactive,
    podium: hasPodium ? ranked.slice(0, podiumSize) : [],
    rest: hasPodium ? ranked.slice(podiumSize) : ranked,
    isEmpty: visible.length === 0,
  };
}

/**
 * Win rate as a percentage, or null when there is nothing to divide.
 *
 * Null rather than 0: a player with no matches has no win rate, and showing
 * "0%" reads as having lost every game.
 */
export function winRate(player: PingpongPlayer): number | null {
  const played = player.wins + player.losses;
  if (played === 0) return null;
  return Math.round((player.wins / played) * 100);
}

/**
 * How far through calibration a player is, from 0 to 1.
 *
 * Reads the weighted count, the same number the API gates on — the raw
 * count would show someone at 100% while the API still withholds their rank.
 */
export function calibrationProgress(
  player: PingpongPlayer,
  matchesRequired = 8,
): number {
  return Math.min(1, player.weightedMatchCount / matchesRequired);
}
