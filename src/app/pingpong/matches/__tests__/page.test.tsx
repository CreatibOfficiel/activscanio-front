import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchesPage from '../page';
import { pingpongRepository } from '../../../repositories/PingpongRepository';
import { PingpongMatch, PingpongPlayer } from '../../../models/Pingpong';

jest.mock('../../../repositories/PingpongRepository', () => ({
  __esModule: true,
  pingpongRepository: {
    fetchRecentMatches: jest.fn(),
    fetchLeaderboard: jest.fn(),
  },
}));

const fetchRecentMatches = pingpongRepository.fetchRecentMatches as jest.Mock;
const fetchLeaderboard = pingpongRepository.fetchLeaderboard as jest.Mock;

/**
 * The ping-pong match history.
 *
 * The screen makes two requests, not one. `GET /pingpong/matches` returns
 * playerAId and playerBId and no names at all — the controller does a bare
 * find() with no relations — so the names come from the leaderboard and the
 * page joins them client-side on PingpongPlayer.id.
 *
 * That join is the thing most likely to break, and it breaks quietly: a
 * missing player yields `undefined` in a template rather than an exception.
 * So the tests below assert on names rather than on counts, and one of them
 * deliberately references a player the leaderboard never returned.
 */
describe('Ping-pong match history', () => {
  function player(overrides: Partial<PingpongPlayer> = {}): PingpongPlayer {
    return {
      id: 'p1',
      competitorId: 'c1',
      firstName: 'Marc',
      lastName: 'Dupont',
      profilePictureUrl: '',
      rating: 1620,
      rd: 55,
      vol: 0.06,
      conservativeScore: 1510,
      matchCount: 24,
      weightedMatchCount: 20,
      wins: 15,
      losses: 9,
      setsWon: 38,
      setsLost: 27,
      currentStreak: 3,
      bestStreak: 6,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 5,
      diversityScore21d: 0.9,
      rank: 2,
      ...overrides,
    };
  }

  function match(overrides: Partial<PingpongMatch> = {}): PingpongMatch {
    return {
      id: 'm1',
      playerAId: 'p1',
      playerBId: 'p2',
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

  const LEADERBOARD = [
    player({ id: 'p1', competitorId: 'c1', firstName: 'Marc', lastName: 'Dupont' }),
    player({ id: 'p2', competitorId: 'c2', firstName: 'Léa', lastName: 'Bernard' }),
    player({ id: 'p3', competitorId: 'c3', firstName: 'Yannis', lastName: 'Roux' }),
  ];

  function resolveWith(matches: PingpongMatch[], players = LEADERBOARD) {
    fetchRecentMatches.mockResolvedValue(matches);
    fetchLeaderboard.mockResolvedValue(players);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading', () => {
    it('shows a skeleton while both requests are in flight', () => {
      fetchRecentMatches.mockReturnValue(new Promise(() => {}));
      fetchLeaderboard.mockReturnValue(new Promise(() => {}));

      render(<MatchesPage />);

      expect(screen.getByTestId('matches-loading')).toBeInTheDocument();
    });

    it('does not show the empty state while still loading', () => {
      // An empty list and a list not yet loaded look identical in state;
      // conflating them flashes "no matches" on every visit.
      fetchRecentMatches.mockReturnValue(new Promise(() => {}));
      fetchLeaderboard.mockReturnValue(new Promise(() => {}));

      render(<MatchesPage />);

      expect(screen.queryByTestId('matches-empty')).not.toBeInTheDocument();
    });

    it('clears the skeleton once the data arrives', async () => {
      resolveWith([match()]);

      render(<MatchesPage />);

      await waitFor(() =>
        expect(screen.queryByTestId('matches-loading')).not.toBeInTheDocument(),
      );
    });
  });

  describe('the list', () => {
    it('renders one card per match', async () => {
      resolveWith([
        match({ id: 'm1' }),
        match({ id: 'm2', playerAId: 'p3', playerBId: 'p1', winnerId: 'p3' }),
      ]);

      render(<MatchesPage />);

      expect(await screen.findAllByTestId('match-card')).toHaveLength(2);
    });

    it('names both players of a match', async () => {
      // Only reachable through the leaderboard join: the matches endpoint
      // sends ids alone.
      resolveWith([match()]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-a')).toHaveTextContent(
        /Marc/,
      );
      expect(within(card).getByTestId('match-player-b')).toHaveTextContent(
        /Léa/,
      );
    });

    it('joins on the player id and not the competitor id', async () => {
      // Matches carry PingpongPlayer.id. Keying the map on competitorId
      // compiles fine — both are strings — and shows nobody's name.
      resolveWith([match({ playerAId: 'p1', playerBId: 'p3' })]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-b')).toHaveTextContent(
        /Yannis/,
      );
    });

    it('keeps a match whose player is absent from the leaderboard', async () => {
      // Archived players drop off the board while their matches remain.
      // Dropping the row would silently shrink the history.
      resolveWith([match({ id: 'm1', playerBId: 'disparu' })]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-b')).toHaveTextContent(
        /joueur inconnu/i,
      );
      expect(card).not.toHaveTextContent(/undefined/i);
    });

    it('shows set scores in the order played', async () => {
      resolveWith([
        match({
          sets: [
            { a: 11, b: 7 },
            { a: 9, b: 11 },
            { a: 12, b: 10 },
          ],
        }),
      ]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      const sets = within(card).getAllByTestId('match-set');
      expect(sets.map((s) => s.textContent)).toEqual([
        '11-7',
        '9-11',
        '12-10',
      ]);
    });

    it('marks the winner', async () => {
      resolveWith([match({ winnerId: 'p2' })]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-b')).toHaveAttribute(
        'data-winner',
        'true',
      );
    });

    it('signs the rating delta of each player', async () => {
      resolveWith([
        match({
          ratingABefore: 1608,
          ratingAAfter: 1620,
          ratingBBefore: 1540,
          ratingBAfter: 1532,
        }),
      ]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-delta-a')).toHaveTextContent('+12');
      expect(within(card).getByTestId('match-delta-b')).toHaveTextContent('−8');
    });

    it('explains a frozen match rather than showing +0', async () => {
      resolveWith([
        match({
          ratingFrozen: true,
          ratingABefore: 1620,
          ratingAAfter: 1620,
          ratingBBefore: 1200,
          ratingBAfter: 1200,
        }),
      ]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-frozen')).toHaveTextContent(
        /non compt/i,
      );
      expect(within(card).queryByTestId('match-delta-a')).not.toBeInTheDocument();
    });

    it('lists the most recent match first', async () => {
      // The API sorts DESC; the page must not reverse it while grouping.
      resolveWith([
        match({ id: 'recent', playedAt: '2026-03-14T12:00:00Z' }),
        match({
          id: 'older',
          playedAt: '2026-03-01T12:00:00Z',
          playerAId: 'p3',
          playerBId: 'p2',
          winnerId: 'p3',
        }),
      ]);

      render(<MatchesPage />);

      const cards = await screen.findAllByTestId('match-card');
      expect(cards[0]).toHaveAttribute('data-match-id', 'recent');
      expect(cards[1]).toHaveAttribute('data-match-id', 'older');
    });
  });

  describe('empty state', () => {
    it('appears when there are no matches', async () => {
      resolveWith([]);

      render(<MatchesPage />);

      expect(await screen.findByTestId('matches-empty')).toBeInTheDocument();
    });

    it('says what to do next rather than only that the list is empty', async () => {
      // "Aucun match" alone leaves a first-time visitor with no next step.
      resolveWith([]);

      render(<MatchesPage />);

      const empty = await screen.findByTestId('matches-empty');
      expect(empty.textContent!.length).toBeGreaterThan(40);
      expect(empty).toHaveTextContent(/premier match|enregistr/i);
    });

    it('renders no cards', async () => {
      resolveWith([]);

      render(<MatchesPage />);

      await screen.findByTestId('matches-empty');
      expect(screen.queryAllByTestId('match-card')).toHaveLength(0);
    });
  });

  describe('errors', () => {
    it('shows an error state when the matches request fails', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));
      fetchLeaderboard.mockResolvedValue(LEADERBOARD);

      render(<MatchesPage />);

      expect(await screen.findByTestId('matches-error')).toBeInTheDocument();
    });

    it('shows an error state when the leaderboard request fails', async () => {
      // The join has no names without it, so a page of "Joueur inconnu"
      // rows would be worse than saying the load failed.
      fetchRecentMatches.mockResolvedValue([match()]);
      fetchLeaderboard.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      expect(await screen.findByTestId('matches-error')).toBeInTheDocument();
    });

    it('stops the skeleton on failure instead of spinning forever', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));
      fetchLeaderboard.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      await screen.findByTestId('matches-error');
      expect(screen.queryByTestId('matches-loading')).not.toBeInTheDocument();
    });

    it('does not show the empty state on failure', async () => {
      // A failed load is not an empty history, and telling someone their
      // matches are gone when the server merely 500'd is worse than useless.
      fetchRecentMatches.mockRejectedValue(new Error('500'));
      fetchLeaderboard.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      await screen.findByTestId('matches-error');
      expect(screen.queryByTestId('matches-empty')).not.toBeInTheDocument();
    });

    it('offers a retry', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));
      fetchLeaderboard.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      const error = await screen.findByTestId('matches-error');
      expect(within(error).getByRole('button')).toHaveTextContent(/réessayer/i);
    });

    it('reloads both endpoints when the retry is pressed', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));
      fetchLeaderboard.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      const error = await screen.findByTestId('matches-error');
      resolveWith([match()]);
      await userEvent.click(within(error).getByRole('button'));

      expect(await screen.findByTestId('match-card')).toBeInTheDocument();
    });
  });

  it('fetches the matches and the leaderboard, and nothing else', async () => {
    // Two requests, one join. Fetching a player per match would be N+1 on a
    // list that routinely runs to fifty rows.
    resolveWith([match({ id: 'm1' }), match({ id: 'm2' })]);

    render(<MatchesPage />);

    await screen.findAllByTestId('match-card');
    expect(fetchRecentMatches).toHaveBeenCalledTimes(1);
    expect(fetchLeaderboard).toHaveBeenCalledTimes(1);
  });

  it('titles the page', async () => {
    resolveWith([match()]);

    render(<MatchesPage />);

    expect(
      await screen.findByRole('heading', { name: /match/i }),
    ).toBeInTheDocument();
  });
});
