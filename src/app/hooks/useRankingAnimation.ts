'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Competitor } from '@/app/models/Competitor';
import { computeRanksWithTies } from '@/app/utils/rankings';

/* -------- Types -------- */

export type AnimationPhase =
  | 'idle'
  | 'showing-old'
  | 'shuffling'
  | 'crossfading'
  | 'done';

export interface CompetitorAnimData {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  conservativeScore: number;
  oldRank: number;
  newRank: number;
  delta: number; // positive = moved up, negative = moved down
  isNew: boolean; // new competitor not in old snapshot
}

interface RankingSnapshot {
  rankings: Array<{ id: string; rank: number }>;
  timestamp: number;
}

export interface UseRankingAnimationOptions {
  mode: 'homepage' | 'tv';
  competitors: Competitor[]; // confirmed, sorted by score
  enabled?: boolean; // false while loading
}

export interface UseRankingAnimationReturn {
  animationPhase: AnimationPhase;
  displayOrder: CompetitorAnimData[];
  showUniformCards: boolean;
  changedIds: Set<string>;
  onTransitionComplete: () => void;
  isAnimating: boolean;
}

/* -------- Constants -------- */

const STORAGE_KEY = 'mushroom-rankings-snapshot';
const SESSION_KEY = 'rankings-animation-played';
const SHOWING_OLD_DURATION = 500;
const CROSSFADE_DURATION = 400;
const SHUFFLE_DURATION = 1200;

/* -------- Helpers -------- */

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readSnapshot(): RankingSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RankingSnapshot;
  } catch {
    return null;
  }
}

function writeSnapshot(competitors: Competitor[], ranksMap: Map<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    const snapshot: RankingSnapshot = {
      rankings: competitors.map((c) => ({
        id: c.id,
        rank: ranksMap.get(c.id) ?? 0,
      })),
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // silently fail
  }
}

function hasPlayedThisSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function markPlayedThisSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, 'true');
}

function buildCurrentRanksMap(competitors: Competitor[]): Map<string, number> {
  return computeRanksWithTies(
    competitors,
    (c) => c.conservativeScore ?? 0,
    (c) => c.id,
  );
}

function buildOldRankMap(
  mode: 'homepage' | 'tv',
  competitors: Competitor[],
): Map<string, number> | null {
  if (mode === 'homepage') {
    const snapshot = readSnapshot();
    if (!snapshot) return null;
    const map = new Map<string, number>();
    snapshot.rankings.forEach((r) => map.set(r.id, r.rank));
    return map;
  }

  // TV mode: use previousDayRank
  const hasPreviousRanks = competitors.some((c) => c.previousDayRank != null);
  if (!hasPreviousRanks) return null;

  const map = new Map<string, number>();
  competitors.forEach((c) => {
    if (c.previousDayRank != null) {
      map.set(c.id, c.previousDayRank);
    }
  });
  return map;
}

function hasRankChanges(
  oldRanks: Map<string, number>,
  newRanks: Map<string, number>,
  competitors: Competitor[],
): boolean {
  for (const c of competitors) {
    const oldR = oldRanks.get(c.id);
    const newR = newRanks.get(c.id);
    if (oldR != null && newR != null && oldR !== newR) {
      return true;
    }
  }
  return false;
}

function buildAnimData(
  competitors: Competitor[],
  oldRanks: Map<string, number>,
  newRanks: Map<string, number>,
): CompetitorAnimData[] {
  return competitors.map((c) => {
    const oldRank = oldRanks.get(c.id);
    const newRank = newRanks.get(c.id) ?? 0;
    const isNew = oldRank == null;

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      profilePictureUrl: c.profilePictureUrl,
      conservativeScore: c.conservativeScore ?? 0,
      oldRank: isNew ? newRank : oldRank,
      newRank,
      delta: isNew ? 0 : oldRank - newRank,
      isNew,
    };
  });
}

/* -------- Hook -------- */

export function useRankingAnimation({
  mode,
  competitors,
  enabled = true,
}: UseRankingAnimationOptions): UseRankingAnimationReturn {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [animData, setAnimData] = useState<CompetitorAnimData[]>([]);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasInitializedRef = useRef(false);
  const prevCompetitorsRef = useRef<Competitor[]>([]);
  const pendingCompetitorsRef = useRef<Competitor[] | null>(null);
  const phaseRef = useRef<AnimationPhase>('idle');
  phaseRef.current = phase;

  // Clear all timers
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Save snapshot (homepage only)
  const saveSnapshot = useCallback(
    (comps: Competitor[]) => {
      if (mode !== 'homepage') return;
      const ranksMap = buildCurrentRanksMap(comps);
      writeSnapshot(comps, ranksMap);
    },
    [mode],
  );

  // Run the animation sequence
  const runAnimation = useCallback(
    (comps: Competitor[], data: CompetitorAnimData[]) => {
      clearTimers();
      setAnimData(data);
      setPhase('showing-old');

      const t1 = setTimeout(() => {
        setPhase('shuffling');

        const t2 = setTimeout(() => {
          setPhase('crossfading');

          const t3 = setTimeout(() => {
            setPhase('done');
            saveSnapshot(comps);
            if (mode === 'homepage') {
              markPlayedThisSession();
            }
          }, CROSSFADE_DURATION);

          timersRef.current.push(t3);
        }, SHUFFLE_DURATION);

        timersRef.current.push(t2);
      }, SHOWING_OLD_DURATION);

      timersRef.current.push(t1);
    },
    [mode, saveSnapshot, clearTimers],
  );

  // Core: attempt to start animation for a given set of competitors
  const tryAnimate = useCallback(
    (comps: Competitor[], bypassSessionDedup = false) => {
      if (!enabled || comps.length === 0) return;

      // Reduced motion: skip animation, just save
      if (prefersReducedMotion()) {
        saveSnapshot(comps);
        if (mode === 'homepage') markPlayedThisSession();
        return;
      }

      // If animation is currently running, queue the update
      const currentPhase = phaseRef.current;
      if (currentPhase !== 'idle' && currentPhase !== 'done') {
        pendingCompetitorsRef.current = comps;
        return;
      }

      const newRanks = buildCurrentRanksMap(comps);
      const oldRanks = buildOldRankMap(mode, comps);

      // No old data: first visit — save and skip
      if (!oldRanks) {
        saveSnapshot(comps);
        if (mode === 'homepage') markPlayedThisSession();
        return;
      }

      // Homepage session dedup (bypass for WebSocket updates)
      if (mode === 'homepage' && !bypassSessionDedup && hasPlayedThisSession()) {
        return;
      }

      // Check if rankings actually changed
      if (!hasRankChanges(oldRanks, newRanks, comps)) {
        return;
      }

      // Build animation data and start
      const data = buildAnimData(comps, oldRanks, newRanks);
      const changed = new Set<string>();
      data.forEach((d) => {
        if (d.delta !== 0 && !d.isNew) changed.add(d.id);
      });
      setChangedIds(changed);

      runAnimation(comps, data);
    },
    [enabled, mode, runAnimation, saveSnapshot],
  );

  // Process pending update when animation completes
  useEffect(() => {
    if (phase === 'done' && pendingCompetitorsRef.current) {
      const pending = pendingCompetitorsRef.current;
      pendingCompetitorsRef.current = null;
      // Small delay to let 'done' phase settle before starting new animation
      const timer = setTimeout(() => {
        tryAnimate(pending, true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [phase, tryAnimate]);

  // Main effect: detect competitor changes and trigger animation
  useEffect(() => {
    if (!enabled || competitors.length === 0) return;

    const isInitial = !hasInitializedRef.current;
    const isUpdate = prevCompetitorsRef.current !== competitors && prevCompetitorsRef.current.length > 0;

    if (isInitial) {
      hasInitializedRef.current = true;
      prevCompetitorsRef.current = competitors;
      tryAnimate(competitors, false);
    } else if (isUpdate) {
      prevCompetitorsRef.current = competitors;
      // Post-init changes bypass session dedup (likely from WebSocket/refresh)
      tryAnimate(competitors, true);
    }
  }, [enabled, competitors, tryAnimate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Callback for crossfade complete
  const onTransitionComplete = useCallback(() => {
    setPhase('idle');
    setAnimData([]);
    setChangedIds(new Set());
  }, []);

  // Display order: during showing-old, sort by old rank; during shuffling+, sort by new rank
  const displayOrder = useMemo(() => {
    if (animData.length === 0) return [];

    if (phase === 'showing-old') {
      return [...animData].sort((a, b) => a.oldRank - b.oldRank);
    }
    // During shuffling and crossfading, sorted by new rank (motion handles transition)
    return [...animData].sort((a, b) => a.newRank - b.newRank);
  }, [animData, phase]);

  const showUniformCards =
    phase === 'showing-old' || phase === 'shuffling' || phase === 'crossfading';

  const isAnimating = phase !== 'idle' && phase !== 'done';

  return {
    animationPhase: phase,
    displayOrder,
    showUniformCards,
    changedIds,
    onTransitionComplete,
    isAnimating,
  };
}
