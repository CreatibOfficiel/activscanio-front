import { Competitor } from '@/app/models/Competitor';
import { rankMovement } from './rank-movement';
import { computeRanksWithTies } from './rankings';
import { groupByLeague, LeagueConfig } from './leagues';
import { TrendDirection } from '@/app/components/leaderboard/TrendIndicator';

export interface LeaderboardTrend {
  direction: TrendDirection;
  value?: number;
}

export interface LeaderboardSegmentationOptions {
  /**
   * Drop the podium league from `leagueGroups`. The homepage and the TV view
   * both render the top three separately, so they set this to true.
   */
  excludePodiumFromLeagues?: boolean;
  /** How many competitors make up the podium. */
  podiumSize?: number;
}

export interface LeaderboardSegmentation {
  /** Confirmed and active, sorted by conservativeScore descending. */
  confirmed: Competitor[];
  /** Confirmed but inactive, sorted. */
  inactive: Competitor[];
  /** Still calibrating (provisional), sorted. */
  calibrating: Competitor[];
  /** The first `podiumSize` confirmed competitors. */
  topThree: Competitor[];
  /** Ranks 1..n over confirmed competitors, ties shared. */
  confirmedRanks: Map<string, number>;
  /** Ranks over inactive competitors, offset by `confirmed.length`. */
  inactiveRanks: Map<string, number>;
  /** Ranks over calibrating competitors, offset by confirmed + inactive. */
  calibratingRanks: Map<string, number>;
  /** Confirmed competitors grouped by league; empty groups are dropped. */
  leagueGroups: { league: LeagueConfig; items: Competitor[] }[];
  /** Trend per competitor id, derived from previousDayRank. Confirmed only. */
  trends: Map<string, LeaderboardTrend>;
  /**
   * Highest score across every competitor with at least one race — including
   * inactive and calibrating ones. Drives the TV progress bars.
   */
  maxScore: number;
}

const scoreOf = (c: Competitor) => Math.round(c.conservativeScore ?? 0);
const idOf = (c: Competitor) => c.id;

/**
 * Sort by conservative score descending, pushing competitors without a score
 * to the end rather than treating them as zero.
 */
function sortByConservativeScore(competitors: Competitor[]): Competitor[] {
  return [...competitors].sort((a, b) => {
    if (a.conservativeScore === undefined && b.conservativeScore === undefined)
      return 0;
    if (a.conservativeScore === undefined) return 1;
    if (b.conservativeScore === undefined) return -1;
    return b.conservativeScore - a.conservativeScore;
  });
}

/**
 * Movement arrows, for the competitors who earned them.
 *
 * Only someone who raced recently gets an arrow. Roughly half the rank
 * changes in a pool this size happen to people who did not play: someone
 * else wins, overtakes them, and their row would sprout a red arrow for a
 * day they were not there.
 *
 * The passive climber loses their arrow too, which is the honest cost —
 * their rank number still moves on screen, and that is the fact; the arrow
 * only claims a reason, which in their case was somebody else's race.
 */
function computeTrends(
  confirmed: Competitor[],
  ranks: Map<string, number>,
): Map<string, LeaderboardTrend> {
  const trends = new Map<string, LeaderboardTrend>();

  confirmed.forEach((competitor) => {
    const movement = rankMovement({
      rank: ranks.get(competitor.id) ?? null,
      previousRank: competitor.previousDayRank,
      lastActiveAt: competitor.lastRaceDate,
    });

    trends.set(
      competitor.id,
      movement
        ? { direction: movement.direction, value: movement.places }
        : { direction: 'stable' },
    );
  });

  return trends;
}

/**
 * Split a competitor list into the three leaderboard tiers and compute
 * everything the leaderboard views need: ranks, league groups and trends.
 *
 * Pure function — see `useLeaderboardSegmentation` for the memoised hook.
 */
export function segmentLeaderboard(
  competitors: Competitor[],
  options: LeaderboardSegmentationOptions = {},
): LeaderboardSegmentation {
  const { excludePodiumFromLeagues = false, podiumSize = 3 } = options;

  const withRaces = competitors.filter((c) => c.raceCount && c.raceCount > 0);
  const sorted = sortByConservativeScore(withRaces);

  const confirmed = sorted.filter((c) => !c.provisional && !c.inactive);
  const inactive = sorted.filter((c) => !c.provisional && c.inactive);
  const calibrating = sorted.filter((c) => c.provisional);

  const confirmedRanks = computeRanksWithTies(confirmed, scoreOf, idOf);
  const inactiveRanks = computeRanksWithTies(
    inactive,
    scoreOf,
    idOf,
    confirmed.length,
  );
  const calibratingRanks = computeRanksWithTies(
    calibrating,
    scoreOf,
    idOf,
    confirmed.length + inactive.length,
  );

  const maxScore = withRaces.length
    ? Math.max(...withRaces.map((c) => c.conservativeScore ?? 0))
    : 0;

  return {
    confirmed,
    inactive,
    calibrating,
    topThree: confirmed.slice(0, podiumSize),
    confirmedRanks,
    inactiveRanks,
    calibratingRanks,
    leagueGroups: groupByLeague(
      confirmed,
      idOf,
      confirmedRanks,
      excludePodiumFromLeagues,
    ),
    trends: computeTrends(confirmed, confirmedRanks),
    maxScore,
  };
}
