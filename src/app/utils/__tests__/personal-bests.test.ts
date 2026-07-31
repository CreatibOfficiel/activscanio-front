import {
  bestFinishingPosition,
  currentForm,
  bestStreak,
  setsWonRatio,
  buildPersonalBests,
} from '../personal-bests';
import { Competitor } from '../../models/Competitor';
import { PingpongPlayer } from '../../models/Pingpong';
import type { CompetitorStats } from '../../profile/page';

/**
 * The medal channel.
 *
 * Every number here has to survive one test: can another person's activity
 * change it? A rank cannot pass that test — in a 25-person office half the
 * players sit in the bottom half by construction, and no amount of effort
 * moves that unless someone else gets worse. A best finishing position can:
 * it is a fact about one player's own history and nobody else can touch it.
 *
 * The null-not-zero rule is inherited from `winRate` in
 * `pingpong-leaderboard.ts` and applies to every function in this file.
 * "0%" reads as having lost everything; "position 0" is not a position.
 */

function competitor(overrides: Partial<Competitor> = {}): Competitor {
  return {
    id: 'me',
    firstName: 'Thibaud',
    lastName: 'Carron',
    profilePictureUrl: '',
    rating: 1600,
    rd: 60,
    vol: 0.06,
    ...overrides,
  };
}

function stats(overrides: Partial<CompetitorStats> = {}): CompetitorStats {
  return {
    conservativeScore: 1480,
    raceCount: 20,
    avgRank12: 4.5,
    totalWins: 5,
    winStreak: 2,
    bestWinStreak: 6,
    playStreak: 3,
    bestPlayStreak: 9,
    ...overrides,
  };
}

describe('bestFinishingPosition', () => {
  it('reads the best position out of the recent races', () => {
    // Lower is better in a race: position 1 beats position 4.
    expect(bestFinishingPosition(competitor({ recentPositions: [4, 2, 1, 3, 5] }))).toBe(1);
  });

  it('picks the minimum, not the most recent', () => {
    // The most recent race is form, not a record. A player who won once in
    // March still won once in March.
    expect(bestFinishingPosition(competitor({ recentPositions: [8, 1, 9] }))).toBe(1);
  });

  it('picks the minimum, not the maximum', () => {
    // Mutation guard: swapping Math.min for Math.max would return 9 here.
    expect(bestFinishingPosition(competitor({ recentPositions: [2, 9] }))).toBe(2);
  });

  it('returns null when no positions have been recorded', () => {
    // Not 0. "Meilleure position : 0" is nonsense — there is no 0th place.
    expect(bestFinishingPosition(competitor({ recentPositions: [] }))).toBeNull();
  });

  it('returns null when the field is absent', () => {
    expect(bestFinishingPosition(competitor())).toBeNull();
  });

  it('ignores non-positive positions', () => {
    // A 0 leaking in from the API would otherwise become a perfect record
    // that no race can ever beat.
    expect(bestFinishingPosition(competitor({ recentPositions: [0, 3] }))).toBe(3);
  });

  it('returns null when every position is unusable', () => {
    expect(bestFinishingPosition(competitor({ recentPositions: [0, -1] }))).toBeNull();
  });
});

describe('currentForm', () => {
  it('reports an improvement when recent races beat the lifetime average', () => {
    // Recent average 2, lifetime 5. Finishing higher up the field than usual
    // is an improvement of 3 places.
    const form = currentForm(
      competitor({ recentPositions: [1, 2, 3], lifetimeAvgRank: 5 }),
    );

    expect(form).not.toBeNull();
    expect(form?.direction).toBe('better');
    expect(form?.delta).toBeCloseTo(3);
  });

  it('reports a decline when recent races are worse than the lifetime average', () => {
    // Mutation guard on the subtraction order: a LOWER rank average is a
    // BETTER result. Recent 6 against a lifetime 4 is a decline, and the
    // delta is reported as a positive magnitude with a direction beside it.
    const form = currentForm(
      competitor({ recentPositions: [6, 6, 6], lifetimeAvgRank: 4 }),
    );

    expect(form).not.toBeNull();
    expect(form?.direction).toBe('worse');
    expect(form?.delta).toBeCloseTo(2);
  });

  it('averages the recent positions rather than reading only the last one', () => {
    // [1, 7] averages to 4, which is level with a lifetime 4. Reading only
    // the most recent race would call this a 3-place improvement.
    const form = currentForm(
      competitor({ recentPositions: [1, 7], lifetimeAvgRank: 4 }),
    );

    expect(form?.direction).toBe('level');
  });

  it('measures against the player own baseline, not a shared one', () => {
    // The load-bearing property. Two players with identical recent races and
    // different lifetime averages get different forms, and neither depends
    // on anything the other did.
    const steady = currentForm(
      competitor({ recentPositions: [3, 3], lifetimeAvgRank: 3 }),
    );
    const improving = currentForm(
      competitor({ recentPositions: [3, 3], lifetimeAvgRank: 8 }),
    );

    expect(steady?.direction).toBe('level');
    expect(improving?.direction).toBe('better');
  });

  it('exposes both averages so the display can show the comparison', () => {
    const form = currentForm(
      competitor({ recentPositions: [2, 4], lifetimeAvgRank: 5 }),
    );

    expect(form?.recentAvg).toBeCloseTo(3);
    expect(form?.lifetimeAvg).toBeCloseTo(5);
  });

  it('returns null without recent positions', () => {
    expect(
      currentForm(competitor({ recentPositions: [], lifetimeAvgRank: 5 })),
    ).toBeNull();
  });

  it('returns null without a lifetime baseline', () => {
    // There is no form without something to compare against, and comparing
    // against 0 would report every player as catastrophically declining.
    expect(currentForm(competitor({ recentPositions: [1, 2] }))).toBeNull();
  });

  it('returns null when the lifetime baseline is zero', () => {
    // A competitor with no races carries avgRank 0 through the profile page
    // fallbacks. That is missing data, not a perfect average.
    expect(
      currentForm(competitor({ recentPositions: [1, 2], lifetimeAvgRank: 0 })),
    ).toBeNull();
  });

  it('treats a difference under a tenth of a place as level', () => {
    // Float noise should not be announced as progress.
    const form = currentForm(
      competitor({ recentPositions: [4, 4], lifetimeAvgRank: 4.02 }),
    );

    expect(form?.direction).toBe('level');
  });

  it('ignores non-positive positions when averaging', () => {
    const form = currentForm(
      competitor({ recentPositions: [0, 2, 4], lifetimeAvgRank: 5 }),
    );

    expect(form?.recentAvg).toBeCloseTo(3);
  });
});

describe('bestStreak', () => {
  it('returns the best play streak', () => {
    expect(bestStreak(stats({ bestPlayStreak: 9, playStreak: 3 }))).toEqual({
      best: 9,
      current: 3,
      isAtBest: false,
    });
  });

  it('flags a player currently sitting on their own record', () => {
    // Worth saying out loud: the one moment where the medal is live.
    expect(bestStreak(stats({ bestPlayStreak: 7, playStreak: 7 }))?.isAtBest).toBe(true);
  });

  it('returns null when nothing has ever been strung together', () => {
    // Not 0. A "record : 0" is a medal for having done nothing.
    expect(bestStreak(stats({ bestPlayStreak: 0, playStreak: 0 }))).toBeNull();
  });

  it('returns null when handed no stats at all', () => {
    expect(bestStreak(null)).toBeNull();
  });

  it('does not flag a zero streak as being at the best', () => {
    // Guard against 0 === 0 reading as a live record.
    expect(bestStreak(stats({ bestPlayStreak: 0, playStreak: 0 }))).toBeNull();
  });
});

describe('setsWonRatio', () => {
  function withSets(setsWon: number, setsLost: number): PingpongPlayer {
    return { setsWon, setsLost } as PingpongPlayer;
  }

  it('reports the share of sets taken, rounded', () => {
    expect(setsWonRatio(withSets(2, 1))).toBe(67);
  });

  it('returns null for a player who has never played a set', () => {
    // Same reasoning as `winRate`: "0%" reads as having lost every set.
    expect(setsWonRatio(withSets(0, 0))).toBeNull();
  });

  it('returns 0 for a player who has lost every set', () => {
    // 0 is a real answer once sets have been played. Only "no data" is null.
    expect(setsWonRatio(withSets(0, 6))).toBe(0);
  });

  it('returns 100 for a player who has never dropped a set', () => {
    expect(setsWonRatio(withSets(6, 0))).toBe(100);
  });

  it('returns null when handed no player', () => {
    expect(setsWonRatio(null)).toBeNull();
  });
});

describe('buildPersonalBests', () => {
  it('collects every available best', () => {
    const bests = buildPersonalBests({
      competitor: competitor({ recentPositions: [1, 3], lifetimeAvgRank: 5 }),
      stats: stats(),
      pingpongPlayer: { setsWon: 10, setsLost: 5 } as PingpongPlayer,
    });

    expect(bests.bestPosition).toBe(1);
    expect(bests.form?.direction).toBe('better');
    expect(bests.streak?.best).toBe(9);
    expect(bests.setsRatio).toBe(67);
    expect(bests.isEmpty).toBe(false);
  });

  it('reports emptiness when a competitor has never raced', () => {
    // Drives the invitation. Not an empty box and not a wall of zeroes.
    const bests = buildPersonalBests({
      competitor: competitor(),
      stats: stats({ raceCount: 0, bestPlayStreak: 0, playStreak: 0 }),
      pingpongPlayer: null,
    });

    expect(bests.isEmpty).toBe(true);
    expect(bests.bestPosition).toBeNull();
    expect(bests.form).toBeNull();
    expect(bests.streak).toBeNull();
    expect(bests.setsRatio).toBeNull();
  });

  it('is not empty when only one best is available', () => {
    // One medal is still a medal. Requiring all four would blank the section
    // for anyone in their first week.
    const bests = buildPersonalBests({
      competitor: competitor({ recentPositions: [4] }),
      stats: stats({ bestPlayStreak: 0, playStreak: 0 }),
      pingpongPlayer: null,
    });

    expect(bests.isEmpty).toBe(false);
    expect(bests.bestPosition).toBe(4);
  });

  it('survives being handed nothing at all', () => {
    const bests = buildPersonalBests({
      competitor: null,
      stats: null,
      pingpongPlayer: null,
    });

    expect(bests.isEmpty).toBe(true);
  });

  it('reads nothing but the one competitor it was given', () => {
    // The premise of the whole feature, at the data layer. The function
    // signature takes a single competitor precisely so there is no list of
    // other players available to read.
    const mine = competitor({
      id: 'me',
      recentPositions: [2, 4],
      lifetimeAvgRank: 6,
    });

    const first = buildPersonalBests({ competitor: mine, stats: stats(), pingpongPlayer: null });
    const second = buildPersonalBests({ competitor: mine, stats: stats(), pingpongPlayer: null });

    expect(first).toEqual(second);
  });
});
