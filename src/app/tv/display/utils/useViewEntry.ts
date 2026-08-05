import { useRef } from "react";

/**
 * Whether the rows on a TV board should play their entry animation.
 *
 * The boards are on an always-on wall panel and poll for fresh data every
 * five minutes. A poll that changes nothing remounts nothing, so it costs
 * no animation — but a poll that moves someone between ranks or tiers
 * hands React a different key set, and those rows remount and replay the
 * staggered slide-in in the middle of a dwell. Motion appears on screen
 * with nothing to explain it, which on signage reads as a glitch.
 *
 * Measured on the Mario Kart board with twelve confirmed drivers: an
 * identical poll remounts 0 of 9 rows, a single rank swap remounts 2, and
 * one driver going inactive remounts 3.
 *
 * The fix is to scope the animation to a view *entry* rather than to a
 * mount. `viewEntryKey` is the page's rotation counter: it changes when
 * the board comes on screen and at no other time. The first render for a
 * given key animates; every later render for that same key does not.
 *
 * A ref rather than state on purpose — this must not itself trigger a
 * render, and the answer is only ever consumed during the render that
 * asks for it.
 */
export function useViewEntry(viewEntryKey: number | undefined): boolean {
  const seenKey = useRef<number | undefined>(undefined);
  const initialised = useRef(false);

  // Undefined means the caller opted out of entry tracking (tests, or any
  // context with no rotation). Animate as before rather than silently
  // going still.
  if (viewEntryKey === undefined) return true;

  if (!initialised.current || seenKey.current !== viewEntryKey) {
    initialised.current = true;
    seenKey.current = viewEntryKey;
    return true;
  }

  return false;
}
