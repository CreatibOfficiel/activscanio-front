import { RefObject, useEffect, useRef } from "react";

interface UseAutoScrollOptions {
  delay?: number;
  speed?: number;
  enabled?: boolean;
}

/**
 * Auto-scrolls a container from top to bottom after a delay.
 * Resets on every `resetKey` change (e.g. view rotation).
 */
export function useAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  resetKey: number,
  { delay = 5000, speed = 150, enabled = true }: UseAutoScrollOptions = {}
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
      const overflow = el.scrollHeight - el.clientHeight;
      if (overflow <= 0) return;

      const duration = (overflow / speed) * 1000;
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
  }, [containerRef, resetKey, delay, speed, enabled]);
}
