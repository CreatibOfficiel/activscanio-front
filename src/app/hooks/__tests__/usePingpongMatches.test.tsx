import { act, renderHook, waitFor } from '@testing-library/react';
import { usePingpongMatches, MATCH_PAGE_SIZE } from '../usePingpongMatches';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import { PingpongMatch, PingpongMatchesPage } from '../../models/Pingpong';

jest.mock('../../repositories/PingpongRepository', () => ({
  pingpongRepository: {
    fetchMatchesPage: jest.fn(),
  },
}));

const fetchMatchesPage = pingpongRepository.fetchMatchesPage as jest.Mock;

/**
 * Paging the ping-pong match history.
 *
 * The history used to be one request capped at fifty, which was fine only
 * while fifty was more matches than existed. It is a cursor-paged list now,
 * and the cases worth pinning are the ones that fail silently rather than
 * loudly: a page that appends the rows it already had, a scroll that never
 * stops asking, and a failed page that looks exactly like the end of the
 * list. None of those three throws anything.
 */
describe('usePingpongMatches', () => {
  function match(id: string): PingpongMatch {
    return {
      id,
      playerAId: 'p1',
      playerBId: 'p2',
      playerA: null,
      playerB: null,
      winnerId: 'p1',
      sets: [],
      playedAt: '2026-03-14T12:00:00Z',
    } as unknown as PingpongMatch;
  }

  /** A page envelope, shaped as the API sends it. */
  function page(
    matches: PingpongMatch[],
    nextCursor: string | null = null,
  ): PingpongMatchesPage {
    return {
      data: matches,
      meta: {
        hasMore: nextCursor !== null,
        nextCursor,
        limit: MATCH_PAGE_SIZE,
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('the first page', () => {
    it('renders the matches it loaded', async () => {
      fetchMatchesPage.mockResolvedValue(page([match('m1'), match('m2')]));

      const { result } = renderHook(() => usePingpongMatches());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.matches.map((m) => m.id)).toEqual(['m1', 'm2']);
    });

    it('asks for the first page without a cursor', async () => {
      fetchMatchesPage.mockResolvedValue(page([match('m1')]));

      const { result } = renderHook(() => usePingpongMatches());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchMatchesPage).toHaveBeenCalledWith(undefined, MATCH_PAGE_SIZE);
    });

    it('reports more to come when the server sent a cursor', async () => {
      fetchMatchesPage.mockResolvedValue(page([match('m1')], 'cur-1'));

      const { result } = renderHook(() => usePingpongMatches());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('loading the next page', () => {
    it('appends the next page without repeating the first', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1'), match('m2')], 'cur-1'))
        .mockResolvedValueOnce(page([match('m3'), match('m4')]));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => expect(result.current.loadingMore).toBe(false));
      expect(result.current.matches.map((m) => m.id)).toEqual([
        'm1',
        'm2',
        'm3',
        'm4',
      ]);
    });

    /**
     * The duplicate guard, stated as an invariant rather than as a list.
     * An offset that failed to advance would still produce four rows above;
     * it would just produce the same two twice.
     */
    it('never shows the same match twice', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1'), match('m2')], 'cur-1'))
        .mockResolvedValueOnce(page([match('m3'), match('m4')]));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });
      await waitFor(() => expect(result.current.loadingMore).toBe(false));

      const ids = result.current.matches.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('sends the cursor the previous page returned', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockResolvedValueOnce(page([match('m2')]));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => expect(result.current.loadingMore).toBe(false));
      expect(fetchMatchesPage).toHaveBeenLastCalledWith(
        'cur-1',
        MATCH_PAGE_SIZE,
      );
    });

    /**
     * The next page must be distinguishable from the first. A shared flag
     * would swap the whole list for a skeleton on every append, which throws
     * away the scroll position the reader just earned.
     */
    it('flags a page load separately from the initial load', async () => {
      let release: (value: PingpongMatchesPage) => void = () => {};
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockReturnValueOnce(
          new Promise<PingpongMatchesPage>((resolve) => {
            release = resolve;
          }),
        );

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => expect(result.current.loadingMore).toBe(true));
      // The list is still there — it was not replaced by a skeleton.
      expect(result.current.loading).toBe(false);
      expect(result.current.matches).toHaveLength(1);

      await act(async () => {
        release(page([match('m2')]));
      });
    });
  });

  describe('reaching the end', () => {
    /**
     * The infinite-loop guard. A sentinel sitting in the viewport fires
     * repeatedly; if `hasMore` never goes false the hook requests forever.
     */
    it('stops asking once the server reports no more', async () => {
      fetchMatchesPage.mockResolvedValue(page([match('m1')]));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasMore).toBe(false);

      await act(async () => {
        result.current.loadMore();
        result.current.loadMore();
      });

      expect(fetchMatchesPage).toHaveBeenCalledTimes(1);
    });

    it('ignores a second loadMore while one is already in flight', async () => {
      let release: (value: PingpongMatchesPage) => void = () => {};
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockReturnValueOnce(
          new Promise<PingpongMatchesPage>((resolve) => {
            release = resolve;
          }),
        );

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.loadMore();
        result.current.loadMore();
        result.current.loadMore();
      });

      await waitFor(() => expect(result.current.loadingMore).toBe(true));
      // Two calls total: the first page, and one in-flight next page.
      expect(fetchMatchesPage).toHaveBeenCalledTimes(2);

      await act(async () => {
        release(page([match('m2')]));
      });
    });
  });

  describe('when a page fails', () => {
    /**
     * The defect `useInfiniteRaces` still carries: it catches a failed page
     * into `console.error` and exposes no error flag, so a 500 renders as a
     * list that quietly stopped. The reader is told the history ended when
     * it did not. This hook must say so instead.
     */
    it('surfaces an error rather than looking like the end of the list', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockRejectedValueOnce(new Error('500'));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => expect(result.current.loadingMore).toBe(false));
      expect(result.current.loadMoreError).not.toBeNull();
      // Still more to come — the failure is not an ending.
      expect(result.current.hasMore).toBe(true);
    });

    it('keeps the rows it already had when a later page fails', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockRejectedValueOnce(new Error('500'));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => expect(result.current.loadingMore).toBe(false));
      expect(result.current.matches.map((m) => m.id)).toEqual(['m1']);
    });

    it('retries the same cursor after a failure', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValueOnce(page([match('m2')]));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });
      await waitFor(() => expect(result.current.loadMoreError).not.toBeNull());

      await act(async () => {
        result.current.loadMore();
      });
      await waitFor(() => expect(result.current.loadingMore).toBe(false));

      expect(fetchMatchesPage).toHaveBeenLastCalledWith(
        'cur-1',
        MATCH_PAGE_SIZE,
      );
      expect(result.current.matches.map((m) => m.id)).toEqual(['m1', 'm2']);
      expect(result.current.loadMoreError).toBeNull();
    });

    it('reports a failed FIRST page as the existing error, not a page error', async () => {
      fetchMatchesPage.mockRejectedValue(new Error('500'));

      const { result } = renderHook(() => usePingpongMatches());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).not.toBeNull();
      expect(result.current.matches).toEqual([]);
    });
  });

  describe('empty history', () => {
    it('reports no matches and nothing more to load', async () => {
      fetchMatchesPage.mockResolvedValue(page([]));

      const { result } = renderHook(() => usePingpongMatches());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.matches).toEqual([]);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('refresh', () => {
    it('starts over from the first page', async () => {
      fetchMatchesPage
        .mockResolvedValueOnce(page([match('m1')], 'cur-1'))
        .mockResolvedValueOnce(page([match('m2')]))
        .mockResolvedValueOnce(page([match('m9')], 'cur-9'));

      const { result } = renderHook(() => usePingpongMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.loadMore();
      });
      await waitFor(() => expect(result.current.loadingMore).toBe(false));

      await act(async () => {
        result.current.refresh();
      });
      await waitFor(() => expect(result.current.loading).toBe(false));

      // The accumulated pages are gone, not appended to.
      expect(result.current.matches.map((m) => m.id)).toEqual(['m9']);
      expect(fetchMatchesPage).toHaveBeenLastCalledWith(
        undefined,
        MATCH_PAGE_SIZE,
      );
    });
  });
});
