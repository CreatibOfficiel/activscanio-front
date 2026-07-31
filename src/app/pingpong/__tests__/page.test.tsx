import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongPage from '../page';
import { usePingpongLeaderboard } from '../../hooks/usePingpongLeaderboard';
import { useSportPreference } from '../../hooks/useSportPreference';
import { segmentPingpongLeaderboard } from '../../utils/pingpong-leaderboard';
import { PingpongPlayer } from '../../models/Pingpong';

jest.mock('../../hooks/usePingpongLeaderboard');
jest.mock('../../hooks/useSportPreference');

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
 * The sport switcher only exists for someone who follows both sports — a
 * control offering one choice conveys nothing.
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
      previousWeekRank: null,
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

  beforeEach(() => {
    jest.clearAllMocks();
    givenPreference(false);
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

  describe('the sport switcher', () => {
    it('is absent for someone who follows one sport', async () => {
      // A control with one option conveys nothing.
      givenPreference(false);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() => expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1));
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('is present for someone who follows both', async () => {
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByRole('radiogroup')).toBeInTheDocument(),
      );
    });

    it('crosses to the Mario Kart board when the other sport is picked', async () => {
      // The two boards are separate routes, so switching is navigation.
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);
      await waitFor(() =>
        expect(screen.getByRole('radiogroup')).toBeInTheDocument(),
      );

      await userEvent.click(
        screen.getByRole('radio', { name: /mario kart/i }),
      );

      expect(push).toHaveBeenCalledWith('/');
    });

    it('shows ping-pong as the active sport', async () => {
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByRole('radio', { name: /ping-pong/i })).toBeChecked(),
      );
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
});
