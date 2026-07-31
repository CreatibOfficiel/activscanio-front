import { act, renderHook, waitFor } from '@testing-library/react';
import { usePingpongLeaderboard } from '../usePingpongLeaderboard';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import { PingpongPlayer } from '../../models/Pingpong';

jest.mock('../../repositories/PingpongRepository', () => ({
  pingpongRepository: {
    fetchLeaderboard: jest.fn(),
  },
}));

const fetchLeaderboard = pingpongRepository.fetchLeaderboard as jest.Mock;

/**
 * Loading and grouping the ping-pong leaderboard.
 *
 * The grouping itself lives in `segmentPingpongLeaderboard` and is tested
 * there; this hook owns the fetch. The cases worth pinning are the failure
 * ones — a board that spins forever after a failed request is worse than one
 * that says it could not load, because there is nothing the user can do
 * about a spinner.
 */
describe('usePingpongLeaderboard', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches once on mount', async () => {
    fetchLeaderboard.mockResolvedValue([]);

    renderHook(() => usePingpongLeaderboard());

    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledTimes(1));
  });

  it('exposes the players it loaded', async () => {
    fetchLeaderboard.mockResolvedValue([player({ id: 'a' }), player({ id: 'b', rank: 2 })]);

    const { result } = renderHook(() => usePingpongLeaderboard());

    await waitFor(() => expect(result.current.players).toHaveLength(2));
  });

  it('groups them through the shared segmentation', async () => {
    // Delegated rather than re-derived, so the screen and the util cannot
    // disagree about who counts as calibrating.
    fetchLeaderboard.mockResolvedValue([
      player({ id: 'ranked', rank: 1 }),
      player({ id: 'new', rank: null, provisional: true }),
    ]);

    const { result } = renderHook(() => usePingpongLeaderboard());

    await waitFor(() => {
      expect(result.current.segmentation.ranked.map((p) => p.id)).toEqual([
        'ranked',
      ]);
      expect(result.current.segmentation.calibrating.map((p) => p.id)).toEqual([
        'new',
      ]);
    });
  });

  it('stops loading once the request settles', async () => {
    fetchLeaderboard.mockResolvedValue([]);

    const { result } = renderHook(() => usePingpongLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  describe('when the request fails', () => {
    it('stops loading rather than spinning forever', async () => {
      // A permanent spinner gives the user nothing to act on.
      fetchLeaderboard.mockRejectedValue(new Error('offline'));

      const { result } = renderHook(() => usePingpongLeaderboard());

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('reports the error', async () => {
      fetchLeaderboard.mockRejectedValue(new Error('offline'));

      const { result } = renderHook(() => usePingpongLeaderboard());

      await waitFor(() => expect(result.current.error).toBeTruthy());
    });

    it('leaves the board empty rather than half-populated', async () => {
      fetchLeaderboard.mockRejectedValue(new Error('offline'));

      const { result } = renderHook(() => usePingpongLeaderboard());

      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(result.current.players).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('fetches again', async () => {
      fetchLeaderboard.mockResolvedValue([]);
      const { result } = renderHook(() => usePingpongLeaderboard());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.refresh();
      });

      expect(fetchLeaderboard).toHaveBeenCalledTimes(2);
    });

    it('clears a previous error on success', async () => {
      // Otherwise the board shows fresh data under a stale error message.
      fetchLeaderboard.mockRejectedValueOnce(new Error('offline'));
      const { result } = renderHook(() => usePingpongLeaderboard());
      await waitFor(() => expect(result.current.error).toBeTruthy());

      fetchLeaderboard.mockResolvedValue([player()]);
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.players).toHaveLength(1);
    });
  });

  it('does not refetch on re-render', async () => {
    fetchLeaderboard.mockResolvedValue([]);
    const { rerender, result } = renderHook(() => usePingpongLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender();
    rerender();

    expect(fetchLeaderboard).toHaveBeenCalledTimes(1);
  });
});
