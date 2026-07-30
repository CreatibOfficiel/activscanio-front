import { Competitor } from '@/app/models/Competitor';
import { computeRanksWithTies } from '../rankings';
import { groupByLeague } from '../leagues';
import { segmentLeaderboard } from '../leaderboard-segmentation';

/**
 * Build a competitor with only the fields the segmentation cares about.
 */
function competitor(overrides: Partial<Competitor> & { id: string }): Competitor {
  return {
    firstName: 'Test',
    lastName: 'Player',
    profilePictureUrl: '',
    rating: 1500,
    rd: 50,
    vol: 0.06,
    raceCount: 10,
    ...overrides,
  } as Competitor;
}

/**
 * Reference implementation, copied verbatim from `src/app/page.tsx`
 * (lines 27-35 and 115-167) before the extraction.
 *
 * These tests exist to prove the extracted `segmentLeaderboard` behaves
 * identically. Do not "clean up" this function: its value is being a faithful
 * copy of what shipped.
 */
function legacyHomepageSegmentation(allCompetitors: Competitor[]) {
  const sortByConservativeScore = (competitors: Competitor[]): Competitor[] =>
    [...competitors].sort((a, b) => {
      if (a.conservativeScore === undefined && b.conservativeScore === undefined)
        return 0;
      if (a.conservativeScore === undefined) return 1;
      if (b.conservativeScore === undefined) return -1;
      return b.conservativeScore - a.conservativeScore;
    });

  const allWithRaces = allCompetitors.filter((c) => c.raceCount && c.raceCount > 0);
  const sorted = sortByConservativeScore(allWithRaces);

  const conf = sorted.filter((c) => !c.provisional && !c.inactive);
  const inact = sorted.filter((c) => !c.provisional && c.inactive);
  const cal = sorted.filter((c) => c.provisional);

  const confRanks = computeRanksWithTies(
    conf,
    (c) => Math.round(c.conservativeScore ?? 0),
    (c) => c.id,
  );
  const inactRanks = computeRanksWithTies(
    inact,
    (c) => Math.round(c.conservativeScore ?? 0),
    (c) => c.id,
    conf.length,
  );
  const calRanks = computeRanksWithTies(
    cal,
    (c) => Math.round(c.conservativeScore ?? 0),
    (c) => c.id,
    conf.length + inact.length,
  );

  const trends = new Map<string, { direction: string; value?: number }>();
  const trendRanks = computeRanksWithTies(
    conf,
    (c) => Math.round(c.conservativeScore ?? 0),
    (c) => c.id,
  );
  conf.forEach((c) => {
    const currentRank = trendRanks.get(c.id) ?? 0;
    const previousRank = c.previousDayRank;
    if (previousRank != null) {
      const change = previousRank - currentRank;
      if (change > 0) trends.set(c.id, { direction: 'up', value: change });
      else if (change < 0)
        trends.set(c.id, { direction: 'down', value: Math.abs(change) });
      else trends.set(c.id, { direction: 'stable' });
    } else {
      trends.set(c.id, { direction: 'stable' });
    }
  });

  return {
    confirmed: conf,
    inactive: inact,
    calibrating: cal,
    topThree: conf.slice(0, 3),
    leagueGroups: groupByLeague(conf, (c) => c.id, confRanks, true),
    trends,
    confirmedRanks: confRanks,
    inactiveRanks: inactRanks,
    calibratingRanks: calRanks,
  };
}

/**
 * Reference implementation of the TV-specific `maxScore`, copied from
 * `CompetitorRankingsView.tsx` lines 40-52. Note it is computed over every
 * competitor with at least one race, not just the confirmed ones.
 */
function legacyTvMaxScore(rankings: Competitor[]): number {
  const withRaces = [...rankings].filter((c) => c.raceCount && c.raceCount > 0);
  return withRaces.length > 0
    ? Math.max(...withRaces.map((c) => c.conservativeScore ?? 0))
    : 0;
}

/** A fixture covering every branch: all three tiers, ties, and missing data. */
const FIXTURE: Competitor[] = [
  competitor({ id: 'a', conservativeScore: 1900, previousDayRank: 3 }),
  competitor({ id: 'b', conservativeScore: 1800, previousDayRank: 2 }),
  competitor({ id: 'c', conservativeScore: 1800, previousDayRank: 3 }),
  competitor({ id: 'd', conservativeScore: 1700, previousDayRank: null }),
  competitor({ id: 'e', conservativeScore: 1650 }),
  competitor({ id: 'f', conservativeScore: 1600, previousDayRank: 5 }),
  competitor({ id: 'g', conservativeScore: 1550, previousDayRank: 9 }),
  competitor({ id: 'h', conservativeScore: 1500, previousDayRank: 8 }),
  competitor({ id: 'i', conservativeScore: 1450 }),
  competitor({ id: 'j', conservativeScore: 1400 }),
  competitor({ id: 'k', conservativeScore: 1350 }),
  competitor({ id: 'l', conservativeScore: 1300 }),
  // Inactive tier
  competitor({ id: 'm', conservativeScore: 1750, inactive: true }),
  competitor({ id: 'n', conservativeScore: 1600, inactive: true }),
  // Calibrating tier
  competitor({ id: 'o', conservativeScore: 1850, provisional: true, raceCount: 2 }),
  competitor({ id: 'p', conservativeScore: 1200, provisional: true, raceCount: 1 }),
  // Excluded: no races
  competitor({ id: 'q', conservativeScore: 2000, raceCount: 0 }),
  // Edge case: no score at all
  competitor({ id: 'r', conservativeScore: undefined }),
];

describe('segmentLeaderboard — parity with the shipped homepage logic', () => {
  const legacy = legacyHomepageSegmentation(FIXTURE);
  const actual = segmentLeaderboard(FIXTURE, { excludePodiumFromLeagues: true });

  it('produces the same confirmed list, in the same order', () => {
    expect(actual.confirmed.map((c) => c.id)).toEqual(
      legacy.confirmed.map((c) => c.id),
    );
  });

  it('produces the same inactive list', () => {
    expect(actual.inactive.map((c) => c.id)).toEqual(
      legacy.inactive.map((c) => c.id),
    );
  });

  it('produces the same calibrating list', () => {
    expect(actual.calibrating.map((c) => c.id)).toEqual(
      legacy.calibrating.map((c) => c.id),
    );
  });

  it('produces the same top three', () => {
    expect(actual.topThree.map((c) => c.id)).toEqual(
      legacy.topThree.map((c) => c.id),
    );
  });

  it('produces the same confirmed ranks', () => {
    expect(Object.fromEntries(actual.confirmedRanks)).toEqual(
      Object.fromEntries(legacy.confirmedRanks),
    );
  });

  it('produces the same inactive ranks, offset included', () => {
    expect(Object.fromEntries(actual.inactiveRanks)).toEqual(
      Object.fromEntries(legacy.inactiveRanks),
    );
  });

  it('produces the same calibrating ranks, offset included', () => {
    expect(Object.fromEntries(actual.calibratingRanks)).toEqual(
      Object.fromEntries(legacy.calibratingRanks),
    );
  });

  it('produces the same trends', () => {
    expect(Object.fromEntries(actual.trends)).toEqual(
      Object.fromEntries(legacy.trends),
    );
  });

  it('produces the same league groups', () => {
    expect(
      actual.leagueGroups.map((g) => ({
        league: g.league.id,
        items: g.items.map((c) => c.id),
      })),
    ).toEqual(
      legacy.leagueGroups.map((g) => ({
        league: g.league.id,
        items: g.items.map((c) => c.id),
      })),
    );
  });
});

describe('segmentLeaderboard — parity with the shipped TV logic', () => {
  it('computes maxScore over every competitor with races, not just confirmed', () => {
    const actual = segmentLeaderboard(FIXTURE, { excludePodiumFromLeagues: true });
    expect(actual.maxScore).toBe(legacyTvMaxScore(FIXTURE));
    // 'a' is the overall top scorer in the fixture.
    expect(actual.maxScore).toBe(1900);
  });

  it('lets a non-confirmed competitor drive maxScore', () => {
    // A calibrating player above every confirmed one must still set the
    // ceiling for the progress bars, as the shipped TV code does.
    const fixture = [
      competitor({ id: 'confirmed', conservativeScore: 1500 }),
      competitor({
        id: 'calibrating',
        conservativeScore: 1990,
        provisional: true,
      }),
    ];
    const actual = segmentLeaderboard(fixture);
    expect(actual.maxScore).toBe(legacyTvMaxScore(fixture));
    expect(actual.maxScore).toBe(1990);
  });
});

describe('segmentLeaderboard — behaviour', () => {
  it('excludes competitors with no races', () => {
    const result = segmentLeaderboard(FIXTURE);
    const allIds = [
      ...result.confirmed,
      ...result.inactive,
      ...result.calibrating,
    ].map((c) => c.id);
    expect(allIds).not.toContain('q');
  });

  it('excludes competitors with an undefined raceCount', () => {
    const result = segmentLeaderboard([
      competitor({ id: 'x', conservativeScore: 1500, raceCount: undefined }),
    ]);
    expect(result.confirmed).toHaveLength(0);
  });

  it('sorts an undefined conservativeScore last', () => {
    const result = segmentLeaderboard(FIXTURE);
    expect(result.confirmed[result.confirmed.length - 1].id).toBe('r');
  });

  it('gives tied competitors the same rank and skips the next one', () => {
    const result = segmentLeaderboard(FIXTURE);
    // 'b' and 'c' both sit at 1800.
    expect(result.confirmedRanks.get('b')).toBe(2);
    expect(result.confirmedRanks.get('c')).toBe(2);
    expect(result.confirmedRanks.get('d')).toBe(4);
  });

  it('offsets inactive ranks by the confirmed count', () => {
    const result = segmentLeaderboard(FIXTURE);
    expect(result.inactiveRanks.get('m')).toBe(result.confirmed.length + 1);
  });

  it('offsets calibrating ranks by confirmed + inactive counts', () => {
    const result = segmentLeaderboard(FIXTURE);
    expect(result.calibratingRanks.get('o')).toBe(
      result.confirmed.length + result.inactive.length + 1,
    );
  });

  it('reports "up" when the previous rank was worse', () => {
    const result = segmentLeaderboard(FIXTURE);
    // 'a' was 3rd, is now 1st.
    expect(result.trends.get('a')).toEqual({ direction: 'up', value: 2 });
  });

  it('reports "down" when the previous rank was better', () => {
    const result = segmentLeaderboard(FIXTURE);
    // 'f' was 5th, is now 6th.
    expect(result.trends.get('f')).toEqual({ direction: 'down', value: 1 });
  });

  it('reports "stable" when previousDayRank is null', () => {
    const result = segmentLeaderboard(FIXTURE);
    expect(result.trends.get('d')).toEqual({ direction: 'stable' });
  });

  it('reports "stable" when previousDayRank is absent', () => {
    const result = segmentLeaderboard(FIXTURE);
    expect(result.trends.get('e')).toEqual({ direction: 'stable' });
  });

  it('omits empty league groups', () => {
    const result = segmentLeaderboard(FIXTURE, { excludePodiumFromLeagues: true });
    expect(result.leagueGroups.every((g) => g.items.length > 0)).toBe(true);
  });

  it('keeps the podium league when excludePodiumFromLeagues is false', () => {
    const withPodium = segmentLeaderboard(FIXTURE);
    const withoutPodium = segmentLeaderboard(FIXTURE, {
      excludePodiumFromLeagues: true,
    });
    expect(withPodium.leagueGroups.length).toBeGreaterThan(
      withoutPodium.leagueGroups.length,
    );
  });

  it('returns empty structures for an empty input', () => {
    const result = segmentLeaderboard([]);
    expect(result.confirmed).toEqual([]);
    expect(result.inactive).toEqual([]);
    expect(result.calibrating).toEqual([]);
    expect(result.topThree).toEqual([]);
    expect(result.leagueGroups).toEqual([]);
    expect(result.maxScore).toBe(0);
    expect(result.confirmedRanks.size).toBe(0);
    expect(result.trends.size).toBe(0);
  });
});
