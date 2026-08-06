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
 * Group the leaderboard into the API's three tiers.
 *
 * Everyone the API returned is placed somewhere: a player who cannot find
 * themselves on the board assumes the app forgot them, which is worse than
 * seeing themselves unranked.
 *
 * SUPERSEDED ON THE PHONE by `buildPingpongBoard`, which ranks everyone and
 * marks the uncertain instead of withholding a number from them. This is kept
 * — unchanged, not deprecated — because the TV board still reads its tiers and
 * branches its entire layout on `ranked.length`. Feeding that board a list
 * where all 8 players are "ranked" would flip it into its two-column mode
 * without anyone having looked at the result. The two shapes are allowed to
 * coexist precisely because they answer different questions: this one reports
 * what the API decided, `buildPingpongBoard` decides what to show.
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
 * Is this rating one we are prepared to state as fact?
 *
 * Reads `provisional` — the API's own answer, computed from the weighted
 * match count and the deviation — rather than re-deriving it from `rd` here.
 * A second opinion on the same question drifts the first time either side
 * moves its bar, and that has already happened once: the API's bar went from
 * 8 matches to 5 and every "sur 8" string in this app was left behind.
 *
 * Inactivity deliberately does NOT make a rating uncertain. An inactive
 * player has a settled number that is merely stale — we know how well they
 * play, we do not know whether they still do. That is a different claim, and
 * the row says it a different way (dimmed, not marked).
 */
export function isConfident(player: PingpongPlayer): boolean {
  return !player.provisional;
}

/** One line of the board: a player, their position, and how sure we are. */
export interface PingpongBoardRow {
  player: PingpongPlayer;
  /** Contiguous from 1. Everyone gets one — see `buildPingpongBoard`. */
  position: number;
  /** The rating is still calibrating and the position is a best guess. */
  uncertain: boolean;
}

export interface PingpongBoard {
  /** Every visible player, strongest first, numbered from 1. */
  rows: PingpongBoardRow[];
  /** The top three, when three settled ratings exist to draw from. */
  podium: PingpongPlayer[];
  /** How many ratings are settled. Not how many are shown — that is `rows`. */
  confidentCount: number;
  isEmpty: boolean;
}

export interface PingpongBoardOptions {
  podiumSize?: number;
  /**
   * How many CONFIDENT players a podium needs. Not how many players — see the
   * podium reasoning in `buildPingpongBoard`.
   */
  minConfidentForPodium?: number;
  includeArchived?: boolean;
}

/**
 * The leaderboard as one ranked list, with uncertainty stated rather than
 * used to exclude.
 *
 * REVERSES the gate `segmentPingpongLeaderboard` implements. That function is
 * still here, unchanged, and still returns the three tiers: the TV board reads
 * them and branches its whole layout on `ranked.length`. Changing it in place
 * would have re-laid-out a screen this work was not scoped to touch, blind,
 * with 8 players suddenly "ranked" flipping it into its two-column mode. So
 * the reversal is additive and the phone board opts in.
 *
 * WHY THE GATE WENT. Measured in production after a full recompute, the API's
 * rule (5 weighted matches AND rd ≤ 200) admitted 2 of 8 players in an office
 * of 8 — and it had just been LOOSENED from 8/150, which admitted zero. Don
 * Joran and Maxime missed by 1 match and 2 rd points respectively. A
 * leaderboard showing a quarter of its league is not a strict leaderboard, it
 * is a broken one, and the people it excludes are the ones most in need of a
 * reason to keep playing.
 *
 * Glickman's argument for RD is that it lets you state confidence rather than
 * withhold a number; Lichess ships exactly that, showing provisional players
 * with a `?` beside their rating. Everyone is on the board, and the rating
 * says how much to trust it.
 *
 * Sorted on `conservativeScore` (rating − 2×RD), NOT on the API's `rank`.
 * The rank only exists for the gated few and orders them among themselves, so
 * reading it would float a settled 1381 over four unsettled ratings above it.
 * The conservative score already penalises a wide deviation, which is what
 * makes a single list across mixed confidence defensible at all: a player with
 * one match and a huge RD sinks on their own, without a rule saying so.
 */
export function buildPingpongBoard(
  players: PingpongPlayer[],
  options: PingpongBoardOptions = {},
): PingpongBoard {
  const {
    podiumSize = 3,
    minConfidentForPodium = 3,
    includeArchived = false,
  } = options;

  const visible = includeArchived
    ? players
    : players.filter((player) => !player.archived);

  const rows = [...visible]
    .sort((a, b) => b.conservativeScore - a.conservativeScore)
    .map((player, index) => ({
      player,
      position: index + 1,
      uncertain: !isConfident(player),
    }));

  /**
   * The podium is gated on CONFIDENCE, not on how many rows exist.
   *
   * The old rule was three ranked players, and once everyone is ranked that
   * is satisfied by any three — which on today's data would crown Valentin,
   * one match played, rd 287, on the strength of a single result. A card with
   * a photo and a gold badge is a much stronger claim than a numbered row: the
   * list says "first by rating so far", the podium says "champion". A podium
   * celebrating someone with one game is worse than no podium.
   *
   * Inactive players are excluded from it as well. Their rating is settled
   * enough to rank — that is decided above — but a podium is a claim about
   * the present, and nobody has seen them for a fortnight.
   *
   * The consequence is deliberate and it bites today: the real league gets no
   * podium until three people have played five matches each. A podium that
   * appears in week one and reshuffles completely in week two teaches everyone
   * the ranking is noise.
   */
  const crownable = rows
    .filter((row) => isConfident(row.player) && !row.player.inactive)
    .map((row) => row.player);

  const podium =
    crownable.length >= minConfidentForPodium
      ? crownable.slice(0, podiumSize)
      : [];

  return {
    rows,
    podium,
    confidentCount: visible.filter(isConfident).length,
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
 * Weighted matches a rating needs before the API calls it settled.
 *
 * Mirrors `PROVISIONAL_MIN_MATCHES` in the API's `pingpong-classification.ts`.
 * It was 8 there and 8 here; the API lowered it to 5 and this side was not
 * followed, so every screen said "3 matchs sur 8" while the server settled
 * ratings at 5. Exported so the three components that render the figure read
 * one constant instead of each declaring their own — which is how the drift
 * happened.
 */
export const MATCHES_TO_CALIBRATE = 5;

/**
 * How far through calibration a player is, from 0 to 1.
 *
 * Reads the weighted count, the same number the API gates on — the raw
 * count would show someone at 100% while the API still calls them
 * provisional.
 */
export function calibrationProgress(
  player: PingpongPlayer,
  matchesRequired = MATCHES_TO_CALIBRATE,
): number {
  return Math.min(1, player.weightedMatchCount / matchesRequired);
}
