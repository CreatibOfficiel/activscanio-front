'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  isValidSetScore,
  RecordMatchPayload,
  SetScore,
  validateMatchSets,
} from '../models/Pingpong';

/** A set as typed: strings, because a half-entered score is not a number. */
export interface DraftSet {
  a: string;
  b: string;
}

const EMPTY_SET: DraftSet = { a: '', b: '' };

/** A set is only worth judging once both sides carry a number. */
function isComplete(set: DraftSet): boolean {
  return set.a.trim() !== '' && set.b.trim() !== '';
}

function toScore(set: DraftSet): SetScore {
  return { a: Number(set.a), b: Number(set.b) };
}

/**
 * State behind the match entry form.
 *
 * Separated from rendering because the awkward parts are all state: when the
 * deciding set appears, when it must vanish, and what happens to what was
 * typed into it.
 *
 * Scores are held as strings rather than numbers. "11" on its own is not yet
 * a score, and an empty field is not zero — coercing early turns both into
 * numbers that then fail validation while the user is still typing.
 */
export function useMatchEntry() {
  const [playerAId, setPlayerAId] = useState<string | null>(null);
  const [playerBId, setPlayerBId] = useState<string | null>(null);
  const [sets, setSets] = useState<DraftSet[]>([EMPTY_SET, EMPTY_SET]);

  /** The first two sets, once both are actually filled in. */
  const firstTwo = useMemo(
    () => sets.slice(0, 2).filter(isComplete).map(toScore),
    [sets],
  );

  /**
   * A best-of-three needs a third set only when the first two were split.
   *
   * Both sets must be COMPLETE for this to flip, or the field would appear
   * and vanish on every keystroke of the second score, jumping the layout
   * under the user's thumb mid-entry.
   */
  const showsThirdSet = useMemo(() => {
    if (firstTwo.length !== 2) return false;
    if (!firstTwo.every((set) => isValidSetScore(set.a, set.b))) return false;
    const setsA = firstTwo.filter((set) => set.a > set.b).length;
    return setsA === 1;
  }, [firstTwo]);

  /**
   * The sets the form should render.
   *
   * When a third is needed, an empty one is materialised even though nothing
   * has been typed into it yet — otherwise the form would have no field to
   * offer, and the user could not record the set they just played.
   */
  const visibleSets = useMemo(() => {
    if (!showsThirdSet) return sets.slice(0, 2);
    return sets.length >= 3 ? sets.slice(0, 3) : [...sets, EMPTY_SET];
  }, [sets, showsThirdSet]);

  const setScore = useCallback(
    (index: number, side: 'a' | 'b', value: string) => {
      setSets((current) => {
        const next = [...current];
        while (next.length <= index) next.push(EMPTY_SET);
        next[index] = { ...next[index], [side]: value };

        // Editing either of the first two sets can turn a split into a
        // two-nil. Anything typed in the third set then describes a set that
        // was never played, and would be rejected by the API as a set after
        // the match ended — so drop it rather than submit it.
        if (index < 2 && next.length > 2) {
          const firstTwoNow = next.slice(0, 2).filter(isComplete).map(toScore);
          const stillSplit =
            firstTwoNow.length === 2 &&
            firstTwoNow.every((set) => isValidSetScore(set.a, set.b)) &&
            firstTwoNow.filter((set) => set.a > set.b).length === 1;
          if (!stillSplit) next[2] = EMPTY_SET;
        }

        return next;
      });
    },
    [],
  );

  const swapSides = useCallback(() => {
    setPlayerAId(playerBId);
    setPlayerBId(playerAId);
    setSets((current) => current.map((set) => ({ a: set.b, b: set.a })));
  }, [playerAId, playerBId]);

  const reset = useCallback(() => {
    setPlayerAId(null);
    setPlayerBId(null);
    setSets([EMPTY_SET, EMPTY_SET]);
  }, []);

  /** Complete sets only — a half-typed one is not yet wrong. */
  const completedSets = useMemo(
    () => visibleSets.filter(isComplete).map(toScore),
    [visibleSets],
  );

  const invalidSetIndices = useMemo(
    () =>
      visibleSets
        .map((set, index) =>
          isComplete(set) && !isValidSetScore(Number(set.a), Number(set.b))
            ? index
            : -1,
        )
        .filter((index) => index !== -1),
    [visibleSets],
  );

  const samePlayer =
    playerAId !== null && playerBId !== null && playerAId === playerBId;

  const validation = useMemo(
    () => validateMatchSets(completedSets),
    [completedSets],
  );

  /**
   * Only complain once there is something to complain about.
   *
   * An empty form is not an invalid one, and telling someone their match is
   * incomplete before they have typed anything is noise they learn to ignore.
   */
  const error = useMemo(() => {
    if (samePlayer) return 'Un match oppose deux joueurs, pas le même joueur';
    if (completedSets.length === 0) return null;
    if (invalidSetIndices.length > 0) return 'Un score de set est impossible';
    if (!validation.valid) return validation.error;
    return null;
  }, [samePlayer, completedSets, invalidSetIndices, validation]);

  const canSubmit =
    playerAId !== null &&
    playerBId !== null &&
    !samePlayer &&
    validation.valid;

  const buildPayload = useCallback((): RecordMatchPayload | null => {
    if (!canSubmit || playerAId === null || playerBId === null) return null;
    return { playerAId, playerBId, sets: completedSets };
  }, [canSubmit, playerAId, playerBId, completedSets]);

  return {
    playerAId,
    playerBId,
    setPlayerA: setPlayerAId,
    setPlayerB: setPlayerBId,
    sets: visibleSets,
    setScore,
    showsThirdSet,
    swapSides,
    reset,
    invalidSetIndices,
    error,
    /** 'A' | 'B' once someone has taken two sets, derived from the scores. */
    winner: validation.valid ? validation.winner : null,
    setsA: validation.setsA,
    setsB: validation.setsB,
    canSubmit,
    buildPayload,
  };
}
