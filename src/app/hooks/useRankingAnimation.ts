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
  characterImageUrl?: string;
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

/* -------- Debug logging -------- */

const DEBUG = true; // flip to false to silence logs

function debugLog(label: string, data?: Record<string, unknown>) {
  if (!DEBUG) return;
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
  if (data) {
    console.log(`[RankAnim ${ts}] ${label}`, data);
  } else {
    console.log(`[RankAnim ${ts}] ${label}`);
  }
}

function debugTable(label: string, rows: Array<Record<string, unknown>>) {
  if (!DEBUG) return;
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[RankAnim ${ts}] ${label}`);
  console.table(rows);
}

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
    (c) => Math.round(c.conservativeScore ?? 0),
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
  // Only consider competitors present in both old and new snapshots
  const commonIds = competitors
    .filter((c) => oldRanks.has(c.id) && newRanks.has(c.id))
    .map((c) => c.id);

  const newOnly = competitors.filter((c) => !oldRanks.has(c.id)).map((c) => c.id);
  const removedIds = [...oldRanks.keys()].filter((id) => !newRanks.has(id));

  debugLog('hasRankChanges input', {
    competitorCount: competitors.length,
    commonCount: commonIds.length,
    newCompetitors: newOnly,
    removedFromSnapshot: removedIds,
  });

  // Sort by old rank (tie-break by id for determinism)
  const oldOrder = [...commonIds].sort(
    (a, b) => (oldRanks.get(a)! - oldRanks.get(b)!) || a.localeCompare(b),
  );
  // Sort by new rank
  const newOrder = [...commonIds].sort(
    (a, b) => (newRanks.get(a)! - newRanks.get(b)!) || a.localeCompare(b),
  );

  // Log per-competitor comparison
  const comparisonRows = commonIds.map((id) => {
    const comp = competitors.find((c) => c.id === id);
    return {
      id: id.slice(0, 8),
      name: comp ? `${comp.firstName} ${comp.lastName}` : '?',
      rawScore: comp?.conservativeScore ?? 'N/A',
      roundedScore: Math.round(comp?.conservativeScore ?? 0),
      oldRank: oldRanks.get(id),
      newRank: newRanks.get(id),
      rankDelta: (oldRanks.get(id) ?? 0) - (newRanks.get(id) ?? 0),
    };
  });
  debugTable('rank comparison (common competitors)', comparisonRows);

  // Compare relative ordering — only animate if someone actually overtook another
  let changed = false;
  let firstDiffIdx = -1;
  for (let i = 0; i < oldOrder.length; i++) {
    if (oldOrder[i] !== newOrder[i]) {
      changed = true;
      firstDiffIdx = i;
      break;
    }
  }

  if (changed) {
    const diffComp = competitors.find((c) => c.id === oldOrder[firstDiffIdx]);
    const newComp = competitors.find((c) => c.id === newOrder[firstDiffIdx]);
    debugLog('RANK CHANGE DETECTED → will animate', {
      firstDiffPosition: firstDiffIdx,
      oldOrderAtDiff: `${diffComp?.firstName ?? '?'} (${oldOrder[firstDiffIdx].slice(0, 8)})`,
      newOrderAtDiff: `${newComp?.firstName ?? '?'} (${newOrder[firstDiffIdx].slice(0, 8)})`,
      oldOrderIds: oldOrder.map((id) => id.slice(0, 8)),
      newOrderIds: newOrder.map((id) => id.slice(0, 8)),
    });
  } else {
    debugLog('NO rank changes → skip animation');
  }

  return changed;
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
      characterImageUrl: c.characterVariant?.imageUrl,
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
      debugLog('phase → showing-old');
      setPhase('showing-old');

      const t1 = setTimeout(() => {
        debugLog('phase → shuffling');
        setPhase('shuffling');

        const t2 = setTimeout(() => {
          debugLog('phase → crossfading');
          setPhase('crossfading');

          const t3 = setTimeout(() => {
            debugLog('phase → done (saving snapshot + marking session)');
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
      debugLog('tryAnimate called', {
        mode,
        enabled,
        competitorCount: comps.length,
        bypassSessionDedup,
        currentPhase: phaseRef.current,
        sessionPlayed: hasPlayedThisSession(),
      });

      if (!enabled || comps.length === 0) {
        debugLog('EXIT: disabled or no competitors', { enabled, count: comps.length });
        return;
      }

      // Reduced motion: skip animation, just save
      if (prefersReducedMotion()) {
        debugLog('EXIT: reduced motion preference');
        saveSnapshot(comps);
        if (mode === 'homepage') markPlayedThisSession();
        return;
      }

      // If animation is currently running, queue the update
      const currentPhase = phaseRef.current;
      if (currentPhase !== 'idle' && currentPhase !== 'done') {
        debugLog('QUEUED: animation in progress', { currentPhase });
        pendingCompetitorsRef.current = comps;
        return;
      }

      const newRanks = buildCurrentRanksMap(comps);
      const oldRanks = buildOldRankMap(mode, comps);

      // No old data: first visit — save and skip
      if (!oldRanks) {
        debugLog('EXIT: no old snapshot (first visit) → saving snapshot');
        saveSnapshot(comps);
        if (mode === 'homepage') markPlayedThisSession();
        return;
      }

      // Log snapshot age
      if (mode === 'homepage') {
        const snap = readSnapshot();
        if (snap) {
          const ageMs = Date.now() - snap.timestamp;
          const ageMins = Math.round(ageMs / 60000);
          debugLog('snapshot age', {
            ageMinutes: ageMins,
            ageHours: Math.round(ageMins / 60 * 10) / 10,
            savedAt: new Date(snap.timestamp).toISOString(),
            snapshotCompetitorCount: snap.rankings.length,
          });
        }
      }

      // Homepage session dedup (bypass for WebSocket updates)
      if (mode === 'homepage' && !bypassSessionDedup && hasPlayedThisSession()) {
        debugLog('EXIT: session dedup (already played this session)');
        return;
      }

      // Check if rankings actually changed
      if (!hasRankChanges(oldRanks, newRanks, comps)) {
        // Keep snapshot in sync with what the user sees,
        // so future comparisons use the correct baseline
        debugLog('EXIT: no rank changes → saving snapshot to keep in sync');
        saveSnapshot(comps);
        return;
      }

      // Build animation data and start
      const data = buildAnimData(comps, oldRanks, newRanks);
      const changed = new Set<string>();
      data.forEach((d) => {
        if (d.delta !== 0 && !d.isNew) changed.add(d.id);
      });
      setChangedIds(changed);

      debugLog('STARTING ANIMATION', {
        changedCount: changed.size,
        changedCompetitors: data
          .filter((d) => d.delta !== 0 && !d.isNew)
          .map((d) => ({
            name: `${d.firstName} ${d.lastName}`,
            oldRank: d.oldRank,
            newRank: d.newRank,
            delta: d.delta,
            score: d.conservativeScore,
          })),
        newCompetitors: data
          .filter((d) => d.isNew)
          .map((d) => `${d.firstName} ${d.lastName}`),
      });

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
      debugLog('main effect: INITIAL load', { competitorCount: competitors.length });
      hasInitializedRef.current = true;
      prevCompetitorsRef.current = competitors;
      tryAnimate(competitors, false);
    } else if (isUpdate) {
      debugLog('main effect: COMPETITOR UPDATE (WebSocket/refresh)', {
        competitorCount: competitors.length,
        prevCount: prevCompetitorsRef.current.length,
      });
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
