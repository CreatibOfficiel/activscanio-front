'use client';

import { FC } from 'react';
import { PingpongPlayer } from '../../models/Pingpong';
import PingpongPodiumCard from './PingpongPodiumCard';

interface PingpongPodiumCarouselProps {
  /**
   * The top three, straight from `segmentPingpongLeaderboard`. Empty below
   * three ranked players — the segmentation's `minPodiumSize` already
   * decides that, and deciding again here would give two places an opinion
   * on the same question.
   */
  podium: PingpongPlayer[];
  onSelect?: (player: PingpongPlayer) => void;
  className?: string;
}

/**
 * The top three, as a scrollable strip of cards.
 *
 * The third card is clipped by about a third rather than fitted: three cards
 * of 132 px plus two 7 px gaps come to 410 px against a 344 px content box,
 * so the clip is what overflow does on its own. That is the affordance, and
 * it is honest — there really is something to the right. No arrow, no fade,
 * nothing decorative pretending to more content than exists.
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
      className={`-mr-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x ${className}`}
    >
      <div className="flex gap-[0.4375rem] pr-4">
        {podium.map((player) => (
          <PingpongPodiumCard
            key={player.id}
            player={player}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default PingpongPodiumCarousel;
