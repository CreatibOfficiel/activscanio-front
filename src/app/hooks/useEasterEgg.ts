'use client';

import { useRef, useCallback } from 'react';

interface UseEasterEggOptions {
  targetTaps: number;
  timeWindow: number;
  onUnlock: () => void;
}

export function useEasterEgg({
  targetTaps,
  timeWindow,
  onUnlock,
}: UseEasterEggOptions) {
  const tapsRef = useRef<number[]>([]);
  const unlockedRef = useRef(false);

  const handleTap = useCallback(() => {
    if (unlockedRef.current) return;

    const now = Date.now();
    tapsRef.current.push(now);

    // Filter out taps outside the time window
    tapsRef.current = tapsRef.current.filter(
      (tapTime) => now - tapTime <= timeWindow
    );

    if (tapsRef.current.length >= targetTaps) {
      unlockedRef.current = true;
      tapsRef.current = [];
      onUnlock();
    }
  }, [targetTaps, timeWindow, onUnlock]);

  const reset = useCallback(() => {
    tapsRef.current = [];
    unlockedRef.current = false;
  }, []);

  return { handleTap, reset };
}
