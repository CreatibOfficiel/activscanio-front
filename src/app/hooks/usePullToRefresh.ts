"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 80;
const RESISTANCE = 0.4;
const MAX_PULL = 150;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  isEnabled?: boolean;
}

interface UsePullToRefreshReturn {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  isEnabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled || isRefreshing) return;
      if (window.scrollY !== 0) return;

      // Don't interfere with scrolling inside modals
      const target = e.target as HTMLElement;
      if (target.closest('[aria-modal="true"]')) return;

      startY.current = e.touches[0].clientY;
      pulling.current = false;
    },
    [isEnabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled || isRefreshing) return;

      // Don't interfere with scrolling inside modals
      const target = e.target as HTMLElement;
      if (target.closest('[aria-modal="true"]')) return;

      if (window.scrollY > 0) {
        // User scrolled down, cancel any pull
        if (pulling.current) {
          pulling.current = false;
          setIsPulling(false);
          setPullDistance(0);
        }
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        e.preventDefault();
        pulling.current = true;
        setIsPulling(true);
        const distance = Math.min(diff * RESISTANCE, MAX_PULL);
        setPullDistance(distance);
      }
    },
    [isEnabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    setIsPulling(false);

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isPulling, pullDistance, isRefreshing };
}
