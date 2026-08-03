import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongPage from '../page';
import { usePingpongLeaderboard } from '../../hooks/usePingpongLeaderboard';
import { useSportPreference } from '../../hooks/useSportPreference';
import { segmentPingpongLeaderboard } from '../../utils/pingpong-leaderboard';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import {
  PingpongMatch,
  PingpongMatchPlayer,
  PingpongPlayer,
} from '../../models/Pingpong';

jest.mock('../../hooks/usePingpongLeaderboard');
jest.mock('../../hooks/useSportPreference');
jest.mock('../../repositories/PingpongRepository', () => ({
  __esModule: true,
  pingpongRepository: {
    fetchRecentMatches: jest.fn(),
  },
}));

const fetchRecentMatches = pingpongRepository.fetchRecentMatches as jest.Mock;

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const mockedBoard = usePingpongLeaderboard as jest.MockedFunction<
  typeof usePingpongLeaderboard
>;
const mockedPreference = useSportPreference as jest.MockedFunction<
  typeof useSportPreference
>;

/**
 * The ping-pong leaderboard screen.
 *
 * One flat list, per the research: no platform surveyed renders three
 * separately-headed groups, and three headers on a 25-row phone list turns a
 * third of the screen into chrome.
 *
 * Everyone the API returned appears. Someone who cannot find themselves
 * assumes the app forgot them, which is worse than seeing themselves
 * unranked.
 *
 * Crossing to the Mario Kart board is the bottom nav's job, not this page's.
 * The sport switcher that used to sit here looked like a filter and behaved
 * like navigation; see the block below for why it went.
 */
describe('PingpongPage', () => {
  function player(overrides: Partial<PingpongPlayer> = {}): PingpongPlayer {
    return {
      id: 'p1',
      competitorId: 'c1',
      firstName: 'Marc',
      lastName: 'Dupont',
      profilePictureUrl: '',
      rating: 1600,
      rd: 60,
      vol: 0.06,
      conservativeScore: 1480,
      matchCount: 20,
      weightedMatchCount: 20,
      wins: 12,
      losses: 8,
      setsWon: 30,
      setsLost: 25,
      currentStreak: 1,
      bestStreak: 4,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 5,
      diversityScore21d: 0.9,
      rank: 1,
      ...overrides,
    };
  }

  function givenBoard(
    players: PingpongPlayer[],
    state: { loading?: boolean; error?: Error | null } = {},
  ) {
    mockedBoard.mockReturnValue({
      players,
      segmentation: segmentPingpongLeaderboard(players),
      loading: state.loading ?? false,
      error: state.error ?? null,
      refresh: jest.fn(),
    });
  }

  function givenPreference(followsBoth: boolean) {
    mockedPreference.mockReturnValue({
      preference: followsBoth ? 'both' : 'ping-pong',
      sports: followsBoth ? ['mario-kart', 'ping-pong'] : ['ping-pong'],
      showsMarioKart: followsBoth,
      showsPingpong: true,
      followsBoth,
      loading: false,
      saving: false,
      change: jest.fn(),
    });
  }

  function matchPlayer(
    overrides: Partial<PingpongMatchPlayer> = {},
  ): PingpongMatchPlayer {
    return {
      id: 'p1',
      competitorId: 'c1',
      firstName: 'Marc',
      lastName: 'Dupont',
      profilePictureUrl: '',
      ...overrides,
    };
  }

  function match(overrides: Partial<PingpongMatch> = {}): PingpongMatch {
    return {
      id: 'm1',
      playerAId: 'p1',
      playerBId: 'p2',
      playerA: matchPlayer({ id: 'p1', firstName: 'Marc', lastName: 'Dupont' }),
      playerB: matchPlayer({ id: 'p2', firstName: 'Léa', lastName: 'Bernard' }),
      winnerId: 'p1',
      sets: [
        { a: 11, b: 7 },
        { a: 11, b: 9 },
      ],
      playedAt: '2026-03-14T12:00:00Z',
      appliedWeight: 1,
      ratingFrozen: false,
      ratingABefore: 1608,
      ratingAAfter: 1620,
      ratingBBefore: 1540,
      ratingBAfter: 1532,
      ...overrides,
    };
  }

  function givenMatches(matches: PingpongMatch[]) {
    fetchRecentMatches.mockResolvedValue(matches);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    givenPreference(false);
    // The default for the tests that predate the matches section: they assert
    // on the board alone and must not trip over an unmocked request.
    givenMatches([]);
  });

  it('renders one row per player across every tier', async () => {
    givenBoard([
      player({ id: 'a', firstName: 'Marc', rank: 1 }),
      player({ id: 'b', firstName: 'Julie', rank: null, provisional: true }),
      player({ id: 'c', firstName: 'Sam', rank: null, inactive: true }),
    ]);

    render(<PingpongPage />);

    await waitFor(() =>
      expect(screen.getAllByTestId('pingpong-row')).toHaveLength(3),
    );
  });

  it('renders no group headings', async () => {
    // The single-list decision. Section headers would reify "the bottom
    // group" as somewhere people live.
    givenBoard([
      player({ id: 'a', rank: 1 }),
      player({ id: 'b', rank: null, provisional: true }),
    ]);

    render(<PingpongPage />);

    await waitFor(() => expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2));

    // No section headings. The summary line above the list mentions the
    // tiers, which is fine — what must not exist is a heading splitting the
    // list into groups.
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toEqual(['Classement ping-pong']);
  });

  it('keeps ranked players above the unranked', async () => {
    givenBoard([
      player({ id: 'new', firstName: 'Julie', rank: null, provisional: true }),
      player({ id: 'top', firstName: 'Marc', rank: 1 }),
    ]);

    render(<PingpongPage />);

    await waitFor(() => expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2));
    const names = screen.getAllByTestId('pingpong-row').map((row) => row.textContent);
    expect(names[0]).toMatch(/Marc/);
    expect(names[1]).toMatch(/Julie/);
  });

  /**
   * The sport switcher used to live here, and no longer does.
   *
   * These tests previously asserted it appeared for a `followsBoth` user and
   * called router.push('/') when Mario Kart was picked. They now assert the
   * opposite, because that control was the bug the user reported.
   *
   * It was a segmented radiogroup — the shape of an in-page filter — whose
   * only behaviour was to navigate to a different route. Two failures
   * compounded: nothing on screen predicted that tapping it would leave the
   * page, and `/` is the app home, arriving with a season countdown, streak
   * banners and a ranking animation. Worse, `/` renders no switcher of its
   * own, so the "filter" only ever went one way — a filter you cannot undo
   * from the other side is not a filter.
   *
   * The bottom nav already offers both boards as explicit tabs, to everyone,
   * regardless of preference. Keeping a second control that looks unlike the
   * first and does the same thing is worse than having only the first.
   */
  describe('crossing to the Mario Kart board', () => {
    it('offers no radiogroup, whatever sports the user follows', async () => {
      // Both preferences, since the old control was gated on followsBoth.
      for (const followsBoth of [false, true]) {
        givenPreference(followsBoth);
        givenBoard([player()]);

        const { unmount } = render(<PingpongPage />);

        await waitFor(() =>
          expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
        );
        expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

        unmount();
      }
    });

    it('pushes no route however the user pokes at it', async () => {
      // The heart of the report: a tap that silently teleported. Clicking
      // every control the page renders must leave the router untouched, so
      // nothing here can move the user without a visible link saying so.
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
      );

      for (const control of [
        ...screen.queryAllByRole('button'),
        ...screen.queryAllByRole('radio'),
      ]) {
        await userEvent.click(control);
      }

      expect(push).not.toHaveBeenCalled();
    });

    it('offers no control naming the other sport', async () => {
      // Whatever remains on this page, nothing advertises Mario Kart in a
      // way a user could tap expecting a filter. Queried by accessible name
      // across every role rather than by role: the old control's buttons
      // carried role="radio", so a button-role query missed them entirely.
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
      );
      expect(screen.queryByText(/mario kart/i)).not.toBeInTheDocument();
    });

    it('leaves every interactive control on the page a plain link', async () => {
      // The positive half of the rule: what stays must look like what it
      // does. The empty-state CTA is a link to /pingpong/add, and a link
      // that navigates is exactly what a user predicts.
      givenPreference(true);
      givenBoard([]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByTestId('pingpong-empty')).toBeInTheDocument(),
      );

      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.getByRole('link', { name: /match/i })).toHaveAttribute(
        'href',
        '/pingpong/add',
      );
    });
  });

  describe('the add button', () => {
    it('is offered once someone is on the board', () => {
      givenBoard([player()]);

      render(<PingpongPage />);

      expect(screen.getByTestId('add-activity')).toBeInTheDocument();
    });

    it('is absent on an empty board', () => {
      // The empty state carries its own call to action a few pixels away.
      // Two prompts to do the same thing on one screen is one too many.
      givenBoard([]);

      render(<PingpongPage />);

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });

    it('is absent while loading', () => {
      givenBoard([], { loading: true });

      render(<PingpongPage />);

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });

    it('is absent when the board failed to load', () => {
      // Offering to add a match under an error message reads as if the
      // error had nothing to do with the app.
      givenBoard([], { error: new Error('offline') });

      render(<PingpongPage />);

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('shows a loading state', () => {
      givenBoard([], { loading: true });

      render(<PingpongPage />);

      expect(screen.getByTestId('pingpong-loading')).toBeInTheDocument();
    });

    it('invites a first match when nobody has played', async () => {
      // "Aucun joueur" is a dead end; the empty state should say what to do.
      givenBoard([]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByTestId('pingpong-empty')).toBeInTheDocument(),
      );
      expect(screen.getByRole('link', { name: /match/i })).toBeInTheDocument();
    });

    it('shows an error state rather than an empty board', async () => {
      // An empty list after a failed request reads as "nobody plays",
      // which is a lie.
      givenBoard([], { error: new Error('offline') });

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByTestId('pingpong-error')).toBeInTheDocument(),
      );
      expect(screen.queryByTestId('pingpong-empty')).not.toBeInTheDocument();
    });

    it('does not show the empty state while still loading', async () => {
      givenBoard([], { loading: true });

      render(<PingpongPage />);

      expect(screen.queryByTestId('pingpong-empty')).not.toBeInTheDocument();
    });
  });

  it('counts the players it is showing', async () => {
    givenBoard([
      player({ id: 'a', rank: 1 }),
      player({ id: 'b', rank: 2 }),
      player({ id: 'c', rank: null, provisional: true }),
    ]);

    render(<PingpongPage />);

    await waitFor(() =>
      expect(screen.getByTestId('pingpong-count')).toHaveTextContent('2'),
    );
  });

  /**
   * The match history, which now lives here and nowhere else.
   *
   * `/pingpong/matches` was a fully-built page nothing linked to — no `Link`
   * anywhere in the tree pointed at it, so it was reachable only by typing
   * the URL. It has been deleted and its rendering folded into this page.
   *
   * The section matters most on a cold start. Ping-pong launched with zero
   * matches and zero players, and calibration withholds a rank until eight
   * weighted matches, so the first eight matches produce a leaderboard that
   * is still empty. A screen whose only content is an empty ranking reads as
   * a broken feature; the same screen showing yesterday's matches reads as a
   * feature nobody has got round to yet. Hence: matches appear from the first
   * one recorded, whether or not anybody is ranked.
   */
  describe('the matches section', () => {
    it('renders a card per match below the board', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match({ id: 'm1' }), match({ id: 'm2' })]);

      render(<PingpongPage />);

      expect(await screen.findAllByTestId('match-card')).toHaveLength(2);
    });

    it('shows matches even when nobody is ranked yet', async () => {
      // The cold-start case, and the reason the section exists. For the first
      // eight weighted matches every player is still calibrating, so the
      // ranked list is empty while real matches have been played.
      givenBoard([
        player({ id: 'a', rank: null, provisional: true }),
        player({ id: 'b', rank: null, provisional: true }),
      ]);
      givenMatches([match({ id: 'm1' })]);

      render(<PingpongPage />);

      expect(await screen.findByTestId('match-card')).toBeInTheDocument();
      expect(screen.getByTestId('pingpong-count')).toHaveTextContent('0');
    });

    it('groups matches under a date separator', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([
        match({ id: 'recent', playedAt: '2026-03-14T12:00:00Z' }),
        match({ id: 'older', playedAt: '2026-03-01T12:00:00Z' }),
      ]);

      render(<PingpongPage />);

      await screen.findAllByTestId('match-card');
      const section = screen.getByTestId('pingpong-matches');
      // Two different days means two separators, each carrying its count.
      expect(within(section).getAllByTestId('match-card')).toHaveLength(2);
      expect(section.textContent).not.toMatch(/undefined/i);
    });

    it('keeps the API order, newest first', async () => {
      // The API sorts DESC; grouping must not reverse it.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([
        match({ id: 'recent', playedAt: '2026-03-14T12:00:00Z' }),
        match({ id: 'older', playedAt: '2026-03-01T12:00:00Z' }),
      ]);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('match-card');
      expect(cards[0]).toHaveAttribute('data-match-id', 'recent');
      expect(cards[1]).toHaveAttribute('data-match-id', 'older');
    });

    it('keeps a match whose player the API could not load', async () => {
      // Archived players come back null while their matches remain. Dropping
      // the row would silently shorten everyone's history.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match({ playerBId: 'disparu', playerB: null })]);

      render(<PingpongPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-b')).toHaveTextContent(
        /joueur inconnu/i,
      );
      expect(card).not.toHaveTextContent(/undefined/i);
    });

    it('shows a skeleton while the matches are in flight', () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      fetchRecentMatches.mockReturnValue(new Promise(() => {}));

      render(<PingpongPage />);

      expect(screen.getByTestId('pingpong-matches-loading')).toBeInTheDocument();
    });

    it('renders no matches section at all when there are none', async () => {
      // Nothing to show and nothing to explain: the board's own empty state
      // already says to record the first match. An "aucun match" panel
      // underneath it would be the same sentence twice.
      givenBoard([]);
      givenMatches([]);

      render(<PingpongPage />);

      await screen.findByTestId('pingpong-empty');
      expect(screen.queryByTestId('pingpong-matches')).not.toBeInTheDocument();
    });

    /**
     * The two requests are independent, which is the point of fetching the
     * matches here rather than folding them into the leaderboard hook.
     */
    describe('independence from the leaderboard', () => {
      it('still renders the board when the matches fail', async () => {
        givenBoard([player({ id: 'a', rank: 1 })]);
        fetchRecentMatches.mockRejectedValue(new Error('500'));

        render(<PingpongPage />);

        // Awaited, not read synchronously after the rows: the rejection
        // settles a tick later than the board renders, and a getBy here
        // races it.
        await screen.findByTestId('pingpong-matches-error');
        // The board is intact and the failure is scoped to its own section.
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1);
        expect(screen.queryByTestId('pingpong-error')).not.toBeInTheDocument();
      });

      it('offers a retry that reloads only the matches', async () => {
        givenBoard([player({ id: 'a', rank: 1 })]);
        fetchRecentMatches.mockRejectedValue(new Error('500'));

        render(<PingpongPage />);

        const error = await screen.findByTestId('pingpong-matches-error');
        givenMatches([match()]);
        await userEvent.click(within(error).getByRole('button'));

        expect(await screen.findByTestId('match-card')).toBeInTheDocument();
      });

      it('shows no matches section when the board itself failed', async () => {
        // A dead board means the whole screen is an error message. Matches
        // below it would suggest the failure was partial when it was not.
        givenBoard([], { error: new Error('offline') });
        givenMatches([match()]);

        render(<PingpongPage />);

        await screen.findByTestId('pingpong-error');
        expect(screen.queryByTestId('pingpong-matches')).not.toBeInTheDocument();
      });

      it('fetches the matches once', async () => {
        givenBoard([player({ id: 'a', rank: 1 })]);
        givenMatches([match()]);

        render(<PingpongPage />);

        await screen.findByTestId('match-card');
        expect(fetchRecentMatches).toHaveBeenCalledTimes(1);
      });
    });

    it('offers a way to record a match when the board failed to load', async () => {
      // A failed leaderboard read is a broken read path, not a broken write
      // path. Leaving the error state with no action makes an unrelated
      // failure block recording a match that has already been played.
      givenBoard([], { error: new Error('offline') });

      render(<PingpongPage />);

      const error = await screen.findByTestId('pingpong-error');
      expect(
        within(error).getByRole('link', { name: /enregistrer un match/i }),
      ).toHaveAttribute('href', '/pingpong/add');
    });
  });
});
