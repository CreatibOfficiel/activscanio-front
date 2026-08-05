import { render, screen } from '@testing-library/react';
import RaceHistory from '../RaceHistory';
import { AppContext } from '../../../context/AppContext';
import { useInfiniteRaces } from '../../../hooks/useInfiniteRaces';
import { RaceEvent } from '../../../models/RaceEvent';

jest.mock('../../../hooks/useInfiniteRaces');
jest.mock('../../../utils/authenticated-fetch', () => ({
  authenticatedFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ total: 0, weekly: 0, mostActive: null }),
  }),
}));

jest.mock('../RaceCard', () => ({
  __esModule: true,
  default: () => <div data-testid="race-card" />,
}));

const mockedRaces = useInfiniteRaces as jest.MockedFunction<
  typeof useInfiniteRaces
>;

/**
 * The race history, extracted from `/races` so two entry points can share it.
 *
 * The Mario Kart board now carries the same ranking/history selector the
 * ping-pong board has, which means the history has to render inside a tab
 * panel on `/` as well as standing alone on `/races`. Duplicating it would
 * mean 474 races' worth of filtering and infinite scroll maintained twice, so
 * the page became a thin wrapper around this component.
 *
 * The extraction was mechanical: the page held no route state of its own — no
 * params, no useSearchParams, no scroll restoration — just local filter state,
 * `useInfiniteRaces`, and a header-stats fetch. All three moved as they were.
 *
 * What it does NOT own is the add control. `/races` gated it on `total > 0`
 * and so does the board, but the two mount it in different places now, so the
 * decision stays with whoever renders this.
 */
describe('RaceHistory', () => {
  function race(id: string): RaceEvent {
    return {
      id,
      date: '2026-07-30T10:00:00Z',
      participants: [],
    } as unknown as RaceEvent;
  }

  function givenRaces(
    races: RaceEvent[],
    overrides: Partial<ReturnType<typeof useInfiniteRaces>> = {},
  ) {
    mockedRaces.mockReturnValue({
      races,
      total: races.length,
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      loadMore: jest.fn(),
      ...overrides,
    } as unknown as ReturnType<typeof useInfiniteRaces>);
  }

  function renderHistory(
    context: { isLoading?: boolean; allCompetitors?: unknown[] } = {},
  ) {
    return render(
      <AppContext.Provider
        value={
          {
            isLoading: false,
            allCompetitors: [],
            ...context,
          } as unknown as React.ContextType<typeof AppContext>
        }
      >
        <RaceHistory />
      </AppContext.Provider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a card per race', () => {
    givenRaces([race('r1'), race('r2'), race('r3')]);

    renderHistory();

    expect(screen.getAllByTestId('race-card')).toHaveLength(3);
  });

  it('offers the period filters', () => {
    givenRaces([race('r1')]);

    renderHistory();

    // The filter strip moved with the list; asserted on its real options
    // rather than a wrapper, so a filter dropped in the move is caught.
    // Queried as buttons: "Cette semaine" is also a date-separator label, so
    // a bare text query matches the list itself and would pass without any
    // filters at all.
    expect(
      screen.getByRole('button', { name: 'Cette semaine' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cette saison' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tout' })).toBeInTheDocument();
  });

  it('shows the empty state when nothing has been recorded', () => {
    givenRaces([], { total: 0 });

    renderHistory();

    expect(screen.getByText(/prêt pour la course/i)).toBeInTheDocument();
  });

  it('shows a skeleton while loading rather than an empty state', () => {
    // The two are easy to confuse and reading "no races yet" during a load
    // tells a user with 474 races that their history is gone.
    givenRaces([], { total: 0, isLoading: true });

    renderHistory();

    expect(screen.queryByText(/prêt pour la course/i)).not.toBeInTheDocument();
  });

  /**
   * The cards used to sit behind `AppContext.isLoading`, which stays true
   * until the slowest of three parallel requests answers — competitors,
   * recent races, base characters. This component uses exactly one of them
   * (`allCompetitors`, to fill the player dropdown) and gets its cards from
   * `useInfiniteRaces`, so two of those three requests were holding up a list
   * that does not depend on them.
   *
   * These are the tests that fail if the context is put back in the way. The
   * rest of the suite passes either way, because it renders with the context
   * already settled.
   */
  describe('while the app context is still loading', () => {
    it('renders the race cards without waiting for it', () => {
      givenRaces([race('r1'), race('r2')]);

      renderHistory({ isLoading: true, allCompetitors: [] });

      expect(screen.getAllByTestId('race-card')).toHaveLength(2);
    });

    it('marks the player filter as loading rather than as having no players', () => {
      // An empty dropdown and a not-yet-loaded dropdown are the same thing
      // from inside the filter and opposite things to a reader: one says this
      // league has nobody in it.
      givenRaces([race('r1')]);

      renderHistory({ isLoading: true, allCompetitors: [] });

      const filter = screen.getByRole('button', { name: /chargement/i });
      expect(filter).toBeDisabled();
    });

    it('offers the filter normally once the competitors arrive', () => {
      givenRaces([race('r1')]);

      renderHistory({ isLoading: false, allCompetitors: [] });

      const filter = screen.getByRole('button', { name: /filtrer par joueur/i });
      expect(filter).toBeEnabled();
    });

    it('still shows the skeleton while the races themselves load', () => {
      // Dropping the context from the gate must not drop the gate. The race
      // load is the one that genuinely has nothing to draw yet.
      givenRaces([], { total: 0, isLoading: true });

      renderHistory({ isLoading: false, allCompetitors: [] });

      expect(screen.queryByText(/prêt pour la course/i)).not.toBeInTheDocument();
      expect(screen.queryAllByTestId('race-card')).toHaveLength(0);
    });
  });

  describe('infinite scroll', () => {
    /**
     * The sentinel is the thing most likely to break silently in this move,
     * because on the board it now lives inside a conditionally-rendered tab
     * panel: switching to the ranking unmounts it, switching back mounts a
     * brand-new node.
     *
     * Remounting alone turns out NOT to distinguish the two possible
     * implementations — a `useEffect` with an empty dep array re-runs on a
     * fresh mount too, so it re-observes just fine. Verified by mutation:
     * swapping the callback ref for that shape kept every test below green.
     * The remount case is still worth pinning because it is the tab switch,
     * but it is not what the callback ref buys.
     *
     * What it buys is re-binding WITHOUT a remount, which the last test here
     * covers. `loadMore` and `hasMore` are captured in the observer's
     * closure, so when they change the observer has to be rebuilt or it keeps
     * calling a stale `loadMore` and paging stops at race 20 — no error, no
     * crash, just a list that quietly stops growing.
     */
    it('observes the sentinel while more races remain', () => {
      const observe = jest.fn();
      const original = global.IntersectionObserver;
      global.IntersectionObserver = jest.fn(() => ({
        observe,
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      })) as unknown as typeof IntersectionObserver;

      givenRaces([race('r1')], { hasMore: true });
      renderHistory();

      expect(observe).toHaveBeenCalled();

      global.IntersectionObserver = original;
    });

    it('re-observes a fresh sentinel after being unmounted and remounted', () => {
      // Exactly what a tab switch does. If the observer bound to the first
      // node only, the second mount would scroll forever without loading.
      const observed: Element[] = [];
      const original = global.IntersectionObserver;
      global.IntersectionObserver = jest.fn(() => ({
        observe: (el: Element) => observed.push(el),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      })) as unknown as typeof IntersectionObserver;

      givenRaces([race('r1')], { hasMore: true });
      const first = renderHistory();
      const firstNode = observed[0];
      first.unmount();

      renderHistory();
      const secondNode = observed[observed.length - 1];

      expect(observed.length).toBeGreaterThan(1);
      expect(secondNode).not.toBe(firstNode);
      expect(secondNode.isConnected).toBe(true);

      global.IntersectionObserver = original;
    });

    it('rebuilds the observer when loadMore changes identity', () => {
      // The real reason the sentinel is a callback ref. `loadMore` lives in
      // the observer's closure, so a stale one means the sentinel scrolls
      // into view, fires, and calls a function bound to the previous page —
      // paging stops with nothing to see in the console.
      //
      // A `useEffect(..., [])` sentinel passes every other test in this
      // block and fails this one, which is what makes it the guard worth
      // having.
      const original = global.IntersectionObserver;
      const constructed: Array<() => void> = [];
      global.IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
        constructed.push(() =>
          cb(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
          ),
        );
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn(),
        };
      }) as unknown as typeof IntersectionObserver;

      const firstLoadMore = jest.fn();
      givenRaces([race('r1')], { hasMore: true, loadMore: firstLoadMore });
      const { rerender } = renderHistory();

      const secondLoadMore = jest.fn();
      givenRaces([race('r1')], { hasMore: true, loadMore: secondLoadMore });
      rerender(
        <AppContext.Provider
          value={
            {
              isLoading: false,
              allCompetitors: [],
            } as unknown as React.ContextType<typeof AppContext>
          }
        >
          <RaceHistory />
        </AppContext.Provider>,
      );

      // Fire the most recently constructed observer.
      constructed[constructed.length - 1]();

      expect(secondLoadMore).toHaveBeenCalled();
      expect(firstLoadMore).not.toHaveBeenCalled();

      global.IntersectionObserver = original;
    });
  });
});
