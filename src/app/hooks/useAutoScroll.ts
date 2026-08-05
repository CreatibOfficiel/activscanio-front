import { RefObject, useEffect, useRef } from "react";

/**
 * Speed bounds, in px/s.
 *
 * The floor is the rate this hook used to run at unconditionally. Keeping it
 * as a floor means a short list never scrolls *slower* than it used to just
 * because the dwell happens to be generous — a seven-player ping-pong board
 * inching down over twenty seconds reads as a broken animation, not a calm
 * one. Below the floor the list simply finishes early and rests at the
 * bottom, which is the intended look.
 *
 * The ceiling is a readability limit, not a performance one. Past roughly
 * 400 px/s a name is off the screen before it can be read, so scrolling
 * faster stops conveying anything. When a list is too long to fit even at
 * the ceiling we deliberately clamp and let the scroll land short of the
 * bottom rather than blur past everyone: an unreadable complete pass is
 * worse than a readable partial one. Truncating the list instead was the
 * alternative and it is worse — silently dropping the bottom ranks off a
 * leaderboard is a data lie, whereas a partial scroll is at most an
 * incomplete view of something honest.
 */
export const MIN_SCROLL_SPEED = 150;
export const MAX_SCROLL_SPEED = 400;

/**
 * Time to sit at the bottom once the scroll lands, in ms.
 *
 * Reserved out of the dwell budget rather than taken from it. Without this
 * the scroll finishes on the exact frame the view rotates away, so the last
 * rows are technically shown and practically unreadable.
 */
export const SCROLL_END_PAUSE = 1500;

interface UseAutoScrollOptions {
  delay?: number;
  speed?: number;
  enabled?: boolean;
  /**
   * Total time this view stays on screen, in ms. When supplied, the scroll
   * speed is derived from it so the pass finishes before the rotation; when
   * omitted, `speed` is used as a fixed rate exactly as before.
   */
  budget?: number;
}

/**
 * Chooses a scroll rate for a given travel distance.
 *
 * Exported for testing: jsdom reports every element as 0x0, so overflow is
 * unobservable through the hook and this decision could not otherwise be
 * asserted on directly.
 *
 * Returns null when there is nothing to scroll, which the caller uses as the
 * signal to not animate at all.
 */
export function deriveScrollSpeed(
  overflow: number,
  {
    budget,
    delay = 5000,
    speed = MIN_SCROLL_SPEED,
  }: { budget?: number; delay?: number; speed?: number },
): number | null {
  if (overflow <= 0) return null;

  // No budget: existing callers keep the fixed rate they asked for.
  if (budget === undefined) return speed;

  // What is actually left for travelling, once the pause before the scroll
  // starts and the rest at the bottom are both paid for.
  const travelMs = budget - delay - SCROLL_END_PAUSE;

  // A budget too small to contain its own overheads (a very short
  // `?interval=`) leaves nothing to derive from; cover what we can at the
  // ceiling rather than divide by zero or crawl.
  if (travelMs <= 0) return MAX_SCROLL_SPEED;

  const required = (overflow / travelMs) * 1000;

  return Math.min(Math.max(required, MIN_SCROLL_SPEED), MAX_SCROLL_SPEED);
}

/**
 * Auto-scrolls a container from top to bottom after a delay.
 * Resets on every `resetKey` change (e.g. view rotation).
 *
 * Pass `budget` (the view's dwell time) to have the speed fit the content
 * into the time available; without it the scroll runs at a fixed `speed`
 * and a long list is cut off mid-pass when the view rotates.
 */
export function useAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  resetKey: number,
  {
    delay = 5000,
    speed = MIN_SCROLL_SPEED,
    enabled = true,
    budget,
  }: UseAutoScrollOptions = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset scroll position on every key change
    el.scrollTop = 0;

    if (!enabled) return;

    timerRef.current = setTimeout(() => {
      // Measured after the delay, not before: the rows animate in on view
      // entry, so the height is only settled by the time we start moving.
      const overflow = el.scrollHeight - el.clientHeight;

      const resolvedSpeed = deriveScrollSpeed(overflow, { budget, delay, speed });
      if (resolvedSpeed === null) return;

      const duration = (overflow / resolvedSpeed) * 1000;
      const start = performance.now();

      function easeInOut(t: number): number {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el!.scrollTop = overflow * easeInOut(progress);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef, resetKey, delay, speed, enabled, budget]);
}
