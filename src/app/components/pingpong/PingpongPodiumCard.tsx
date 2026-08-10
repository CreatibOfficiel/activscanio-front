'use client';

import { FC, MouseEvent, PointerEvent, useRef } from 'react';
import Image from 'next/image';
import { PingpongPlayer } from '../../models/Pingpong';
import { winRate } from '../../utils/pingpong-leaderboard';
import { getColorFromName, getInitials } from '../ui/UserAvatar';
import PodiumRankBadge from './PodiumRankBadge';
import { EloGlyph, WinRateGlyph } from './StatGlyphs';

interface PingpongPodiumCardProps {
  player: PingpongPlayer;
  /**
   * Where this player sits on the board, from 1. Drives the rank badge.
   *
   * NOT `player.rank`, which is what this used to read. The podium is gated
   * on position now rather than on confidence, so a crowned player may be
   * provisional — and the API sends `rank: null` for every one of those. The
   * badge would have fallen back to a grey 0 where a gold 1 belongs.
   */
  position: number;
  /**
   * The rating is still calibrating and this crown is a best guess.
   *
   * Meaningful only since the podium stopped gating on confidence. Before,
   * a crowned player was settled by construction and there was nothing to
   * qualify.
   */
  uncertain?: boolean;
  onSelect?: (player: PingpongPlayer) => void;
}

/**
 * How far a pointer may travel from where it pressed and still count as a
 * tap. The carousel scrolls horizontally under the same finger, so without a
 * threshold every flick would land on whichever card it started over and open
 * a dialog — on a phone, on every single interaction.
 *
 * 10 px is the usual slop: below a finger's own tremor on a tap, well below a
 * deliberate swipe.
 *
 * Measured as a running maximum over every pointermove, not as the press-to-
 * release delta. A drag that travels out and returns lands back on its origin
 * and nets zero; the maximum is the only figure that sees it.
 */
const TAP_SLOP_PX = 10;

/**
 * How long a press may last and still count as a tap.
 *
 * A finger resting on a card and lifting without moving passes the distance
 * test perfectly, and it is not a tap: it is the opening of a long-press, the
 * gesture that summons the platform's own context menu or image sheet. Opening
 * a modal underneath that is a second thing happening to one deliberate press.
 *
 * 500 ms sits above a hurried tap (~100 ms) and at the low end of the
 * platforms' own long-press thresholds — iOS fires its callout at ~500 ms,
 * Android at ~400 ms — so the card stops responding at roughly the moment the
 * OS starts.
 */
const TAP_MAX_DURATION_MS = 500;

/**
 * How long after a pointercancel a click is still assumed to belong to the
 * cancelled gesture.
 *
 * A cancelled gesture usually emits no click at all, so the cancellation
 * cannot simply be latched and left for a click to find — nothing would ever
 * clear it, and the next activation, keyboard included, would be swallowed by
 * a scroll that happened seconds earlier. Where a click does follow, it
 * follows immediately.
 *
 * 300 ms covers the compatibility click a browser may synthesise after the
 * gesture ends, and expires far below the interval between two deliberate
 * interactions.
 */
const CANCEL_GRACE_MS = 300;

/**
 * One of the top three.
 *
 * A `<button>`, not a div with a handler: the card opens the same detail
 * modal the list rows do, and a div is unreachable by keyboard. Enter and
 * Space come free with the element, and the browser scrolls a focused card
 * into view by itself — which is what makes the third card, deliberately
 * clipped to a ~45 px peek, reachable without a mouse.
 *
 * The accessible name carries the rank, the name and both stats, because on
 * screen every one of those is a graphic: a coloured squircle and two icon
 * glyphs. "Matéo 1124 63" would be what a screen reader got otherwise.
 *
 * The text sits on a flat scrim as well as a gradient. The reference's own
 * gradient measures 1.68:1 where the white name lands on a pale sky — a real
 * failure in the source image, not a hypothetical. A gradient cannot promise
 * a contrast ratio because it does not know what is underneath it; a flat
 * floor can, and it is the only reason this passes on a bright photo.
 *
 * THE RATING CAN CARRY A `?`, WHICH IT COULD NOT BEFORE. The podium used to
 * wait for three SETTLED ratings, so every crowned player was confident by
 * construction. It is gated on position now — on the measured production data
 * that crowns Valentin, one match played, in second — so the card has to say
 * how far to trust the number it is celebrating. Same convention as the list
 * rows and as Lichess: a `?` after the value, the value muted, nothing added
 * to the layout. A podium that makes a confident claim the data cannot
 * support is worse than one that qualifies itself.
 */
const PingpongPodiumCard: FC<PingpongPodiumCardProps> = ({
  player,
  position,
  uncertain = false,
  onSelect,
}) => {
  const rating = Math.round(player.conservativeScore);
  const rate = winRate(player);
  // A dash, not a zero: "0 %" reads as having lost every game, and someone
  // with no matches has no win rate at all.
  const rateLabel = rate === null ? '—' : String(rate);
  // Null between gestures. `maxTravel` accumulates across pointermove rather
  // than being recomputed from the release position.
  const press = useRef<{
    x: number;
    y: number;
    at: number;
    maxTravel: number;
  } | null>(null);
  // When the browser last claimed a gesture, or null. Held separately from the
  // press because a cancel ends the press but has to outlive it briefly — see
  // CANCEL_GRACE_MS.
  const cancelledAt = useRef<number | null>(null);

  // The board's position, not the API's rank — see the prop. The uncertainty
  // is spelled out here too: the `?` on screen is a glyph a screen reader
  // either skips or reads as punctuation.
  const label = [
    `Rang ${position}`,
    player.firstName,
    uncertain ? `${rating} ELO, estimation en cours` : `${rating} ELO`,
    rate === null ? 'aucun match joué' : `${rate} % de victoires`,
  ].join(', ');

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    press.current = {
      x: event.clientX,
      y: event.clientY,
      at: Date.now(),
      maxTravel: 0,
    };
    // A fresh press supersedes the last cancellation outright: the finger has
    // come back down, so whatever the browser took over before is finished.
    cancelledAt.current = null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = press.current;
    if (!current) return;

    current.maxTravel = Math.max(
      current.maxTravel,
      Math.hypot(event.clientX - current.x, event.clientY - current.y),
    );
  };

  /**
   * The browser has taken the gesture over — on touch that means it decided
   * the drag was a scroll. It stops sending pointermove from here, so the
   * travel we recorded is frozen at whatever it reached before the handover,
   * which on a fast flick can be almost nothing. Distance cannot rule that
   * out; only the fact of the cancel can.
   */
  const handlePointerCancel = () => {
    press.current = null;
    cancelledAt.current = Date.now();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onSelect) return;

    const current = press.current;
    // Consumed either way: a press belongs to one activation, and a stale one
    // left behind by an abandoned gesture must not colour the next click.
    press.current = null;

    const cancelled = cancelledAt.current;
    if (cancelled !== null && Date.now() - cancelled <= CANCEL_GRACE_MS) {
      cancelledAt.current = null;
      return;
    }

    // No press at all means the keyboard did this — Enter and Space report no
    // coordinates and open no gesture — and none of the pointer rules apply.
    if (current) {
      // The release position counts too: where the moves never arrived, it is
      // the only sample we have beyond the origin.
      const travelled = Math.max(
        current.maxTravel,
        Math.hypot(event.clientX - current.x, event.clientY - current.y),
      );
      // `!(travelled <= slop)`, not `travelled > slop`: a missing coordinate
      // makes the distance NaN, and every comparison against NaN is false, so
      // the plain form would wave the gesture through on exactly the events
      // we understand least.
      if (!(travelled <= TAP_SLOP_PX)) return;

      if (Date.now() - current.at > TAP_MAX_DURATION_MS) return;
    }

    onSelect(player);
  };

  return (
    <button
      type="button"
      data-testid="pingpong-podium-card"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      aria-label={label}
      className="
        relative w-[8.25rem] flex-shrink-0 snap-start aspect-[13/20]
        sm:w-full
        focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-primary-500
      "
    >
      {/* The badge overhangs the corner, so the photo's clipping box is an
          inner element rather than the card itself. */}
      <span className="absolute inset-0 overflow-hidden rounded-[14px] bg-neutral-800">
        {player.profilePictureUrl ? (
          <Image
            src={player.profilePictureUrl}
            alt=""
            fill
            sizes="132px"
            className="object-cover"
            style={{ objectPosition: 'center 30%' }}
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center text-2xl font-bold text-white ${getColorFromName(
              `${player.firstName} ${player.lastName}`,
            )}`}
            aria-hidden="true"
          >
            {getInitials(`${player.firstName} ${player.lastName}`)}
          </span>
        )}

        <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 via-33% to-transparent to-43%" />
      </span>

      <PodiumRankBadge
        rank={position}
        className="absolute -top-0 -right-[3px]"
      />

      <span
        data-testid="podium-text-floor"
        className="absolute inset-x-0 bottom-0 flex flex-col gap-1 rounded-b-[14px] bg-black/35 px-2 pt-2 pb-2"
      >
        <span className="truncate text-center text-lg font-[900] italic text-neutral-50">
          {player.firstName}
        </span>

        <span className="grid grid-cols-2">
          <span className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-0.5 text-[9px] font-medium tracking-wide text-neutral-50/75">
              <EloGlyph className="h-3 w-3" />
              ÉLO
            </span>
            {/* The `?` is decorative to a screen reader, which reads it as
                punctuation or skips it; the accessible name above carries
                the meaning in words. Muted with it, so the marker reads at a
                glance without adding anything to the card's layout. */}
            <span
              className={`text-base font-bold tabular-nums ${
                uncertain ? 'text-white/60' : 'text-white'
              }`}
            >
              {rating}
              {uncertain && <span aria-hidden="true">?</span>}
            </span>
          </span>

          <span className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-0.5 text-[9px] font-medium tracking-wide text-neutral-50/75">
              <WinRateGlyph className="h-3 w-3" />
              WIN
            </span>
            <span className="text-base font-bold tabular-nums text-white">
              {rateLabel}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
};

export default PingpongPodiumCard;
