"use client";

import { FC, RefObject, useMemo } from "react";
import TVHeroPodium from "./TVHeroPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import { PingpongPlayer } from "@/app/models/Pingpong";
import { formatCompetitorName } from "@/app/utils/formatters";
import { rankMovement } from "@/app/utils/rank-movement";
import {
  calibrationProgress,
  MATCHES_TO_CALIBRATE,
  segmentPingpongLeaderboard,
  winRate,
} from "@/app/utils/pingpong-leaderboard";
import { useViewEntry } from "../utils/useViewEntry";

/**
 * Module-level, not an inline literal.
 *
 * A fresh `{}` on every render is a fresh identity, which defeats the memo
 * around the segmentation and re-derives the whole board on every tick of
 * the parent's rotation timer. `usePingpongLeaderboard` documents the same
 * trap for the same reason.
 */
const SEGMENTATION_OPTIONS = { minPodiumSize: 3, podiumSize: 3 };

/**
 * How many ranked players each layout is for.
 *
 * Fixed tiers rather than a row height that scales with the count: rows
 * that resize when one person joins never look designed, and a wall screen
 * is read at a glance where "this looks different today" is noise.
 *
 * Named so the thresholds can be retuned without touching the render. The
 * office is 21 people, so the sparse tiers are the ones that actually ship
 * for months, not the dense one.
 */
export const LAYOUT_TIERS = {
  /** At or above this, the two-column split with a hero podium earns its keep. */
  SPLIT_COLUMN_MIN_RANKED: 8,
} as const;

/**
 * Row entry stagger, in milliseconds per row.
 *
 * 40 rather than the 80 the Mario Kart board uses: at 80ms a twelve-row
 * board is still assembling itself a second after the view appears, and on
 * a screen with a 15-second dwell that is a tenth of the slot spent on
 * motion. Capped below so a long board does not stretch the cascade.
 */
const ROW_STAGGER_MS = 40;
/** Longest the whole cascade may run, however many rows there are. */
const MAX_CASCADE_MS = 400;

function staggerFor(index: number): number {
  return Math.min(index * ROW_STAGGER_MS, MAX_CASCADE_MS);
}

/**
 * The ceiling every progress bar is drawn against.
 *
 * `segmentPingpongLeaderboard` does not return one, unlike the Mario Kart
 * segmenter, so it is computed here — over the visible players only, since
 * an archived player nobody can see would silently shorten every bar on
 * screen.
 *
 * The empty case is not theoretical: this runs inside a `useMemo`, and a
 * hook cannot sit behind the early return that handles an empty board, so
 * it is called with an empty list every time the board is empty.
 * `Math.max()` of nothing is `-Infinity`, which is truthy — a row handed
 * that would draw a bar instead of omitting one, and every bar on the board
 * would read 0% with nothing reporting why.
 *
 * Exported so that branch can be asserted directly. Through the DOM it is
 * invisible: the only input that reaches it also triggers the empty state,
 * which renders no rows and therefore no bars.
 */
export function computeMaxScore(visible: PingpongPlayer[]): number {
  return visible.length
    ? Math.max(...visible.map((p) => p.conservativeScore))
    : 0;
}

interface Props {
  players: PingpongPlayer[];
  /**
   * The scrollable column, owned by the page so `useAutoScroll` can drive
   * it. Without attaching this the view silently stops auto-scrolling —
   * nothing errors, the board simply never moves past the first screenful.
   */
  scrollRef?: RefObject<HTMLDivElement | null>;
  /**
   * The page's rotation counter. Changes only when this board comes on
   * screen, which is the one moment the entry animation belongs to. Omit
   * it to animate on every mount, as before.
   */
  viewEntryKey?: number;
}

/**
 * The ping-pong board on the office TV.
 *
 * A sibling of `CompetitorRankingsView`, not a generalisation of it. The two
 * share `TVLeaderboardRow` and `TVHeroPodium`, which take plain view-models
 * and know nothing about either sport, but they share no field names, no
 * tiering rule and no notion of what a rank means. Merging them would mean a
 * component branching on a sport flag in a dozen places.
 *
 * No leagues. The Mario Kart board groups its confirmed players into
 * "Formule 1", "Karting" and "Vélo à roulettes" — motorsport metaphors that
 * are apt over a kart race and read as a rendering bug over a ping-pong
 * table. The tiers here are the ones the API already decides: ranked,
 * calibrating, inactive.
 *
 * Amber rather than the Mario Kart cyan. Both boards share the same
 * gradient ground, row geometry and podium mechanics on purpose — they are
 * the same product — so the accent hue is what tells someone walking past
 * which board they are looking at. Amber reads as a ball and sits about as
 * far from cyan as a warm hue can; reds oversaturate on TV panels.
 */
export const PingpongRankingsView: FC<Props> = ({ players, scrollRef, viewEntryKey }) => {
  const isViewEntry = useViewEntry(viewEntryKey);

  const segmentation = useMemo(
    () => segmentPingpongLeaderboard(players, SEGMENTATION_OPTIONS),
    [players],
  );

  const { ranked, calibrating, inactive, podium, rest, isEmpty } = segmentation;

  const maxScore = useMemo(
    () => computeMaxScore([...ranked, ...calibrating, ...inactive]),
    [ranked, calibrating, inactive],
  );

  /**
   * Which layout this board gets, keyed on how many players are ranked.
   *
   * The 45/55 split exists to put a podium beside a peloton. With five
   * ranked players the "peloton" is two rows floating next to a podium, and
   * signage guidance for pass-by viewing is one content zone per screen —
   * so below the threshold the board becomes a single full-width column and
   * drops the podium entirely.
   */
  const useSplitColumn = ranked.length >= LAYOUT_TIERS.SPLIT_COLUMN_MIN_RANKED;

  /** The trend arrow, or none. */
  const trendFor = (player: PingpongPlayer) => {
    // Only for someone who played inside the window. Roughly half the rank
    // changes in a pool this size happen to people who were not there, and
    // an arrow on their row credits them with someone else's match. See
    // rank-movement for the full reasoning.
    const movement = rankMovement({
      rank: player.rank,
      previousRank: player.previousDayRank,
      lastActiveAt: player.lastMatchAt,
    });
    // rankMovement never returns "stable", so a null becomes no arrow at
    // all — which is what the TV rows already do for an absent trend.
    return {
      trend: movement?.direction,
      trendValue: movement?.places,
    };
  };

  /** Subtitle for a ranked or inactive player: their record. */
  const recordSubtitle = (player: PingpongPlayer): string => {
    const rate = winRate(player);
    const record = `${player.wins}V ${player.losses}D`;
    return rate === null ? record : `${record} · ${rate}%`;
  };

  const rowItem = (player: PingpongPlayer, rank: number) => ({
    id: player.id,
    rank,
    name: formatCompetitorName(player.firstName, player.lastName),
    imageUrl: player.profilePictureUrl,
    characterImageUrl: player.characterVariant?.imageUrl,
    score: Math.round(player.conservativeScore),
    scoreLabel: "ELO",
    subtitle: recordSubtitle(player),
    maxScore,
    ...trendFor(player),
  });

  const podiumItems = useMemo(
    () =>
      podium.map((player) => ({
        id: player.id,
        name: formatCompetitorName(player.firstName, player.lastName),
        imageUrl: player.profilePictureUrl,
        characterImageUrl: player.characterVariant?.imageUrl,
        score: Math.round(player.conservativeScore),
        scoreLabel: "ELO",
        subtitle: recordSubtitle(player),
        rank: player.rank ?? 1,
      })),
    [podium],
  );

  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">Aucun joueur trouvé</p>
      </div>
    );
  }

  /**
   * The ranked players that get an ordinary row.
   *
   * `rest` when a podium is on screen, since the segmenter has already
   * excluded the top three from it. Below three ranked players `podium` is
   * empty and `rest` holds everyone, so that fallback comes for free — a
   * `.length >= 3` check here would be a second place to decide the same
   * thing, and the two would disagree the first time one changed.
   *
   * The layout tier is a separate question the segmenter knows nothing
   * about: it can hand back a podium of three that this board has decided
   * not to draw. Rendering `rest` regardless would drop the three leaders
   * off a sparse board entirely, which is exactly what happened.
   */
  const rowedPlayers = useSplitColumn ? rest : ranked;

  const rankedRows = (
    <div className="space-y-3 w-full">
      {rowedPlayers.map((player, index) => (
        <TVLeaderboardRow
          key={player.id}
          item={rowItem(player, player.rank ?? index + 1)}
          animationDelay={staggerFor(index)}
          disableEntryAnimation={!isViewEntry}
        />
      ))}
    </div>
  );

  /**
   * Calibrating players.
   *
   * Not a fallback — for the first weeks of the season this is the whole
   * board, and an empty screen would teach the office that ping-pong on the
   * TV is broken rather than new. The big platforms do hide provisional
   * players, but they have millions of accounts to fill a board with; this
   * one has twenty-one people.
   *
   * No rank number and no implied position: the API withholds a rank for a
   * reason, and inventing one here would state something it refused to. The
   * bar shows progress toward the eight matches that earn one. A bar rather
   * than the text "3/8" — at this size, from across the room, small text is
   * not read.
   *
   * Ordered by matches played, which is honest: it ranks progress, not skill.
   */
  const calibratingSection = calibrating.length > 0 && (
    <div className="space-y-4 w-full pt-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-amber-500/30" />
        <h3 className="text-lg font-semibold uppercase tracking-wider text-amber-300/80">
          Calibrage
        </h3>
        <div className="h-px flex-1 bg-amber-500/30" />
      </div>
      <div className="space-y-3">
        {[...calibrating]
          .sort((a, b) => b.weightedMatchCount - a.weightedMatchCount)
          .map((player, index) => {
            const progress = calibrationProgress(player, MATCHES_TO_CALIBRATE);
            return (
              <div
                key={player.id}
                data-testid="tv-row"
                className={`flex items-center gap-3 py-2 px-4 rounded-xl relative overflow-hidden
                           border border-amber-400/30 bg-linear-to-r from-amber-950/30 via-neutral-900/40 to-neutral-900/20
                           ${isViewEntry ? "animate-row-slide-in" : ""}`}
                style={
                  isViewEntry
                    ? { animationDelay: `${staggerFor(index)}ms` }
                    : undefined
                }
              >
                {/* No rank. The gap is the signal, and a number here would
                    claim a position the API deliberately withheld. */}
                {/* w-14 to match TVLeaderboardRow's widened rank column, so
                    avatars stay on one vertical line across both row kinds. */}
                <div className="w-14 flex-shrink-0 text-center">
                  <span className="sr-only">Non classé</span>
                </div>

                <div className="w-11 h-11 rounded-full bg-amber-900/40 ring-2 ring-amber-500/40 flex items-center justify-center text-lg font-bold text-amber-100 flex-shrink-0">
                  {player.firstName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-grow min-w-0">
                  <h4
                    data-testid="tv-row-name"
                    className="text-2xl font-bold text-white truncate leading-tight"
                  >
                    {formatCompetitorName(player.firstName, player.lastName)}
                  </h4>
                  <div className="mt-1.5 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      data-testid="tv-calibration-progress"
                      className="h-full bg-linear-to-r from-amber-600 to-amber-400 rounded-full"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>

                {/* Sized to match TVLeaderboardRow's score block. */}
                <div className="text-right min-w-[96px]">
                  <div className="text-3xl font-black text-amber-400">
                    {Math.round(
                      progress * MATCHES_TO_CALIBRATE,
                    )}
                    <span className="text-neutral-500">
                      /{MATCHES_TO_CALIBRATE}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase text-neutral-500 tracking-wider">
                    matchs
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  /**
   * Inactive players.
   *
   * Kept on the board, dimmed. Someone who cannot find a colleague assumes
   * the board is stale; the dimming says they have not played in a fortnight
   * without removing them from the office.
   */
  const inactiveSection = inactive.length > 0 && (
    <div className="space-y-4 w-full pt-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-700" />
        <h3 className="text-lg font-semibold text-neutral-500 uppercase tracking-wider">
          Inactifs
        </h3>
        <div className="h-px flex-1 bg-neutral-700" />
      </div>
      {/* Desaturated, not dimmed — matching the Mario Kart board. Alpha here
          put the row subtitle at 2.50:1, under the 4.5:1 floor. */}
      <div className="space-y-3 tv-row-muted">
        {inactive.map((player, index) => (
          <TVLeaderboardRow
            key={player.id}
            item={rowItem(player, player.rank ?? ranked.length + index + 1)}
            animationDelay={staggerFor(index)}
            disableEntryAnimation={!isViewEntry}
          />
        ))}
      </div>
    </div>
  );

  const title = (
    <h2 className="text-3xl font-black italic text-amber-400 mb-6 text-center drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
      🏓 Ping-pong
    </h2>
  );

  // Sparse board: one full-width column, no podium. Two zones for five
  // players leaves an orphan row beside a pedestal.
  if (!useSplitColumn) {
    return (
      <div
        ref={scrollRef}
        className="max-w-[1200px] mx-auto w-full h-full overflow-y-auto scrollbar-hide flex flex-col"
      >
        <div className="my-auto w-full">
          {title}
          <div className="space-y-8">
            {rankedRows}
            {calibratingSection}
            {inactiveSection}
          </div>
        </div>
      </div>
    );
  }

  // Dense board: mirrors the Mario Kart split so the two read as one product.
  return (
    <div className="flex flex-row gap-8 max-w-[1800px] mx-auto w-full h-full overflow-hidden">
      <div className="w-[45%] flex flex-col items-center justify-center shrink-0">
        {title}
        <div className="w-full">
          <TVHeroPodium items={podiumItems} />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="w-[55%] overflow-y-auto scrollbar-hide flex flex-col"
      >
        <div className="my-auto">
          <div className="space-y-8">
            {rankedRows}
            {calibratingSection}
            {inactiveSection}
          </div>
        </div>
      </div>
    </div>
  );
};
