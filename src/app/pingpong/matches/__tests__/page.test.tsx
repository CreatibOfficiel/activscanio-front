import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchesPage from '../page';
import { pingpongRepository } from '../../../repositories/PingpongRepository';
import { PingpongMatch, PingpongMatchPlayer } from '../../../models/Pingpong';

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
 * One request. `GET /pingpong/matches` eager-loads the player relations and
 * embeds both sides on each match, so the page no longer fetches the
 * leaderboard as well and no longer joins on the id itself. The leaderboard
 * mock stays declared purely so a test can prove it is never called.
 *
 * A match can still arrive with a null player — archived, deleted. That
 * breaks quietly if unhandled, yielding `undefined` in a template rather
 * than an exception, so one test below deliberately sends one.
 */
describe('Ping-pong match history', () => {
  function player(
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
      playerA: player({ id: 'p1', firstName: 'Marc', lastName: 'Dupont' }),
      playerB: player({ id: 'p2', firstName: 'Léa', lastName: 'Bernard' }),
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

  function resolveWith(matches: PingpongMatch[]) {
    fetchRecentMatches.mockResolvedValue(matches);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading', () => {
    it('shows a skeleton while the request is in flight', () => {
      fetchRecentMatches.mockReturnValue(new Promise(() => {}));

      render(<MatchesPage />);

      expect(screen.getByTestId('matches-loading')).toBeInTheDocument();
    });

    it('does not show the empty state while still loading', () => {
      // An empty list and a list not yet loaded look identical in state;
      // conflating them flashes "no matches" on every visit.
      fetchRecentMatches.mockReturnValue(new Promise(() => {}));

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
        match({
          id: 'm2',
          playerAId: 'p3',
          playerBId: 'p1',
          winnerId: 'p3',
          playerA: player({ id: 'p3', firstName: 'Yannis', lastName: 'Roux' }),
          playerB: player({ id: 'p1', firstName: 'Marc', lastName: 'Dupont' }),
        }),
      ]);

      render(<MatchesPage />);

      expect(await screen.findAllByTestId('match-card')).toHaveLength(2);
    });

    it('names both players of a match', async () => {
      // Read off the match itself. The endpoint embeds both sides, so no
      // second response is needed to put a name on screen.
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

    it('names a player the leaderboard would never have supplied', async () => {
      // Proof the name comes from the match and not from a joined board:
      // this player appears in no other response the page could read.
      resolveWith([
        match({
          playerBId: 'p3',
          playerB: player({ id: 'p3', firstName: 'Yannis', lastName: 'Roux' }),
        }),
      ]);

      render(<MatchesPage />);

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-b')).toHaveTextContent(
        /Yannis/,
      );
    });

    it('keeps a match whose player the API could not load', async () => {
      // Archived players come back null while their matches remain.
      // Dropping the row would silently shrink the history.
      resolveWith([match({ id: 'm1', playerBId: 'disparu', playerB: null })]);

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
          playerA: player({ id: 'p3', firstName: 'Yannis', lastName: 'Roux' }),
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

      render(<MatchesPage />);

      expect(await screen.findByTestId('matches-error')).toBeInTheDocument();
    });

    it('stops the skeleton on failure instead of spinning forever', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      await screen.findByTestId('matches-error');
      expect(screen.queryByTestId('matches-loading')).not.toBeInTheDocument();
    });

    it('does not show the empty state on failure', async () => {
      // A failed load is not an empty history, and telling someone their
      // matches are gone when the server merely 500'd is worse than useless.
      fetchRecentMatches.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      await screen.findByTestId('matches-error');
      expect(screen.queryByTestId('matches-empty')).not.toBeInTheDocument();
    });

    it('offers a retry', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      const error = await screen.findByTestId('matches-error');
      expect(within(error).getByRole('button')).toHaveTextContent(/réessayer/i);
    });

    it('reloads the matches when the retry is pressed', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      const error = await screen.findByTestId('matches-error');
      resolveWith([match()]);
      await userEvent.click(within(error).getByRole('button'));

      expect(await screen.findByTestId('match-card')).toBeInTheDocument();
    });

    it('does not fetch the leaderboard on a retry either', async () => {
      fetchRecentMatches.mockRejectedValue(new Error('500'));

      render(<MatchesPage />);

      const error = await screen.findByTestId('matches-error');
      resolveWith([match()]);
      await userEvent.click(within(error).getByRole('button'));

      await screen.findByTestId('match-card');
      expect(fetchLeaderboard).not.toHaveBeenCalled();
    });
  });

  describe('one request, not two', () => {
    it('fetches the matches once', async () => {
      resolveWith([match({ id: 'm1' }), match({ id: 'm2' })]);

      render(<MatchesPage />);

      await screen.findAllByTestId('match-card');
      expect(fetchRecentMatches).toHaveBeenCalledTimes(1);
    });

    it('never fetches the leaderboard', async () => {
      // The whole point of embedding the players. The page used to fetch the
      // board purely to join names onto rows it already had.
      resolveWith([match({ id: 'm1' }), match({ id: 'm2' })]);

      render(<MatchesPage />);

      await screen.findAllByTestId('match-card');
      expect(fetchLeaderboard).not.toHaveBeenCalled();
    });

    it('makes no request per row', async () => {
      // Fifty matches is still one call, never one lookup per player.
      resolveWith([
        match({ id: 'm1' }),
        match({ id: 'm2' }),
        match({ id: 'm3' }),
      ]);

      render(<MatchesPage />);

      await screen.findAllByTestId('match-card');
      const calls =
        fetchRecentMatches.mock.calls.length +
        fetchLeaderboard.mock.calls.length;
      expect(calls).toBe(1);
    });
  });

  it('titles the page', async () => {
    resolveWith([match()]);

    render(<MatchesPage />);

    expect(
      await screen.findByRole('heading', { name: /match/i }),
    ).toBeInTheDocument();
  });
});
