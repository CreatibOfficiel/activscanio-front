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
  /**
   * The player's true rank, from 1. Every ACTIVE player gets one.
   *
   * Contiguous across `podiumRows` and `rows` TAKEN TOGETHER, not within
   * either: the podium holds 1-3 and the list picks up at 4. Nothing is
   * renumbered when a player moves between the two.
   *
   * Inactive players have no position at all — they are not in either list.
   * The numbering therefore closes over an absent player rather than leaving
   * their rank empty, which is the same thing the Mario Kart board does.
   */
  position: number;
  /** The rating is still calibrating and the position is a best guess. */
  uncertain: boolean;
}

export interface PingpongBoard {
  /**
   * The list under the podium: every active player NOT crowned, in rank order.
   *
   * Positions are true ranks, so this starts at 4 whenever a podium was
   * drawn and at 1 when none was. Deliberately not "every visible player":
   * the crowned three are in `podiumRows` and the absent are in `inactive` —
   * see the reasoning in `buildPingpongBoard`.
   */
  rows: PingpongBoardRow[];
  /** The top three by position, or empty below three players. */
  podium: PingpongPlayer[];
  /**
   * The same three as `podium`, carrying their position and confidence.
   *
   * The card needs both: it draws its rank badge from `position` rather than
   * from `player.rank`, which the API leaves null for every provisional
   * player and which would render a badge of 0 now that the podium admits
   * them. `podium` is kept alongside for callers that only want the players.
   */
  podiumRows: PingpongBoardRow[];
  /**
   * Players who have not played inside the inactivity window.
   *
   * Held OUT of `rows` and `podiumRows` and carrying no position: a ranking
   * is a claim about who is playing well now, and someone absent for two
   * weeks cannot make it. Ordered by conservative score so the section still
   * reads best-first, the same convention the Mario Kart board uses for its
   * own inactive section.
   */
  inactive: PingpongPlayer[];
  /**
   * How many ratings are settled, across the WHOLE board.
   *
   * Counted over every visible player — not just `rows`, which is missing
   * both the crowned three and the inactive. The page's subtitle describes
   * the whole screen, and all three groups are on it.
   */
  confidentCount: number;
  isEmpty: boolean;
}

export interface PingpongBoardOptions {
  podiumSize?: number;
  /**
   * How many players the board needs before a podium is worth drawing.
   *
   * Not how many CONFIDENT players — that gate is gone, and the option was
   * renamed rather than repurposed so a stale call site fails to compile
   * instead of silently meaning something new.
   */
  minPlayersForPodium?: number;
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
 *
 * THE PODIUM IS GATED ON POSITION, AND THE CROWNED THREE LEAVE THE LIST.
 * Third rule in this function's history, so the chain is written down once
 * rather than reconstructed from the three half-comments it replaces:
 *
 * 1. ORIGINALLY podium = top three RANKED players, lifted out into `rest`.
 *    Sound while "ranked" and "settled" were one fact, decided by the API.
 * 2. THEN numbering everyone split those apart, so the podium was re-gated on
 *    CONFIDENCE and stopped removing anyone — the crowned three need not be
 *    the list's top three, so lifting them out would have left gaps in a
 *    contiguous ranking.
 * 3. NOW back to position, with the removal restored.
 *
 * What killed (2) is what it did on screen: the same three faces rendered
 * twice, six inches apart, as cards and then again as rows 1-2-3 shuffled
 * among the players the podium had skipped. Reported as "on affiche les trois
 * personnes qui sont confirmés en mode podium et en dessous on les re afficher
 * dans la liste mélangés avec les gens non confirmés donc c'est ultra
 * perturbant."
 *
 * No precedent was found for a featured section selected on anything other
 * than position. Lichess and FIDE use confidence as an entry condition for the
 * WHOLE list, never to split one screen into two differently-sorted regions.
 * Chess.com does repeat rows in a featured block, but a page away; co-located
 * duplication reads as a bug, which is exactly how it was reported.
 *
 * Gating on position makes removal trivial and the numbering correct by
 * construction — the podium IS ranks 1-3, so `rows` resumes at 4 with no
 * renumbering and no gaps.
 *
 * THE COST IS REAL AND IS NOT WHAT THE BRIEF FOR THIS CHANGE ASSUMED. The
 * reasoning handed down was that the conservative score damps the fluke risk
 * by itself, so a one-match player never reaches the podium. It does not:
 * `conservativeScore` IS rating − 2×RD, so the deviation is already charged
 * against the number this sorts on, and charging it again would be double
 * counting. On the measured production data the podium is Charles, VALENTIN
 * (one match, rd 287) and Don Joran. That is the trade accepted here, and it
 * is why the card carries the `?` marker: the podium crowns a position and
 * says in the same breath how far to trust it.
 *
 * INACTIVE PLAYERS LEAVE THE RANKING ENTIRELY, into `inactive`. This reverses
 * the previous rule here, which kept them numbered inline and even let them
 * onto the podium; the reversal was asked for directly ("un systeme similaire
 * qu'il y a sur mario kart qui enleve les joueurs inactifs du classement au
 * bout de x jours") and brings this board in line with the Mario Kart one,
 * which has always parked its inactive competitors in their own section under
 * the ranking.
 *
 * The old rule's argument was that a stale rating is still the best estimate
 * of how someone plays. True, and beside the point: a leaderboard answers who
 * is playing well NOW, and someone who has not touched a bat in two weeks is
 * not answering it. Leaving them in means an absent player holds a position
 * against people who showed up, and holds it indefinitely — the rating never
 * decays on its own, so nothing displaces them.
 *
 * The objection this rule had to clear is the one that killed the previous
 * attempt at excluding people from the podium: skip a player mid-list and the
 * podium is no longer ranks 1-2-3, so `rows` cannot resume at 4 without gaps.
 * It does not apply here, because inactive players are removed BEFORE anything
 * is numbered rather than skipped during. What remains is renumbered 1..N with
 * no holes, and the section below carries no positions at all — so there is no
 * second numbering to disagree with the first.
 *
 * DELIBERATELY NOT ALSO SPLITTING OUT CALIBRATING PLAYERS, which is where this
 * board still departs from Mario Kart. On the measured production league the
 * confidence gate admits 2 of 8 players; pulling those six out as well would
 * leave a two-row "ranking", which is the exact failure the one-list board was
 * built to fix. A calibrating player is still playing and their `?` marker
 * already says how far to trust the number. Inactivity is a different claim —
 * not "we are unsure how good you are" but "you are not here" — and only the
 * second one justifies withholding a position.
 *
 * Archived players (six months idle) remain hidden altogether unless
 * `includeArchived` is set; they are not folded into `inactive`, which would
 * put a name nobody recognises at the bottom of every board.
 */
export function buildPingpongBoard(
  players: PingpongPlayer[],
  options: PingpongBoardOptions = {},
): PingpongBoard {
  const {
    podiumSize = 3,
    minPlayersForPodium = 3,
    includeArchived = false,
  } = options;

  const visible = includeArchived
    ? players
    : players.filter((player) => !player.archived);

  const byScore = (a: PingpongPlayer, b: PingpongPlayer) =>
    b.conservativeScore - a.conservativeScore;

  // Split before numbering, not during. Skipping inactive players inside the
  // loop would leave holes in the positions; taking them out first means what
  // remains is 1..N by construction.
  const active = visible.filter((player) => !player.inactive);
  const inactive = visible.filter((player) => player.inactive).sort(byScore);

  const ordered = [...active].sort(byScore).map((player, index) => ({
    player,
    position: index + 1,
    uncertain: !isConfident(player),
  }));

  // Below three there is nothing to crown: a podium of one or two is a
  // pedestal, and removing them would leave the list holding nothing at all.
  // Counted over the ACTIVE players, since they are the only candidates —
  // three players of whom two are away is a one-man podium.
  const hasPodium = ordered.length >= minPlayersForPodium;
  const podiumRows = hasPodium ? ordered.slice(0, podiumSize) : [];

  return {
    // The complement, not a re-sort. Positions are carried over from
    // `ordered`, so the first row under a podium says 4 and means it.
    rows: hasPodium ? ordered.slice(podiumSize) : ordered,
    podium: podiumRows.map((row) => row.player),
    podiumRows,
    inactive,
    // Still counted over every visible player, inactive included: the
    // subtitle describes the screen, and the inactive section is on it.
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
