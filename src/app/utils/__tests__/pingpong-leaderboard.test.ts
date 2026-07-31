import {
  calibrationProgress,
  segmentPingpongLeaderboard,
  winRate,
} from '../pingpong-leaderboard';
import { PingpongPlayer } from '../../models/Pingpong';

/**
 * Grouping the leaderboard for display.
 *
 * The property that matters most: everyone the API returned ends up
 * somewhere on screen. A player who cannot find themselves assumes the app
 * forgot them, which is worse than seeing themselves unranked.
 */
describe('segmentPingpongLeaderboard', () => {
  function player(overrides: Partial<PingpongPlayer>): PingpongPlayer {
    return {
      id: 'p',
      competitorId: 'c',
      firstName: 'Test',
      lastName: 'Player',
      profilePictureUrl: '',
      rating: 1500,
      rd: 60,
      vol: 0.06,
      conservativeScore: 1380,
      matchCount: 20,
      weightedMatchCount: 20,
      wins: 10,
      losses: 10,
      setsWon: 25,
      setsLost: 25,
      currentStreak: 0,
      bestStreak: 3,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 4,
      diversityScore21d: 0.9,
      rank: 1,
      ...overrides,
    };
  }

  it('places every player somewhere', () => {
    const players = [
      player({ id: 'ranked', rank: 1 }),
      player({ id: 'calibrating', rank: null, provisional: true }),
      player({ id: 'away', rank: null, inactive: true }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    const placed = [...seg.ranked, ...seg.calibrating, ...seg.inactive];
    expect(placed.map((p) => p.id).sort()).toEqual([
      'away',
      'calibrating',
      'ranked',
    ]);
  });

  it('orders ranked players by their rank, not by score', () => {
    // The API computes the rank; re-deriving an order here would give two
    // sources of truth that drift the first time a rule changes.
    const players = [
      player({ id: 'third', rank: 3, conservativeScore: 9999 }),
      player({ id: 'first', rank: 1, conservativeScore: 1 }),
      player({ id: 'second', rank: 2, conservativeScore: 500 }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    expect(seg.ranked.map((p) => p.id)).toEqual(['first', 'second', 'third']);
  });

  it('labels an inactive calibrating player as inactive', () => {
    // Both flags can be true. "Not seen for two weeks" is the more useful
    // thing to tell someone looking for them.
    const players = [
      player({ id: 'both', rank: null, provisional: true, inactive: true }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    expect(seg.inactive.map((p) => p.id)).toEqual(['both']);
    expect(seg.calibrating).toHaveLength(0);
  });

  it('sorts the unranked by conservative score', () => {
    const players = [
      player({ id: 'weak', rank: null, provisional: true, conservativeScore: 900 }),
      player({ id: 'strong', rank: null, provisional: true, conservativeScore: 1400 }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    expect(seg.calibrating.map((p) => p.id)).toEqual(['strong', 'weak']);
  });

  describe('podium', () => {
    it('builds one from the top three ranked players', () => {
      const players = [1, 2, 3, 4].map((rank) =>
        player({ id: `p${rank}`, rank }),
      );

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.podium.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      expect(seg.rest.map((p) => p.id)).toEqual(['p4']);
    });

    it('shows no podium with only two ranked players', () => {
      // A podium of one or two is a pedestal. Below the threshold the list
      // reads better flat.
      const players = [1, 2].map((rank) => player({ id: `p${rank}`, rank }));

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.podium).toHaveLength(0);
      expect(seg.rest.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('keeps every ranked player when there is no podium', () => {
      const players = [1, 2].map((rank) => player({ id: `p${rank}`, rank }));

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.rest).toHaveLength(seg.ranked.length);
    });
  });

  describe('archived players', () => {
    it('hides them by default', () => {
      const players = [
        player({ id: 'active', rank: 1 }),
        player({ id: 'gone', rank: null, archived: true, inactive: true }),
      ];

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.inactive).toHaveLength(0);
      expect(seg.ranked).toHaveLength(1);
    });

    it('includes them when asked', () => {
      const players = [
        player({ id: 'gone', rank: null, archived: true, inactive: true }),
      ];

      const seg = segmentPingpongLeaderboard(players, {
        includeArchived: true,
      });

      expect(seg.inactive.map((p) => p.id)).toEqual(['gone']);
    });
  });

  it('reports an empty board', () => {
    const seg = segmentPingpongLeaderboard([]);

    expect(seg.isEmpty).toBe(true);
    expect(seg.ranked).toHaveLength(0);
  });

  it('does not call a board with only calibrating players empty', () => {
    // The likely state in the first weeks. The screen should show those
    // players, not an empty state telling them nobody has played.
    const seg = segmentPingpongLeaderboard([
      player({ id: 'newcomer', rank: null, provisional: true }),
    ]);

    expect(seg.isEmpty).toBe(false);
  });
});

describe('winRate', () => {
  function withRecord(wins: number, losses: number): PingpongPlayer {
    return { wins, losses } as PingpongPlayer;
  }

  it('rounds to a whole percentage', () => {
    expect(winRate(withRecord(2, 1))).toBe(67);
  });

  it('returns null for a player who has never played', () => {
    // Not 0: "0%" reads as having lost every game.
    expect(winRate(withRecord(0, 0))).toBeNull();
  });

  it('returns 0 for a player who has only lost', () => {
    expect(winRate(withRecord(0, 5))).toBe(0);
  });

  it('returns 100 for an unbeaten player', () => {
    expect(winRate(withRecord(5, 0))).toBe(100);
  });
});

describe('calibrationProgress', () => {
  function withCounts(weighted: number, raw: number): PingpongPlayer {
    return { weightedMatchCount: weighted, matchCount: raw } as PingpongPlayer;
  }

  it('reports progress toward the eight-match bar', () => {
    expect(calibrationProgress(withCounts(4, 4))).toBe(0.5);
  });

  it('reads the weighted count, not the raw one', () => {
    // Someone who played twelve matches against one opponent has a raw count
    // of 12 and a weighted count of 6. Showing 100% while the API still
    // withholds their rank would read as a bug.
    expect(calibrationProgress(withCounts(6, 12))).toBeLessThan(1);
  });

  it('caps at 1 once calibration is complete', () => {
    expect(calibrationProgress(withCounts(20, 20))).toBe(1);
  });

  it('starts at 0', () => {
    expect(calibrationProgress(withCounts(0, 0))).toBe(0);
  });
});
