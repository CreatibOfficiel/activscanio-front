import { render, screen } from '@testing-library/react';
import PingpongMatchesSection from '../PingpongMatchesSection';
import { PingpongMatch } from '../../../models/Pingpong';

/**
 * The match history panel and its infinite scroll.
 *
 * The section is presentational — the paging lives in `usePingpongMatches`
 * and is tested there. What belongs here is the wiring the hook cannot see:
 * that a sentinel exists while more remain, that it is observed, that it
 * disappears at the end of the list, and that a failed page says so instead
 * of looking like the end.
 *
 * The sentinel is the thing most likely to break silently, because this
 * section lives inside a conditionally-rendered tab panel. Switching to
 * Classement unmounts it; switching back mounts a brand-new node. It
 * survives because it is a CALLBACK ref rather than a `useRef` read inside
 * a `useEffect` — React invokes the callback with the new node on every
 * remount, so the observer re-attaches to whatever is currently in the
 * document. The `useEffect(..., [])` shape this could easily have been
 * written as would bind the first mount's node and never fire again after a
 * tab switch: a history that stops loading at match 20 with no error
 * anywhere. There is a test for exactly that below.
 */
describe('PingpongMatchesSection', () => {
  function match(id: string, playedAt = '2026-03-14T12:00:00Z'): PingpongMatch {
    return {
      id,
      playerAId: 'p1',
      playerBId: 'p2',
      playerA: {
        id: 'p1',
        competitorId: 'c1',
        firstName: 'Marc',
        lastName: 'Dupont',
        profilePictureUrl: '',
      },
      playerB: {
        id: 'p2',
        competitorId: 'c2',
        firstName: 'Léa',
        lastName: 'Bernard',
        profilePictureUrl: '',
      },
      winnerId: 'p1',
      sets: [
        { a: 11, b: 7 },
        { a: 11, b: 9 },
      ],
      setsA: 2,
      setsB: 0,
      playedAt,
    } as unknown as PingpongMatch;
  }

  const baseProps = {
    matches: [match('m1')],
    loading: false,
    error: null as Error | null,
    onRetry: jest.fn(),
    loadingMore: false,
    loadMoreError: null as Error | null,
    hasMore: false,
    onLoadMore: jest.fn(),
  };

  function renderSection(overrides: Partial<typeof baseProps> = {}) {
    return render(<PingpongMatchesSection {...baseProps} {...overrides} />);
  }

  /**
   * jsdom ships no IntersectionObserver, so the sentinel's callback ref
   * would throw on any test that renders one. This inert default keeps the
   * rendering tests honest; the tests that care about observation install
   * their own recording version over the top.
   */
  beforeEach(() => {
    global.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    })) as unknown as typeof IntersectionObserver;
  });

  /** Swaps in an observer that records what it was given. */
  function captureObserver() {
    const observed: Element[] = [];
    const disconnect = jest.fn();
    const original = global.IntersectionObserver;

    global.IntersectionObserver = jest.fn(
      (callback: IntersectionObserverCallback) => ({
        observe: (el: Element) => observed.push(el),
        disconnect,
        unobserve: jest.fn(),
        // Exposed so a test can drive an intersection by hand.
        trigger: () =>
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
          ),
      }),
    ) as unknown as typeof IntersectionObserver;

    return {
      observed,
      disconnect,
      restore: () => {
        global.IntersectionObserver = original;
      },
    };
  }

  describe('the list itself', () => {
    it('renders the matches it was given', () => {
      renderSection({ matches: [match('m1'), match('m2')] });

      expect(screen.getAllByTestId('match-card')).toHaveLength(2);
    });

    it('shows skeletons on the first load, not the list', () => {
      renderSection({ loading: true, matches: [] });

      expect(screen.getByTestId('pingpong-matches-loading')).toBeInTheDocument();
    });

    /**
     * The empty state. Deliberately renders nothing — the board's own empty
     * state a few pixels above already asks for a first match, and a second
     * "aucun match" panel underneath it is the same sentence twice.
     */
    it('renders nothing at all when there are no matches', () => {
      const { container } = renderSection({ matches: [], hasMore: false });

      expect(container).toBeEmptyDOMElement();
    });

    it('still shows the error state when the first page failed', () => {
      renderSection({ error: new Error('500'), matches: [] });

      expect(screen.getByTestId('pingpong-matches-error')).toBeInTheDocument();
    });
  });

  describe('the sentinel', () => {
    it('renders a sentinel while more matches remain', () => {
      renderSection({ hasMore: true });

      expect(screen.getByTestId('pingpong-matches-sentinel')).toBeInTheDocument();
    });

    /**
     * The infinite-loop guard's visible half. At the end of the list there
     * must be nothing left for an observer to sit on.
     */
    it('drops the sentinel once the history is exhausted', () => {
      renderSection({ hasMore: false });

      expect(
        screen.queryByTestId('pingpong-matches-sentinel'),
      ).not.toBeInTheDocument();
    });

    it('observes the sentinel', () => {
      const observer = captureObserver();

      renderSection({ hasMore: true });

      expect(observer.observed).toHaveLength(1);
      expect(observer.observed[0]).toHaveAttribute(
        'data-testid',
        'pingpong-matches-sentinel',
      );

      observer.restore();
    });

    /**
     * Exactly what a tab switch does to this panel. If the observer bound
     * only to the first mount's node, the second mount would scroll forever
     * without ever loading a page.
     */
    it('re-observes a fresh sentinel after unmount and remount', () => {
      const observer = captureObserver();

      const first = renderSection({ hasMore: true });
      const firstNode = observer.observed[0];
      first.unmount();

      renderSection({ hasMore: true });
      const secondNode = observer.observed[1];

      expect(observer.observed).toHaveLength(2);
      expect(secondNode).toBeDefined();
      expect(secondNode).not.toBe(firstNode);

      observer.restore();
    });

    it('asks for the next page when the sentinel comes into view', () => {
      const onLoadMore = jest.fn();
      const instances: { trigger: () => void }[] = [];
      const original = global.IntersectionObserver;
      global.IntersectionObserver = jest.fn(
        (callback: IntersectionObserverCallback) => {
          const instance = {
            observe: jest.fn(),
            disconnect: jest.fn(),
            unobserve: jest.fn(),
            trigger: () =>
              callback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
              ),
          };
          instances.push(instance);
          return instance;
        },
      ) as unknown as typeof IntersectionObserver;

      renderSection({ hasMore: true, onLoadMore });
      instances[0].trigger();

      expect(onLoadMore).toHaveBeenCalled();

      global.IntersectionObserver = original;
    });

    it('does not ask again while a page is already loading', () => {
      const onLoadMore = jest.fn();
      const instances: { trigger: () => void }[] = [];
      const original = global.IntersectionObserver;
      global.IntersectionObserver = jest.fn(
        (callback: IntersectionObserverCallback) => {
          const instance = {
            observe: jest.fn(),
            disconnect: jest.fn(),
            unobserve: jest.fn(),
            trigger: () =>
              callback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
              ),
          };
          instances.push(instance);
          return instance;
        },
      ) as unknown as typeof IntersectionObserver;

      renderSection({ hasMore: true, loadingMore: true, onLoadMore });
      instances[0].trigger();

      expect(onLoadMore).not.toHaveBeenCalled();

      global.IntersectionObserver = original;
    });
  });

  describe('loading the next page', () => {
    /**
     * The append must not look like a fresh load. Replacing the list with
     * the first-load skeletons would throw away the scroll position the
     * reader worked to reach.
     */
    it('shows a spinner at the bottom, keeping the list on screen', () => {
      renderSection({
        matches: [match('m1'), match('m2')],
        hasMore: true,
        loadingMore: true,
      });

      expect(
        screen.getByTestId('pingpong-matches-loading-more'),
      ).toBeInTheDocument();
      expect(screen.getAllByTestId('match-card')).toHaveLength(2);
      expect(
        screen.queryByTestId('pingpong-matches-loading'),
      ).not.toBeInTheDocument();
    });
  });

  describe('when a page fails', () => {
    /**
     * The defect this feature must not reproduce: a failed page that renders
     * as a list which simply stopped. The reader is told the history ended
     * when it did not.
     */
    it('says the page failed rather than silently ending the list', () => {
      renderSection({
        matches: [match('m1')],
        hasMore: true,
        loadMoreError: new Error('500'),
      });

      expect(
        screen.getByTestId('pingpong-matches-more-error'),
      ).toBeInTheDocument();
      // The rows already loaded stay put.
      expect(screen.getAllByTestId('match-card')).toHaveLength(1);
    });

    it('offers a retry that asks for the same page again', () => {
      const onLoadMore = jest.fn();
      renderSection({
        matches: [match('m1')],
        hasMore: true,
        loadMoreError: new Error('500'),
        onLoadMore,
      });

      screen.getByTestId('pingpong-matches-more-retry').click();

      expect(onLoadMore).toHaveBeenCalled();
    });

    /**
     * While the failure is on screen the sentinel must go, or the observer
     * retries the failing request on every scroll tick and hammers a server
     * that is already unhappy.
     */
    it('withdraws the sentinel while the failure is showing', () => {
      renderSection({
        matches: [match('m1')],
        hasMore: true,
        loadMoreError: new Error('500'),
      });

      expect(
        screen.queryByTestId('pingpong-matches-sentinel'),
      ).not.toBeInTheDocument();
    });
  });
});
