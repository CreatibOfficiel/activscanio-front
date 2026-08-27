import {
  SeasonParticipation,
  bestSeasonStreak,
  currentSeasonStreak,
} from '../consecutive-seasons';

/**
 * The figures behind the two "Saisons consécutives" blocks.
 *
 * The card these replace read a betting-era field the API had stopped
 * sending, so it rendered blank. What matters here is that a gap breaks the
 * current streak — a number that survived a skipped season would sit next to
 * live streaks claiming to be current when it is not.
 */
const seasons = (...played: boolean[]): SeasonParticipation[] =>
  played.map((p, i) => ({ sortKey: 202601 + i, played: p }));

describe('currentSeasonStreak', () => {
  it('counts back from the most recent season', () => {
    expect(currentSeasonStreak(seasons(true, true, true))).toBe(3);
  });

  it('is 0 when the latest season was skipped, however long the past run', () => {
    expect(currentSeasonStreak(seasons(true, true, true, false))).toBe(0);
  });

  it('stops at the first gap rather than counting every played season', () => {
    expect(currentSeasonStreak(seasons(true, true, false, true, true))).toBe(2);
  });

  it('does not depend on the order it was given', () => {
    const ordered = seasons(true, false, true, true);
    expect(currentSeasonStreak([...ordered].reverse())).toBe(
      currentSeasonStreak(ordered),
    );
  });

  it('is 0 with no archived seasons', () => {
    expect(currentSeasonStreak([])).toBe(0);
  });
});

describe('bestSeasonStreak', () => {
  it('finds the longest run anywhere in the history', () => {
    expect(bestSeasonStreak(seasons(true, true, true, false, true))).toBe(3);
  });

  it('is at least the current streak', () => {
    const s = seasons(false, true, true);
    expect(bestSeasonStreak(s)).toBeGreaterThanOrEqual(currentSeasonStreak(s));
  });

  it('is 0 when nothing was played', () => {
    expect(bestSeasonStreak(seasons(false, false))).toBe(0);
  });
});
