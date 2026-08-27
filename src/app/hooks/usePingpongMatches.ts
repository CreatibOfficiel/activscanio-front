'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PingpongMatch } from '../models/Pingpong';
import {
  PingpongMatchFilters,
  pingpongRepository,
} from '../repositories/PingpongRepository';

/**
 * How many matches arrive per page.
 *
 * This replaced a `MATCH_LIMIT` of 50 that WAS the whole history: one
 * request, no second page, and a hard stop at fifty matches whether or not a
 * fifty-first existed. That was tolerable only while the office had played
 * fewer than fifty games. It was never a preview limit and this is not one
 * either — the history now runs back to the first match ever recorded,
 * twenty rows at a time.
 *
 * Twenty rather than fifty because a page is cheap to ask for again. The
 * first screen paints sooner, and a reader who stops after ten rows paid for
 * twenty instead of fifty.
 */
export const MATCH_PAGE_SIZE = 20;

/**
 * Loads the ping-pong match history, one page at a time.
 *
 * Separate from `usePingpongLeaderboard` on purpose. The two answer different
 * questions from different endpoints, and the leaderboard must survive a
 * matches failure — a screen that drops its ranking because the history
 * 500'd has turned one broken panel into two.
 *
 * Cursor-paged, not offset-paged. Matches get recorded from a phone beside
 * the table while someone else has the history open, so rows appear at the
 * top mid-scroll. An offset window shifts by one every time that happens and
 * the reader sees a match twice or misses it entirely. A cursor names a
 * position in the ordering instead, so an insert above it is invisible to
 * every page below.
 *
 * The cursor is opaque here. It is the server's `playedAt|id` keyset
 * position, and the only correct thing to do with it is hand back the last
 * one received.
 *
 * Three loading states, not two, and the third is the point. `loading` is the
 * first page and owns the skeletons; `loadingMore` is an append and must
 * never replace the list, or every page swaps the reader's scroll position
 * for a skeleton. `loadMoreError` is a page that failed — it exists because
 * the alternative, the shape `useInfiniteRaces` still carries, catches a
 * failed page into `console.error` and exposes nothing, which renders a 500
 * as a list that quietly stopped and tells the reader the history ended when
 * it did not.
 */
export function usePingpongMatches(filters: PingpongMatchFilters = {}) {
  const [matches, setMatches] = useState<PingpongMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  /**
   * Mirrors of the paging state, read by `loadMore`.
   *
   * The IntersectionObserver that drives this fires faster than React
   * commits. Reading `loadingMore` from state there would let several
   * intersections through on the same stale `false` and fire duplicate
   * requests for one cursor; a ref is written synchronously, so the second
   * call sees what the first just did.
   */
  const loadingMoreRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  /** Discards a page that resolves after a refresh already replaced the list. */
  const generationRef = useRef(0);

  // Callers pass an object literal, so a new identity arrives on every
  // render — depend on the values, or `load` changes every render and the
  // effect below refetches forever.
  const { playerId, period } = filters;

  const load = useCallback(async () => {
    const generation = ++generationRef.current;

    setLoading(true);
    // A refresh starts over rather than appending, so the accumulated pages
    // and the cursor pointing past them go too.
    cursorRef.current = null;
    hasMoreRef.current = false;
    setLoadMoreError(null);

    try {
      const page = await pingpongRepository.fetchMatchesPage(
        undefined,
        MATCH_PAGE_SIZE,
        { playerId, period },
      );
      if (generationRef.current !== generation) return;

      setMatches(page.data);
      cursorRef.current = page.meta.nextCursor;
      hasMoreRef.current = page.meta.hasMore;
      setHasMore(page.meta.hasMore);
      // Clear a previous failure, or a successful retry would render fresh
      // matches underneath a stale error.
      setError(null);
    } catch (caught) {
      if (generationRef.current !== generation) return;
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      setMatches([]);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      // Always, so a failure stops the skeletons. A permanent loading state
      // gives nobody anything to act on.
      if (generationRef.current === generation) setLoading(false);
    }
    // A filter change starts the history over from page one. The generation
    // counter already guards the in-flight page, so a request from the
    // previous filter cannot land on top of the new list.
  }, [playerId, period]);

  const loadMore = useCallback(() => {
    // Three ways this gets asked for something it must not do: past the end,
    // while a page is already in flight, or before the first page handed us
    // a cursor. Without the first of them a sentinel resting in the viewport
    // requests forever.
    if (!hasMoreRef.current || loadingMoreRef.current || !cursorRef.current) {
      return;
    }

    const generation = generationRef.current;
    const requested = cursorRef.current;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    void pingpongRepository
      .fetchMatchesPage(requested, MATCH_PAGE_SIZE, { playerId, period })
      .then((page) => {
        if (generationRef.current !== generation) return;

        setMatches((previous) => [...previous, ...page.data]);
        cursorRef.current = page.meta.nextCursor;
        hasMoreRef.current = page.meta.hasMore;
        setHasMore(page.meta.hasMore);
      })
      .catch((caught: unknown) => {
        if (generationRef.current !== generation) return;
        // Surfaced, not logged. The cursor and `hasMore` are left untouched
        // so the same page can be retried — a failed page is not an ending.
        setLoadMoreError(
          caught instanceof Error ? caught : new Error(String(caught)),
        );
      })
      .finally(() => {
        loadingMoreRef.current = false;
        if (generationRef.current === generation) setLoadingMore(false);
      });
    // The cursor belongs to the current filter set, so the next page has to
    // be requested under the same one.
  }, [playerId, period]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    matches,
    loading,
    error,
    loadingMore,
    loadMoreError,
    hasMore,
    loadMore,
    refresh: load,
  };
}
