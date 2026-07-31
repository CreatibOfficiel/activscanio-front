import { act, renderHook } from '@testing-library/react';
import { useMatchEntry } from '../useMatchEntry';

/**
 * Match entry state.
 *
 * Kept apart from the form's rendering because the awkward parts are all
 * state, not pixels: when the third set appears, when it must disappear
 * again, and what happens to what was typed into it.
 *
 * The rule the whole thing turns on: a best-of-three needs a third set only
 * when the first two were split. Getting that wrong either hides a set that
 * was played, or asks for one that never happened.
 */
describe('useMatchEntry', () => {
  const setScore = (
    result: { setScore: (i: number, side: 'a' | 'b', value: string) => void },
    index: number,
    a: string,
    b: string,
  ) => {
    result.setScore(index, 'a', a);
    result.setScore(index, 'b', b);
  };

  it('starts with two empty sets', () => {
    const { result } = renderHook(() => useMatchEntry());

    expect(result.current.sets).toHaveLength(2);
    expect(result.current.sets[0]).toEqual({ a: '', b: '' });
  });

  it('starts with no players chosen', () => {
    const { result } = renderHook(() => useMatchEntry());

    expect(result.current.playerAId).toBeNull();
    expect(result.current.playerBId).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  describe('the deciding set', () => {
    it('appears when the first two sets are split', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '8', '11');
      });

      expect(result.current.showsThirdSet).toBe(true);
      expect(result.current.sets).toHaveLength(3);
    });

    it('stays hidden after a two-nil', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '11', '8');
      });

      expect(result.current.showsThirdSet).toBe(false);
      expect(result.current.sets).toHaveLength(2);
    });

    it('stays hidden while the second set is half-typed', () => {
      // Otherwise the field flickers in and out on every keystroke, and the
      // layout jumps under the thumb mid-entry.
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        result.current.setScore(1, 'a', '8');
      });

      expect(result.current.showsThirdSet).toBe(false);
    });

    it('disappears again when a split is corrected to a two-nil', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '8', '11');
      });
      expect(result.current.showsThirdSet).toBe(true);

      act(() => {
        setScore(result.current, 1, '11', '8');
      });

      expect(result.current.showsThirdSet).toBe(false);
    });

    it('forgets what was typed in a third set that no longer applies', () => {
      // Keeping it would submit a set that was never played, and the API
      // would reject the match with a message about a set after the end.
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '8', '11');
        setScore(result.current, 2, '11', '9');
      });

      act(() => {
        setScore(result.current, 1, '11', '8');
      });
      act(() => {
        setScore(result.current, 1, '8', '11');
      });

      expect(result.current.sets[2]).toEqual({ a: '', b: '' });
    });
  });

  describe('validation', () => {
    it('reports nothing before anything is typed', () => {
      // Showing "a set score is impossible" on an empty form is noise.
      const { result } = renderHook(() => useMatchEntry());

      expect(result.current.error).toBeNull();
      expect(result.current.invalidSetIndices).toEqual([]);
    });

    it('flags an impossible score once a set is complete', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '12', '9');
      });

      expect(result.current.invalidSetIndices).toContain(0);
    });

    it('does not flag a set that is still being typed', () => {
      // "11" alone is not yet a score; calling it invalid mid-entry is the
      // classic premature-validation annoyance.
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        result.current.setScore(0, 'a', '11');
      });

      expect(result.current.invalidSetIndices).toEqual([]);
    });

    it('accepts a set won past 10-10', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '13', '11');
      });

      expect(result.current.invalidSetIndices).toEqual([]);
    });
  });

  describe('deriving the winner', () => {
    it('names the winner once two sets are taken', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '11', '8');
      });

      expect(result.current.winner).toBe('A');
    });

    it('names B when B took both sets', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '5', '11');
        setScore(result.current, 1, '8', '11');
      });

      expect(result.current.winner).toBe('B');
    });

    it('names nobody while the match is unfinished', () => {
      const { result } = renderHook(() => useMatchEntry());

      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '8', '11');
      });

      expect(result.current.winner).toBeNull();
    });
  });

  describe('submitting', () => {
    function completeMatch(result: { current: ReturnType<typeof useMatchEntry> }) {
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p2');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '11', '8');
      });
    }

    it('allows submitting a complete match', () => {
      const { result } = renderHook(() => useMatchEntry());
      completeMatch(result);

      expect(result.current.canSubmit).toBe(true);
    });

    it('refuses while a player is missing', () => {
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '11', '8');
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('refuses when both sides are the same person', () => {
      // The API rejects it with a CHECK constraint; catching it here saves
      // a round trip and says so in the form.
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p1');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '11', '8');
      });

      expect(result.current.canSubmit).toBe(false);
      expect(result.current.error).toMatch(/même joueur/i);
    });

    it('refuses a one-all that stopped there', () => {
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p2');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '8', '11');
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('builds a payload with numbers, not strings', () => {
      const { result } = renderHook(() => useMatchEntry());
      completeMatch(result);

      expect(result.current.buildPayload()).toEqual({
        playerAId: 'p1',
        playerBId: 'p2',
        sets: [
          { a: 11, b: 5 },
          { a: 11, b: 8 },
        ],
      });
    });

    it('leaves an unplayed third set out of the payload', () => {
      const { result } = renderHook(() => useMatchEntry());
      completeMatch(result);

      expect(result.current.buildPayload()?.sets).toHaveLength(2);
    });

    it('includes the third set when it was played', () => {
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p2');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '8', '11');
      });
      act(() => {
        setScore(result.current, 2, '11', '9');
      });

      expect(result.current.buildPayload()?.sets).toHaveLength(3);
    });

    it('builds nothing from an incomplete match', () => {
      const { result } = renderHook(() => useMatchEntry());

      expect(result.current.buildPayload()).toBeNull();
    });
  });

  describe('swapping sides', () => {
    it('swaps the players and mirrors every score', () => {
      // Recording a match from the wrong side is easy to do and annoying to
      // fix by hand across three sets.
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p2');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
        setScore(result.current, 1, '11', '8');
      });

      act(() => {
        result.current.swapSides();
      });

      expect(result.current.playerAId).toBe('p2');
      expect(result.current.playerBId).toBe('p1');
      expect(result.current.sets[0]).toEqual({ a: '5', b: '11' });
      expect(result.current.winner).toBe('B');
    });

    it('is its own undo, even twice within one batch', () => {
      // Two swaps must cancel out. If swapSides reads playerAId/playerBId
      // from render scope instead of from the setState updater, both calls
      // in a single batch see the pre-swap values: A is set to p2 and B to
      // p1 twice over, so the second swap is a no-op and the pair ends up
      // reversed rather than restored. The scores, which already use a
      // functional update, would meanwhile have swapped back — leaving the
      // players and their columns out of step, which is the state that
      // silently records a match backwards.
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p2');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
      });

      act(() => {
        result.current.swapSides();
        result.current.swapSides();
      });

      expect(result.current.playerAId).toBe('p1');
      expect(result.current.playerBId).toBe('p2');
      expect(result.current.sets[0]).toEqual({ a: '11', b: '5' });
    });
  });

  describe('reset', () => {
    it('clears everything back to a blank form', () => {
      const { result } = renderHook(() => useMatchEntry());
      act(() => {
        result.current.setPlayerA('p1');
        result.current.setPlayerB('p2');
      });
      act(() => {
        setScore(result.current, 0, '11', '5');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.playerAId).toBeNull();
      expect(result.current.sets).toEqual([
        { a: '', b: '' },
        { a: '', b: '' },
      ]);
    });
  });
});
