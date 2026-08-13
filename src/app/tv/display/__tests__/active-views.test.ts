import { DisplayView, computeActiveViews } from '../active-views';
import { Competitor } from '@/app/models/Competitor';
import { PingpongPlayer } from '@/app/models/Pingpong';
import { SeasonArchive } from '@/app/repositories/SeasonsRepository';

/**
 * Which views the wall screen is allowed to rotate through.
 *
 * Pulled out of `page.tsx` as a pure function so it can be tested at all:
 * the page itself needs Suspense, `useSearchParams`, two repositories and a
 * 15-second timer, and none of that says anything about the one rule this
 * encodes — a view with nothing to show must not take a turn, or the screen
 * goes blank for fifteen seconds in front of the whole office.
 */

function competitor(overrides: Partial<Competitor> & { id: string }): Competitor {
  return {
    firstName: 'Test',
    lastName: 'Driver',
    profilePictureUrl: '',
    rating: 1500,
    rd: 50,
    vol: 0.06,
    raceCount: 10,
    conservativeScore: 1400,
    ...overrides,
  } as Competitor;
}

function player(overrides: Partial<PingpongPlayer> & { id: string }): PingpongPlayer {
  return {
    competitorId: `c-${overrides.id}`,
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
    diversityScore21d: 0.8,
    rank: 1,
    ...overrides,
  } as PingpongPlayer;
}

const RACED = [competitor({ id: 'a', raceCount: 4 })];

describe('computeActiveViews — competitor rankings', () => {
  it('drops the competitor view when nobody has raced', () => {
    const views = computeActiveViews({
      competitorRankings: [competitor({ id: 'a', raceCount: 0 })],
      pingpongPlayers: [],
      archivedSeasons: [],
    });
    expect(views).not.toContain(DisplayView.COMPETITOR_RANKINGS);
  });

  it('keeps the competitor view when at least one competitor has raced', () => {
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [],
      archivedSeasons: [],
    });
    expect(views).toContain(DisplayView.COMPETITOR_RANKINGS);
  });
});

describe('computeActiveViews — ping-pong', () => {
  it('leaves the rotation at one view when nobody plays ping-pong', () => {
    // Today's production state. The ping-pong view must drop out rather than
    // rotate to an empty board.
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [],
      archivedSeasons: [],
    });
    expect(views).toEqual([DisplayView.COMPETITOR_RANKINGS]);
  });

  it('shows the ping-pong view when players are still calibrating', () => {
    // The cold-start case that matters. For the first weeks every player
    // carries `rank: null`, so gating on ranked players alone would hide
    // ping-pong exactly during the weeks it is new and worth watching.
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [
        player({ id: 'p1', rank: null, provisional: true }),
        player({ id: 'p2', rank: null, provisional: true }),
      ],
      archivedSeasons: [],
    });
    expect(views).toContain(DisplayView.PINGPONG_RANKINGS);
  });

  it('shows the ping-pong view when the only players are inactive', () => {
    // Inactive players are still rendered, dimmed. A view that renders rows
    // is a view worth rotating to.
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [player({ id: 'p1', rank: null, inactive: true })],
      archivedSeasons: [],
    });
    expect(views).toContain(DisplayView.PINGPONG_RANKINGS);
  });

  it('drops the ping-pong view when every player is archived', () => {
    // Archived players are filtered out of the view, so the board would be
    // blank. Counting them would rotate to an empty screen.
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [
        player({ id: 'p1', archived: true }),
        player({ id: 'p2', archived: true }),
      ],
      archivedSeasons: [],
    });
    expect(views).not.toContain(DisplayView.PINGPONG_RANKINGS);
  });

  it('rotates between both boards once ping-pong has players', () => {
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [player({ id: 'p1' })],
      archivedSeasons: [],
    });
    expect(views).toEqual([
      DisplayView.COMPETITOR_RANKINGS,
      DisplayView.PINGPONG_RANKINGS,
    ]);
  });
});

describe('computeActiveViews — archived seasons', () => {
  it('rotates to archived seasons once there are archives to show', () => {
    // The view spent a long time built but unreachable, held out of
    // ALL_VIEWS on purpose. That hold has been lifted, so the only thing
    // gating it now is whether there is anything archived.
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [],
      archivedSeasons: [{ id: 's1' } as SeasonArchive],
    });
    expect(views).toContain(DisplayView.ARCHIVED_SEASONS);
  });

  it('drops archived seasons when there is nothing archived', () => {
    // The screen is unattended, so an empty board would hold a rotation slot
    // with nobody there to skip it.
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [],
      archivedSeasons: [],
    });
    expect(views).not.toContain(DisplayView.ARCHIVED_SEASONS);
  });

  it('rotates through all three boards when every one has data', () => {
    const views = computeActiveViews({
      competitorRankings: RACED,
      pingpongPlayers: [player({ id: 'p1' })],
      archivedSeasons: [{ id: 's1' } as SeasonArchive],
    });
    expect(views).toEqual([
      DisplayView.COMPETITOR_RANKINGS,
      DisplayView.PINGPONG_RANKINGS,
      DisplayView.ARCHIVED_SEASONS,
    ]);
  });
});
