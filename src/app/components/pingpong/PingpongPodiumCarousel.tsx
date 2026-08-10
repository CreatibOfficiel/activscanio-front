'use client';

import { FC } from 'react';
import { PingpongPlayer } from '../../models/Pingpong';
import { PingpongBoardRow } from '../../utils/pingpong-leaderboard';
import PingpongPodiumCard from './PingpongPodiumCard';

interface PingpongPodiumCarouselProps {
  /**
   * The top three, straight from `buildPingpongBoard`'s `podiumRows`. Empty
   * below three players — the board already decides that, and deciding again
   * here would give two places an opinion on the same question.
   *
   * ROWS, not bare players. The podium is gated on POSITION now, so a crowned
   * player may be provisional: `player.rank` is null for them, and a card
   * reading it would badge a gold 1 as a grey 0. The row carries the position
   * the badge draws, and the `uncertain` flag the `?` draws.
   */
  podium: PingpongBoardRow[];
  onSelect?: (player: PingpongPlayer) => void;
  className?: string;
}

/**
 * The top three: a scrollable strip on a phone, a static row on a desktop.
 *
 * ON MOBILE the third card is clipped by about a third rather than fitted:
 * three cards of 132 px plus two 7 px gaps come to 410 px against a 344 px
 * content box, so the clip is what overflow does on its own. That is the
 * affordance, and it is honest — there really is something to the right. No
 * arrow, no fade, nothing decorative pretending to more content than exists.
 *
 * ABOVE THE BREAKPOINT IT IS A 3-UP GRID, NOT A CAROUSEL. Reported as "sur
 * pc, il faut centrer le podium sur la page": the strip sat left-aligned in a
 * wide viewport and read as broken. NN/g is explicit that horizontal scroll on
 * a large screen is poorly discovered — "users often have no idea that they
 * can discover content by 'swiping' on large screens" — and acceptable only
 * for secondary content. Three cards is not overload, so the carousel's whole
 * justification is absent here: there is room for all three, and nothing to
 * hide.
 *
 * The grid sits in a max-width box with `mx-auto`, so it is centred BY
 * CONSTRUCTION rather than by a rule that could drift from the one that sizes
 * it. That is what fixes the reported alignment. The card design is identical
 * across breakpoints; only this container changes.
 *
 * The scroller's own behaviours are switched off with it — `sm:snap-none`,
 * `sm:touch-auto`, `sm:overflow-visible`. Scroll-snap and a pinned pan axis
 * describe a scroller; left on a static grid they are dead declarations that
 * mislead whoever reads this next.
 *
 * `role="group"` rather than `role="list"`: the cards are buttons, and "list,
 * 3 items" over three buttons announces the wrong shape.
 *
 * The scroller is not a tab stop. Cards are, and focusing one scrolls it
 * into view natively, so the clipped card is reachable without adding a stop
 * that does nothing when you land on it.
 *
 * `touch-pan-x` pins the gesture to the axis this strip actually scrolls.
 * Left to itself the browser arbitrates between panning the strip and
 * scrolling the page, and it resolves ambiguous, mostly-vertical drags in
 * favour of the page — which cancels the pointer stream the cards' tap guard
 * is reading. Naming the axis means the guard and the browser are deciding
 * the same thing about the same gesture.
 */
const PingpongPodiumCarousel: FC<PingpongPodiumCarouselProps> = ({
  podium,
  onSelect,
  className = '',
}) => {
  if (podium.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={`Podium — ${podium.length} premiers joueurs`}
      tabIndex={-1}
      className={`
        -mr-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x
        sm:mr-0 sm:overflow-visible sm:snap-none sm:touch-auto
        ${className}
      `}
    >
      {/* One track, two layouts. `flex` overflows on a phone and produces the
          clipped third card; above the breakpoint the grid takes over and the
          max-width box centres it. */}
      <div className="flex gap-[0.4375rem] pr-4 sm:grid sm:grid-cols-3 sm:gap-3 sm:pr-0 sm:mx-auto sm:max-w-lg">
        {podium.map((row) => (
          <PingpongPodiumCard
            key={row.player.id}
            player={row.player}
            position={row.position}
            uncertain={row.uncertain}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default PingpongPodiumCarousel;
