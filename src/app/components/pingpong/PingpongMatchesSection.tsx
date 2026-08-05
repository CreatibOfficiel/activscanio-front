'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { MdSportsTennis } from 'react-icons/md';
import { PingpongMatch } from '../../models/Pingpong';
import { getDateLabel } from '../../utils/formatters';
import MatchCard from './MatchCard';
import DateSeparator from '../race/DateSeparator';
import { Button, Skeleton } from '../ui';

interface PingpongMatchesSectionProps {
  matches: PingpongMatch[];
  /** The FIRST page. Owns the skeletons; never true for an append. */
  loading: boolean;
  error: Error | null;
  /** Re-runs the matches request alone. The board is not refetched. */
  onRetry: () => void;
  /**
   * The paging props, optional so the section still type-checks for a caller
   * that has not wired them yet.
   *
   * Defaulted to "there is nothing more", which degrades to exactly the
   * behaviour this component had before it could page: the matches it was
   * handed, no sentinel, no observer. An unwired caller renders a finite
   * list rather than a broken one.
   */
  /** A later page is in flight. Renders under the list, not over it. */
  loadingMore?: boolean;
  /** A later page failed. Distinct from `error`, which is the first page. */
  loadMoreError?: Error | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * The ping-pong match history, below the leaderboard.
 *
 * This used to be its own route, `/pingpong/matches`, which nothing in the
 * app ever linked to — reachable only by typing the URL, so in practice it
 * did not exist. The route is gone and its rendering lives here, where the
 * one screen anyone actually opens can show it.
 *
 * It earns its place most on a cold start. A rank is withheld until eight
 * weighted matches, so the opening weeks of the sport produce a leaderboard
 * that is legitimately empty while matches are being played. A screen whose
 * only content is an empty ranking reads as a feature that is broken; the
 * same screen listing yesterday's matches reads as one that is young. So the
 * section appears from the first recorded match, whether or not the board
 * above it has anyone on it yet.
 *
 * Its loading and error states are its own. The leaderboard is a separate
 * request and must render regardless of what happened to this one.
 *
 * The layout follows /races: grouped under date separators, newest first,
 * skeletons rather than a spinner.
 */
const PingpongMatchesSection: FC<PingpongMatchesSectionProps> = ({
  matches,
  loading,
  error,
  onRetry,
  loadingMore = false,
  loadMoreError = null,
  hasMore = false,
  onLoadMore,
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * Latest props, for the observer callback to read.
   *
   * The callback closes over whatever it was created with. Without this it
   * would fire against a stale `loadingMore` and request the same page
   * twice before React had committed the first.
   */
  const stateRef = useRef({ loadingMore, hasMore, onLoadMore });
  useEffect(() => {
    stateRef.current = { loadingMore, hasMore, onLoadMore };
  }, [loadingMore, hasMore, onLoadMore]);

  /**
   * A CALLBACK ref, and that is the whole trick.
   *
   * This section renders inside a conditionally-rendered tab panel: picking
   * Classement unmounts it entirely, picking Matchs again mounts a brand-new
   * node. React calls this with the new node on every one of those mounts,
   * so the observer is disconnected and re-attached to whatever is actually
   * in the document.
   *
   * The obvious alternative — a `useRef` observed once inside
   * `useEffect(..., [])` — would bind the first mount's node and then never
   * fire again after a tab switch. The history would stop loading at match
   * 20 with no error anywhere, which is the failure this component is most
   * likely to have shipped with.
   */
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const { loadingMore: busy, hasMore: more, onLoadMore: load } =
          stateRef.current;
        if (busy || !more || !load) return;
        load();
      },
      // Fires a screenful early, so the next page is usually there before
      // the reader reaches the bottom.
      { rootMargin: '200px' },
    );
    observerRef.current.observe(node);
  }, []);

  // The panel unmounts on a tab switch; without this the observer outlives
  // the node it was watching.
  useEffect(() => () => observerRef.current?.disconnect(), []);

  // The API sorts newest first; grouping preserves the order it sent rather
  // than re-sorting, so the two cannot disagree.
  const groups = useMemo(() => {
    const ordered: { label: string; matches: PingpongMatch[] }[] = [];
    for (const match of matches) {
      const label = getDateLabel(match.playedAt);
      const last = ordered[ordered.length - 1];
      if (last && last.label === label) last.matches.push(match);
      else ordered.push({ label, matches: [match] });
    }
    return ordered;
  }, [matches]);

  if (loading) {
    return (
      <div data-testid="pingpong-matches-loading" className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="pingpong-matches-error"
        className="mt-8 flex flex-col items-center rounded-xl border border-neutral-700/60 bg-neutral-800/30 px-4 py-8 text-center"
      >
        <MdSportsTennis className="mb-3 text-3xl text-neutral-600" />
        <p className="text-regular mb-4 max-w-sm text-neutral-400">
          Les derniers matchs n&apos;ont pas pu être chargés. Ils sont bien
          enregistrés, seul cet affichage a échoué.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    );
  }

  // Nothing to show and nothing to explain. The board's own empty state
  // already asks for a first match a few pixels above, and an "aucun match"
  // panel underneath it would be the same sentence twice.
  if (matches.length === 0) return null;

  return (
    // No heading of its own. The section used to sit under the board and
    // needed a name; it now lives behind a "Matchs" tab that already names
    // it, and a "Derniers matchs" h2 directly beneath the pressed tab is the
    // same word twice. The page's single-heading rule is guard-tested.
    <section
      data-testid="pingpong-matches"
      aria-label="Derniers matchs"
      className="mt-2"
    >
      {groups.map((group) => (
        <section key={group.label}>
          <DateSeparator label={group.label} count={group.matches.length} />
          <div className="space-y-3">
            {group.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}

      {/* Under the list, never over it. The first-load skeletons replace the
          whole section; this cannot, or every appended page would throw away
          the scroll position the reader just earned. */}
      {loadingMore && (
        <div
          data-testid="pingpong-matches-loading-more"
          className="flex justify-center py-6"
          role="status"
          aria-label="Chargement des matchs précédents"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-primary-500" />
        </div>
      )}

      {/* A failed page must not read as the end of the history. Silence here
          would tell the reader there is nothing older, which is a lie the
          list has no way to correct itself. */}
      {loadMoreError && (
        <div
          data-testid="pingpong-matches-more-error"
          className="flex flex-col items-center py-6 text-center"
        >
          <p className="text-regular mb-3 max-w-sm text-neutral-400">
            Les matchs suivants n&apos;ont pas pu être chargés.
          </p>
          <Button
            variant="secondary"
            onClick={() => onLoadMore?.()}
            data-testid="pingpong-matches-more-retry"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* The sentinel, withdrawn in the two cases where it must not fire:
          at the end of the history, and while a failure is on screen — an
          observer left over a failed page retries it on every scroll tick
          and hammers a server that is already struggling. */}
      {hasMore && !loadMoreError && (
        <div
          ref={sentinelRef}
          data-testid="pingpong-matches-sentinel"
          aria-hidden="true"
          className="h-px"
        />
      )}
    </section>
  );
};

export default PingpongMatchesSection;
