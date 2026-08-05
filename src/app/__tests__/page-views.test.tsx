import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import { AppContext } from '../context/AppContext';

/**
 * The Mario Kart board's Classement / Courses selector.
 *
 * The nav collapsed to one tab per sport, so the race history that used to be
 * its own bottom-nav tab is now a panel on this page — the same shape the
 * ping-pong board already had.
 *
 * The board itself is expensive to render (a four-phase ranking animation,
 * motion/react, Clerk-gated fetches, a modal per row), and its internals are
 * guarded at the source level by `page-wiring.test.ts` for exactly that
 * reason. What is under test HERE is only the panel switching, so both panels'
 * contents are stubbed: this file asserts which panel is showing, not what is
 * inside it. `RaceHistory` has its own suite.
 */

jest.mock('../hooks/useRankingAnimation', () => ({
  useRankingAnimation: () => ({
    animationPhase: 'idle',
    displayOrder: [],
    showUniformCards: false,
    changedIds: new Set(),
    onTransitionComplete: jest.fn(),
  }),
}));

jest.mock('../hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  }),
}));

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: false, getToken: jest.fn() }),
}));

jest.mock('../components/leaderboard/RankingAnimationOverlay', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../components/leaderboard', () => ({
  ElevatedPodium: () => <div data-testid="podium" />,
  LeaderboardRow: () => <div data-testid="leaderboard-row" />,
  LeagueDivider: () => <div />,
}));

jest.mock('../components/race/RaceHistory', () => ({
  __esModule: true,
  default: () => <div data-testid="race-history" />,
}));

jest.mock('../context/AddActivitySlotContext', () => ({
  AddActivitySlot: () => <div data-testid="add-activity-slot" />,
}));

/**
 * A client per render, with retries off.
 *
 * `Home` reads its competitors through React Query now, so rendering it
 * without a provider throws before a single tab is asserted on. Retries are
 * disabled because a failing query would otherwise be retried on a timer and
 * outlive the test.
 */
function renderBoard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
    <AppContext.Provider
      value={
        {
          isLoading: false,
          allCompetitors: [],
          refreshCompetitors: jest.fn(),
        } as unknown as React.ContextType<typeof AppContext>
      }
    >
      <Home />
    </AppContext.Provider>
    </QueryClientProvider>,
  );
}

describe('Home — Mario Kart view selector', () => {
  it('offers Classement and Courses as a real tablist', () => {
    renderBoard();

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /classement/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /courses/i })).toBeInTheDocument();
  });

  it('opens on the ranking, not the history', () => {
    // The board is the app's home screen and the thing people open it for.
    // Defaulting to the history would change what `/` means.
    renderBoard();

    expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByTestId('race-history')).not.toBeInTheDocument();
  });

  it('shows the race history once Courses is picked', () => {
    renderBoard();

    return userEvent
      .click(screen.getByRole('tab', { name: /courses/i }))
      .then(() => {
        expect(screen.getByTestId('race-history')).toBeInTheDocument();
      });
  });

  it('hides the ranking while the history is showing', async () => {
    // A panel swap, not an append. Leaving the board above a 474-race list
    // would make the tab read as a filter that did nothing.
    //
    // Asserted on the ranking panel itself rather than on the podium: with
    // no competitors the podium does not render anyway, so a podium query
    // here passes whether the panels swap or stack. Verified by mutation —
    // forcing both panels open left a podium assertion green.
    renderBoard();
    const rankingPanelId = screen
      .getByRole('tab', { name: /classement/i })
      .getAttribute('aria-controls')!;
    expect(document.getElementById(rankingPanelId)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));

    expect(document.getElementById(rankingPanelId)).not.toBeInTheDocument();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('comes back to the ranking', async () => {
    renderBoard();
    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));
    await userEvent.click(screen.getByRole('tab', { name: /classement/i }));

    expect(screen.queryByTestId('race-history')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('gives each panel the id its tab points at', async () => {
    // Without the pairing a screen reader cannot associate the panel with the
    // tab that governs it, which is most of what the tablist role buys.
    renderBoard();

    const rankingTab = screen.getByRole('tab', { name: /classement/i });
    const rankingPanel = screen.getByRole('tabpanel');
    expect(rankingPanel).toHaveAttribute(
      'id',
      rankingTab.getAttribute('aria-controls'),
    );
    expect(rankingPanel).toHaveAttribute('aria-labelledby', rankingTab.id);

    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));
    const racesTab = screen.getByRole('tab', { name: /courses/i });
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      racesTab.getAttribute('aria-controls'),
    );
  });

  it('namespaces its panel ids away from the ping-pong board', () => {
    // Both boards have a view called 'ranking'. A shared id namespace would
    // put duplicate ids in the document if the two ever render together.
    renderBoard();

    expect(
      screen.getByRole('tab', { name: /classement/i }),
    ).toHaveAttribute('aria-controls', 'mariokart-panel-ranking');
  });
});
