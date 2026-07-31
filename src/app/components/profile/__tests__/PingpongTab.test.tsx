import { render, screen, waitFor } from '@testing-library/react';
import PingpongTab from '../PingpongTab';
import { pingpongRepository } from '../../../repositories/PingpongRepository';
import { PingpongMatch, PingpongPlayer } from '../../../models/Pingpong';

jest.mock('../../../repositories/PingpongRepository', () => ({
  pingpongRepository: {
    fetchPlayer: jest.fn(),
    fetchPlayerMatches: jest.fn(),
    fetchLeaderboard: jest.fn(),
  },
}));

const mockedRepo = pingpongRepository as jest.Mocked<typeof pingpongRepository>;

/**
 * The ping-pong section of a player's profile.
 *
 * Three things shape it.
 *
 * A rating means nothing as a bare number, so the word that explains it sits
 * beside it in the layout. NN/g is explicit that information vital to the
 * task must not live in a tooltip — a tooltip is unreachable on touch and
 * invisible to anyone scanning.
 *
 * A player who has never played is a NORMAL state, not a failure.
 * `fetchPlayer` returns null for them by design, and the screen answers with
 * an invitation to record a first match. A crash, an error panel or a blank
 * box would each read as the app being broken.
 *
 * A calibrating player is shown progress, never a rank. The API withholds
 * the rank on purpose; inventing a provisional one and then moving it would
 * be worse than saying "3 matchs sur 8".
 */
describe('PingpongTab', () => {
  function player(overrides: Partial<PingpongPlayer> = {}): PingpongPlayer {
    return {
      id: 'me',
      competitorId: 'c-me',
      firstName: 'Thibaud',
      lastName: 'Carron',
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
      rank: 3,
      ...overrides,
    };
  }

  const marc = player({
    id: 'marc',
    competitorId: 'c-marc',
    firstName: 'Marc',
    lastName: 'Dupont',
  });

  function match(
    id: string,
    aId: string,
    bId: string,
    winnerId: string,
  ): PingpongMatch {
    return {
      id,
      playerAId: aId,
      playerBId: bId,
      winnerId,
      sets: [
        { a: 11, b: 9 },
        { a: 11, b: 7 },
      ],
      playedAt: '2026-03-10T12:00:00Z',
      appliedWeight: 1,
      ratingFrozen: false,
      ratingABefore: 1500,
      ratingAAfter: 1510,
      ratingBBefore: 1500,
      ratingBAfter: 1490,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRepo.fetchPlayer.mockResolvedValue(player());
    mockedRepo.fetchPlayerMatches.mockResolvedValue([]);
    mockedRepo.fetchLeaderboard.mockResolvedValue([player(), marc]);
  });

  it('fetches the player by competitor id', async () => {
    // The profile knows a `competitorId`; the ping-pong player id is a
    // different string, and the API resolves one to the other.
    render(<PingpongTab competitorId="c-me" />);

    await waitFor(() =>
      expect(mockedRepo.fetchPlayer).toHaveBeenCalledWith('c-me'),
    );
  });

  describe('rating', () => {
    it('shows the rating with its word label beside it', async () => {
      render(<PingpongTab competitorId="c-me" />);

      const rating = await screen.findByTestId('pingpong-tab-rating');
      expect(rating).toHaveTextContent('1480');
      // The word is IN the element, not in a title attribute.
      expect(rating).toHaveTextContent(/elo/i);
    });

    it('does not hide the word label in a tooltip', async () => {
      // NN/g: information vital to the task must not require a hover. This
      // asserts the label is real text, reachable on a touch screen.
      render(<PingpongTab competitorId="c-me" />);

      const rating = await screen.findByTestId('pingpong-tab-rating');
      expect(rating).not.toHaveAttribute('title');
      expect(rating.textContent).toMatch(/elo/i);
    });
  });

  describe('record and streaks', () => {
    it('shows the win/loss record', async () => {
      mockedRepo.fetchPlayer.mockResolvedValue(player({ wins: 12, losses: 8 }));

      render(<PingpongTab competitorId="c-me" />);

      const record = await screen.findByTestId('pingpong-tab-record');
      expect(record).toHaveTextContent('12');
      expect(record).toHaveTextContent('8');
    });

    it('shows the current and best streak', async () => {
      mockedRepo.fetchPlayer.mockResolvedValue(
        player({ currentStreak: 3, bestStreak: 6 }),
      );

      render(<PingpongTab competitorId="c-me" />);

      expect(await screen.findByTestId('pingpong-tab-streak')).toHaveTextContent(
        '3',
      );
      expect(screen.getByTestId('pingpong-tab-best-streak')).toHaveTextContent(
        '6',
      );
    });
  });

  describe('calibration', () => {
    it('shows progress instead of a rank while calibrating', async () => {
      // The API withholds the rank on purpose. Showing "8 matchs sur 8"
      // worth of progress is a fact; a provisional rank that later moves is
      // a promise the board does not keep.
      mockedRepo.fetchPlayer.mockResolvedValue(
        player({ rank: null, provisional: true, weightedMatchCount: 3 }),
      );

      render(<PingpongTab competitorId="c-me" />);

      const progress = await screen.findByTestId('pingpong-tab-calibration');
      expect(progress).toHaveTextContent('3');
      expect(progress).toHaveTextContent('8');
      expect(screen.queryByTestId('pingpong-tab-rank')).not.toBeInTheDocument();
    });

    it('shows the rank and no calibration bar once settled', async () => {
      mockedRepo.fetchPlayer.mockResolvedValue(
        player({ rank: 3, provisional: false }),
      );

      render(<PingpongTab competitorId="c-me" />);

      expect(await screen.findByTestId('pingpong-tab-rank')).toHaveTextContent(
        '3',
      );
      expect(
        screen.queryByTestId('pingpong-tab-calibration'),
      ).not.toBeInTheDocument();
    });

    it('rounds the weighted count it displays', async () => {
      // `weightedMatchCount` is a sum of weights, not a count — a repeat
      // match counts for less. "2.6/8 matchs" reads as a bug.
      mockedRepo.fetchPlayer.mockResolvedValue(
        player({ rank: null, provisional: true, weightedMatchCount: 2.6 }),
      );

      render(<PingpongTab competitorId="c-me" />);

      const progress = await screen.findByTestId('pingpong-tab-calibration');
      expect(progress).toHaveTextContent('3/8');
      expect(progress).not.toHaveTextContent('2.6');
    });
  });

  describe('never played', () => {
    it('invites a first match when the player does not exist yet', async () => {
      // `fetchPlayer` resolving null is a normal state: this competitor has
      // simply never picked up a bat.
      mockedRepo.fetchPlayer.mockResolvedValue(null);

      render(<PingpongTab competitorId="c-me" />);

      expect(
        await screen.findByTestId('pingpong-tab-never-played'),
      ).toBeInTheDocument();
    });

    it('does not show an error when the player does not exist yet', async () => {
      mockedRepo.fetchPlayer.mockResolvedValue(null);

      render(<PingpongTab competitorId="c-me" />);

      await screen.findByTestId('pingpong-tab-never-played');
      expect(screen.queryByTestId('pingpong-tab-error')).not.toBeInTheDocument();
    });

    it('stops loading when the player does not exist yet', async () => {
      // A spinner that never resolves is the failure this guards against.
      mockedRepo.fetchPlayer.mockResolvedValue(null);

      render(<PingpongTab competitorId="c-me" />);

      await screen.findByTestId('pingpong-tab-never-played');
      expect(
        screen.queryByTestId('pingpong-tab-loading'),
      ).not.toBeInTheDocument();
    });

    it('links to the match entry screen', async () => {
      mockedRepo.fetchPlayer.mockResolvedValue(null);

      render(<PingpongTab competitorId="c-me" />);

      const invite = await screen.findByTestId('pingpong-tab-never-played');
      expect(invite.querySelector('a')).toHaveAttribute('href', '/pingpong/add');
    });
  });

  describe('failure', () => {
    it('shows an error state when the fetch fails', async () => {
      // A thrown fetch is a real failure and must not be confused with the
      // null case above, which is somebody who has not played.
      mockedRepo.fetchPlayer.mockRejectedValue(new Error('network down'));

      render(<PingpongTab competitorId="c-me" />);

      expect(
        await screen.findByTestId('pingpong-tab-error'),
      ).toBeInTheDocument();
    });

    it('stops spinning when the fetch fails', async () => {
      mockedRepo.fetchPlayer.mockRejectedValue(new Error('network down'));

      render(<PingpongTab competitorId="c-me" />);

      await screen.findByTestId('pingpong-tab-error');
      expect(
        screen.queryByTestId('pingpong-tab-loading'),
      ).not.toBeInTheDocument();
    });

    it('does not offer a first match when the fetch failed', async () => {
      // Telling someone who has 40 matches to "record a first match"
      // because the network blinked would be a lie on screen.
      mockedRepo.fetchPlayer.mockRejectedValue(new Error('network down'));

      render(<PingpongTab competitorId="c-me" />);

      await screen.findByTestId('pingpong-tab-error');
      expect(
        screen.queryByTestId('pingpong-tab-never-played'),
      ).not.toBeInTheDocument();
    });
  });

  describe('head-to-head', () => {
    it('renders the rivalry section with the matches played', async () => {
      mockedRepo.fetchPlayerMatches.mockResolvedValue([
        match('m1', 'me', 'marc', 'me'),
        match('m2', 'me', 'marc', 'marc'),
        match('m3', 'me', 'marc', 'me'),
      ]);

      render(<PingpongTab competitorId="c-me" />);

      const row = await screen.findByTestId('h2h-row-marc');
      expect(row).toBeInTheDocument();
      expect(row).toHaveTextContent('2');
      expect(row).toHaveTextContent('1');
    });

    it('still renders the stats when the match list fails', async () => {
      // The rivalry list is secondary. Losing it must not take the rating
      // and record down with it.
      mockedRepo.fetchPlayerMatches.mockRejectedValue(new Error('nope'));

      render(<PingpongTab competitorId="c-me" />);

      expect(
        await screen.findByTestId('pingpong-tab-rating'),
      ).toHaveTextContent('1480');
    });
  });
});
