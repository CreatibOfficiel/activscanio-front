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

/**
 * Stubbed, but NOT down to a bare div any more.
 *
 * The board owns the Courses panel's heading and countdown now, so a stub that
 * swallowed `showCountdown` would let the board pass it either way. The stub
 * reports what it was told instead, which is the only prop this file cares
 * about.
 */
jest.mock('../components/race/RaceHistory', () => ({
  __esModule: true,
  default: ({ showCountdown }: { showCountdown?: boolean }) => (
    <div data-testid="race-history" data-show-countdown={String(showCountdown)} />
  ),
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

/**
 * The heading follows the selection.
 *
 * The bug this pins: the board used to title itself "Classement des pilotes"
 * ABOVE the selector, with the competitor counts and the season countdown
 * under it. Pick Courses and all three stayed on screen, so the reader got a
 * ranking's title, a ranking's counts and a ranking's deadline sitting over a
 * race history. The title described a panel that was no longer rendered.
 *
 * Each panel owns its heading now and there is nothing above the tabs. Every
 * assertion here is about absence as much as presence — a heading that merely
 * APPEARS on the right tab would pass just as well if the old one were still
 * stacked above it.
 */
describe('Home — heading follows the selected panel', () => {
  const rankingTitle = /classement des pilotes/i;

  it('titles the page with the ranking while the ranking is showing', () => {
    renderBoard();

    expect(
      screen.getByRole('heading', { level: 1, name: rankingTitle }),
    ).toBeInTheDocument();
  });

  it('drops the ranking title, its counts and its countdown on Courses', async () => {
    // The whole defect in one test. The counts line is queried by its exact
    // text rather than by a testid, so it cannot be satisfied by an element
    // that merely changed its label. Anchored, because the ranking panel's
    // empty state also says "Ajouter une course" and a loose /pilote/ matches
    // both.
    renderBoard();
    expect(screen.getByText(/^0 pilote$/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));

    expect(
      screen.queryByRole('heading', { name: rankingTitle }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^0 pilote$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/en calibrage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fin de saison/i)).not.toBeInTheDocument();
  });

  it('titles the page with the history once Courses is picked', async () => {
    // Level 1, not 2. Nothing above the tabs names the page any more, so a
    // subordinate heading here would leave the document topless.
    renderBoard();
    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));

    expect(
      screen.getByRole('heading', { level: 1, name: /^courses$/i }),
    ).toBeInTheDocument();
  });

  it('restores the ranking title on the way back', async () => {
    renderBoard();
    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));
    await userEvent.click(screen.getByRole('tab', { name: /classement/i }));

    expect(
      screen.getByRole('heading', { level: 1, name: rankingTitle }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /^courses$/i }),
    ).not.toBeInTheDocument();
  });

  it('carries exactly one h1 on either tab', async () => {
    // Two h1s is the failure the old architecture shipped: the page title
    // above the tabs plus whatever the panel added.
    renderBoard();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows the season countdown on the ranking and nowhere else', async () => {
    // The countdown belongs to the ranking: it is the deadline for the board,
    // not for the list of races already run. It used to sit above the tabs,
    // which is why `/` passed `showCountdown={false}` to RaceHistory.
    renderBoard();
    expect(screen.getAllByText(/fin de saison/i)).toHaveLength(1);

    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));
    expect(screen.queryByText(/fin de saison/i)).not.toBeInTheDocument();
  });

  it('still suppresses the history panel\'s own countdown', async () => {
    // `showCountdown={false}` survives the move. The countdown left the top of
    // the page for the ranking panel, so the history has no sibling copy to
    // clash with any more — but it is still the ranking's fact, and letting
    // RaceHistory render one here would put a season deadline over a list that
    // does not answer to it. `/races` standalone leaves the flag unset and
    // keeps its own.
    renderBoard();
    await userEvent.click(screen.getByRole('tab', { name: /courses/i }));

    expect(screen.getByTestId('race-history')).toHaveAttribute(
      'data-show-countdown',
      'false',
    );
  });
});
