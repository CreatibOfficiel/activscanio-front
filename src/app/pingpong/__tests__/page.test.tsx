import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongPage from '../page';
import { usePingpongLeaderboard } from '../../hooks/usePingpongLeaderboard';
import { useSportPreference } from '../../hooks/useSportPreference';
import {
  AddActivitySlotProvider,
  useAddActivitySlotTarget,
} from '../../context/AddActivitySlotContext';
import { segmentPingpongLeaderboard } from '../../utils/pingpong-leaderboard';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import {
  PingpongMatch,
  PingpongMatchPlayer,
  PingpongPlayer,
} from '../../models/Pingpong';

jest.mock('../../hooks/usePingpongLeaderboard');
jest.mock('../../hooks/useSportPreference');
// The detail sheet is `PingpongTab`, which fetches for itself. Its requests
// are stubbed here so the sheet renders rather than sitting on a skeleton;
// what it does with them is PingpongTab's own suite's business.
jest.mock('../../repositories/PingpongRepository', () => ({
  __esModule: true,
  pingpongRepository: {
    fetchRecentMatches: jest.fn(),
    fetchMatchesPage: jest.fn(),
    fetchPlayer: jest.fn(),
    fetchPlayerMatches: jest.fn(),
    fetchLeaderboard: jest.fn(),
    fetchBestWin: jest.fn(),
  },
}));

/**
 * The history pages now, so the hook calls `fetchMatchesPage` rather than
 * `fetchRecentMatches`. The name is kept because every assertion below reads
 * "the matches request", which is still exactly what this is.
 */
const fetchRecentMatches = pingpongRepository.fetchMatchesPage as jest.Mock;
const fetchPlayer = pingpongRepository.fetchPlayer as jest.Mock;
const fetchPlayerMatches = pingpongRepository.fetchPlayerMatches as jest.Mock;
const fetchLeaderboard = pingpongRepository.fetchLeaderboard as jest.Mock;
const fetchBestWin = pingpongRepository.fetchBestWin as jest.Mock;

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
 * Crossing to the Mario Kart board is the bottom nav's job, not this page's.
 * The sport switcher that used to sit here looked like a filter and behaved
 * like navigation; see the block below for why it went.
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

  function matchPlayer(
    overrides: Partial<PingpongMatchPlayer> = {},
  ): PingpongMatchPlayer {
    return {
      id: 'p1',
      competitorId: 'c1',
      firstName: 'Marc',
      lastName: 'Dupont',
      profilePictureUrl: '',
      ...overrides,
    };
  }

  function match(overrides: Partial<PingpongMatch> = {}): PingpongMatch {
    return {
      id: 'm1',
      playerAId: 'p1',
      playerBId: 'p2',
      playerA: matchPlayer({ id: 'p1', firstName: 'Marc', lastName: 'Dupont' }),
      playerB: matchPlayer({ id: 'p2', firstName: 'Léa', lastName: 'Bernard' }),
      winnerId: 'p1',
      sets: [
        { a: 11, b: 7 },
        { a: 11, b: 9 },
      ],
      playedAt: '2026-03-14T12:00:00Z',
      appliedWeight: 1,
      ratingFrozen: false,
      ratingABefore: 1608,
      ratingAAfter: 1620,
      ratingBBefore: 1540,
      ratingBAfter: 1532,
      ...overrides,
    };
  }

  /**
   * One page of history, as the paginated endpoint sends it. These tests
   * only ever assert on the first page, so `hasMore` is false — the paging
   * itself belongs to the hook's own suite.
   */
  function givenMatches(matches: PingpongMatch[]) {
    fetchRecentMatches.mockResolvedValue({
      data: matches,
      meta: { hasMore: false, nextCursor: null, limit: 20 },
    });
  }

  const observe = jest.fn();
  let intersect: () => void = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom ships no IntersectionObserver. The paging sentinel builds one, so
    // without this stub the section throws instead of wiring itself up.
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      class {
        constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
          // Kept so a test can drive the sentinel into view. Reading
          // `onLoadMore` only happens then, not at construction — a test that
          // stops at "an observer was built" misses a dropped callback.
          intersect = () => cb([{ isIntersecting: true }]);
        }
        observe = observe;
        unobserve = jest.fn();
        disconnect = jest.fn();
      };
    givenPreference(false);
    // The default for the tests that predate the matches section: they assert
    // on the board alone and must not trip over an unmocked request.
    givenMatches([]);
    // Same for the detail sheet's own requests. Resolved rather than left
    // pending so a sheet that opens actually renders.
    fetchPlayer.mockResolvedValue(null);
    fetchPlayerMatches.mockResolvedValue([]);
    fetchLeaderboard.mockResolvedValue([]);
    fetchBestWin.mockResolvedValue(null);
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
    //
    // The matches panel deliberately carries no <h2> of its own either: the
    // tab that opened it already names it, and a heading repeating the tab
    // label is the same word twice.
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

  /**
   * The sport switcher used to live here, and no longer does.
   *
   * These tests previously asserted it appeared for a `followsBoth` user and
   * called router.push('/') when Mario Kart was picked. They now assert the
   * opposite, because that control was the bug the user reported.
   *
   * It was a segmented radiogroup — the shape of an in-page filter — whose
   * only behaviour was to navigate to a different route. Two failures
   * compounded: nothing on screen predicted that tapping it would leave the
   * page, and `/` is the app home, arriving with a season countdown, streak
   * banners and a ranking animation. Worse, `/` renders no switcher of its
   * own, so the "filter" only ever went one way — a filter you cannot undo
   * from the other side is not a filter.
   *
   * The bottom nav already offers both boards as explicit tabs, to everyone,
   * regardless of preference. Keeping a second control that looks unlike the
   * first and does the same thing is worse than having only the first.
   */
  describe('crossing to the Mario Kart board', () => {
    it('offers no radiogroup, whatever sports the user follows', async () => {
      // Both preferences, since the old control was gated on followsBoth.
      for (const followsBoth of [false, true]) {
        givenPreference(followsBoth);
        givenBoard([player()]);

        const { unmount } = render(<PingpongPage />);

        await waitFor(() =>
          expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
        );
        expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

        unmount();
      }
    });

    it('pushes no route however the user pokes at it', async () => {
      // The heart of the report: a tap that silently teleported. Clicking
      // every control the page renders must leave the router untouched, so
      // nothing here can move the user without a visible link saying so.
      //
      // `tab` is in the sweep because the page grew a tablist after this
      // test was written, and a role the sweep does not name is a role this
      // guard silently stops covering — it would have gone on passing by
      // omission while the one new control on the page went unchecked.
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
      );

      for (const control of [
        ...screen.queryAllByRole('button'),
        ...screen.queryAllByRole('radio'),
        ...screen.queryAllByRole('tab'),
      ]) {
        await userEvent.click(control);
      }

      expect(push).not.toHaveBeenCalled();
    });

    it('swaps the panel rather than navigating when Matchs is picked', async () => {
      // The positive half of the sweep above. "Nothing was clicked" would
      // satisfy it too, so this pins that the tab genuinely does something —
      // and that the something is local.
      givenPreference(true);
      givenBoard([player()]);
      givenMatches([match()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
      );

      await userEvent.click(screen.getByRole('tab', { name: /matchs/i }));

      expect(await screen.findByTestId('match-card')).toBeInTheDocument();
      expect(screen.queryAllByTestId('pingpong-row')).toHaveLength(0);
      expect(push).not.toHaveBeenCalled();
    });

    it('offers no control naming the other sport', async () => {
      // Whatever remains on this page, nothing advertises Mario Kart in a
      // way a user could tap expecting a filter. Queried by accessible name
      // across every role rather than by role: the old control's buttons
      // carried role="radio", so a button-role query missed them entirely.
      givenPreference(true);
      givenBoard([player()]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
      );
      expect(screen.queryByText(/mario kart/i)).not.toBeInTheDocument();
    });

    it('leaves every interactive control on the page a plain link', async () => {
      // The positive half of the rule: what stays must look like what it
      // does. The empty-state CTA is a link to /pingpong/add, and a link
      // that navigates is exactly what a user predicts.
      //
      // Still zero buttons after the tablist arrived, because the tab bar is
      // gated on `!isEmpty` — the same condition as the add button. With
      // nobody on the board a "Matchs" tab leads to a blank panel, which
      // reads as broken; that gate is what keeps this assertion true, and
      // removing it would break this test rather than slip past it.
      givenPreference(true);
      givenBoard([]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByTestId('pingpong-empty')).toBeInTheDocument(),
      );

      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.getByRole('link', { name: /match/i })).toHaveAttribute(
        'href',
        '/pingpong/add',
      );
    });
  });

  /**
   * The add control's gate.
   *
   * The gate is unchanged — `showsBoard`, the same condition as the tab bar —
   * but the control no longer renders into the page. It portals into the
   * bottom bar's centre slot, so these render inside the slot provider with a
   * stand-in target; without one the portal has nowhere to go and every
   * assertion below would pass for the wrong reason.
   *
   * That the button lands in the bar rather than on the page is BottomNav's
   * suite's business. What is under test here is only whether this page asks
   * for it, and when.
   */
  describe('the add button', () => {
    function renderWithBar(ui: React.ReactElement) {
      return render(<AddActivitySlotProvider>{ui}<NavSlotStub /></AddActivitySlotProvider>);
    }

    it('is offered once someone is on the board', async () => {
      givenBoard([player()]);

      renderWithBar(<PingpongPage />);

      expect(await screen.findByTestId('add-activity')).toBeInTheDocument();
    });

    it('is absent on an empty board', () => {
      // The empty state carries its own call to action a few pixels away.
      // Two prompts to do the same thing on one screen is one too many.
      givenBoard([]);

      renderWithBar(<PingpongPage />);

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });

    it('is absent while loading', () => {
      givenBoard([], { loading: true });

      renderWithBar(<PingpongPage />);

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });

    it('shares its gate with the tab bar', async () => {
      // Both are gated on `!isEmpty`, and the tab bar's reason is its own:
      // with nobody on the board a "Matchs" tab opens a blank panel, which
      // reads as broken rather than as empty. Pinned directly rather than
      // left to the "every control is a link" guard, which would catch it
      // only as a side effect of counting buttons.
      givenBoard([]);

      render(<PingpongPage />);

      await screen.findByTestId('pingpong-empty');
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('is absent when the board failed to load', () => {
      // Offering to add a match under an error message reads as if the
      // error had nothing to do with the app.
      givenBoard([], { error: new Error('offline') });

      render(<PingpongPage />);

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
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

  /**
   * The podium, finally wired up.
   *
   * `segmentPingpongLeaderboard` has returned `podium` and `rest` since it
   * was written, with a `minPodiumSize` of 3, and the page never read either
   * — it flattened every tier into one list and the podium half was dead
   * code. The count states below are the segmentation's, not a second
   * opinion held here.
   */
  describe('the podium', () => {
    it('lifts the top three out of the list', async () => {
      givenBoard([
        player({ id: 'a', firstName: 'Marc', rank: 1 }),
        player({ id: 'b', firstName: 'Julie', rank: 2 }),
        player({ id: 'c', firstName: 'Sam', rank: 3 }),
        player({ id: 'd', firstName: 'Léa', rank: 4 }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
      );
      // The list picks up at rank 4 rather than repeating the podium.
      const rows = screen.getAllByTestId('pingpong-row');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent('Léa');
    });

    it('shows no podium below three ranked players', async () => {
      // A carousel of two is a pedestal. The segmentation already decides
      // this; the page just renders what it is handed.
      givenBoard([
        player({ id: 'a', rank: 1 }),
        player({ id: 'b', rank: 2 }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2),
      );
      expect(
        screen.queryByTestId('pingpong-podium-card'),
      ).not.toBeInTheDocument();
    });

    it('keeps the unranked in the list when there is a podium', async () => {
      // Everyone the API returned still appears somewhere. Someone who
      // cannot find themselves assumes the app forgot them.
      givenBoard([
        player({ id: 'a', rank: 1 }),
        player({ id: 'b', rank: 2 }),
        player({ id: 'c', rank: 3 }),
        player({ id: 'd', firstName: 'Nina', rank: null, provisional: true }),
        player({ id: 'e', firstName: 'Théo', rank: null, inactive: true }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2),
      );
      const rows = screen.getAllByTestId('pingpong-row');
      expect(rows[0]).toHaveTextContent('Nina');
      expect(rows[1]).toHaveTextContent('Théo');
    });

    it('shows no podium when nobody is ranked at all', async () => {
      // The realistic first week: everyone calibrating, nobody ranked. It
      // must not look broken, so the list says why there are no numbers.
      givenBoard([
        player({ id: 'a', rank: null, provisional: true }),
        player({ id: 'b', rank: null, provisional: true }),
        player({ id: 'c', rank: null, provisional: true }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(3),
      );
      expect(
        screen.queryByTestId('pingpong-podium-card'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('pingpong-nobody-ranked')).toHaveTextContent(
        /8 matchs/i,
      );
    });

    it('says nothing about calibration once someone is ranked', async () => {
      givenBoard([
        player({ id: 'a', rank: 1 }),
        player({ id: 'b', rank: null, provisional: true }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2),
      );
      expect(
        screen.queryByTestId('pingpong-nobody-ranked'),
      ).not.toBeInTheDocument();
    });
  });

  /**
   * The detail sheet, opened from either surface.
   *
   * One `selectedPlayer` on the page rather than a modal per row. The Mario
   * Kart board does it per row and pays an O(rows × races) `useMemo` plus
   * four requests per row for the privilege; copying that onto a 25-row
   * board would fire a hundred requests to render a list nobody has tapped.
   */
  describe('the detail sheet', () => {
    it('is closed until something is tapped', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);

      render(<PingpongPage />);

      await screen.findAllByTestId('pingpong-row');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens on the player whose row was tapped', async () => {
      givenBoard([
        player({ id: 'a', firstName: 'Marc', rank: 1 }),
        player({ id: 'b', firstName: 'Julie', rank: 2 }),
      ]);

      render(<PingpongPage />);

      const rows = await screen.findAllByTestId('pingpong-row');
      await userEvent.click(rows[1]);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent('Julie');
      expect(dialog).not.toHaveTextContent('Marc');
    });

    it('opens on the player whose podium card was tapped', async () => {
      // Card 3, not card 1: an index bug reporting the first player always
      // would pass against card 1.
      givenBoard([
        player({ id: 'a', firstName: 'Marc', rank: 1 }),
        player({ id: 'b', firstName: 'Julie', rank: 2 }),
        player({ id: 'c', firstName: 'Sam', rank: 3 }),
      ]);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('pingpong-podium-card');
      await userEvent.click(cards[2]);

      expect(await screen.findByRole('dialog')).toHaveTextContent('Sam');
    });

    it('drives one sheet from both surfaces', async () => {
      // The state lives on the page, so opening from a row and then from a
      // card swaps the sheet's subject rather than stacking a second dialog.
      givenBoard([
        player({ id: 'a', firstName: 'Marc', rank: 1 }),
        player({ id: 'b', firstName: 'Julie', rank: 2 }),
        player({ id: 'c', firstName: 'Sam', rank: 3 }),
        player({ id: 'd', firstName: 'Léa', rank: 4 }),
      ]);

      render(<PingpongPage />);

      const rows = await screen.findAllByTestId('pingpong-row');
      await userEvent.click(rows[0]);
      expect(await screen.findByRole('dialog')).toHaveTextContent('Léa');

      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );

      const cards = screen.getAllByTestId('pingpong-podium-card');
      await userEvent.click(cards[1]);

      const dialogs = await screen.findAllByRole('dialog');
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0]).toHaveTextContent('Julie');
    });

    it('closes again', async () => {
      givenBoard([player({ id: 'a', firstName: 'Marc', rank: 1 })]);

      render(<PingpongPage />);

      const rows = await screen.findAllByTestId('pingpong-row');
      await userEvent.click(rows[0]);
      await screen.findByRole('dialog');

      await userEvent.click(
        screen.getByRole('button', { name: /fermer/i }),
      );

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('addresses the reader as a visitor, not as the player', async () => {
      // The sheet is `PingpongTab`, written for someone reading their own
      // profile. "ton rang" about a colleague is a sentence about the wrong
      // person.
      //
      // The player has to be calibrating and `fetchPlayer` has to return
      // them: the second-person copy this pins lives in the calibration
      // note, and the default stub resolves null, which renders the
      // never-played branch instead. Asserting on copy that cannot appear is
      // a test that passes whatever the page does — an earlier draft of this
      // one did exactly that and survived flipping the prop to 'self'.
      const marc = player({
        id: 'a',
        firstName: 'Marc',
        rank: null,
        provisional: true,
        weightedMatchCount: 3,
      });
      givenBoard([marc]);
      fetchPlayer.mockResolvedValue(marc);

      render(<PingpongPage />);

      const rows = await screen.findAllByTestId('pingpong-row');
      await userEvent.click(rows[0]);

      const dialog = await screen.findByRole('dialog');
      // The note itself is there — otherwise the assertions below pass on an
      // empty sheet.
      const note = await within(dialog).findByTestId(
        'pingpong-tab-calibration',
      );
      // Asserted on the note's own container, not on the dialog, and without
      // a \b anchor. `toHaveTextContent` collapses the tree into one string,
      // so the preceding "3/8 matchs" runs straight into "Ton rang" and
      // /\bton rang/ matches nothing — an earlier draft anchored that way
      // and passed with the prop flipped to 'self'.
      expect(note.parentElement?.parentElement).not.toHaveTextContent(
        /ton rang/i,
      );
      expect(dialog).not.toHaveTextContent(/tes stats/i);
    });

    it('does not offer to record a match on someone else’s sheet', async () => {
      // The other half of the perspective. The CTA belongs to whoever owns
      // the profile; on a colleague it invites the reader to record a match
      // that is not theirs.
      givenBoard([player({ id: 'a', firstName: 'Marc', rank: 1 })]);
      fetchPlayer.mockResolvedValue(null);

      render(<PingpongPage />);

      const rows = await screen.findAllByTestId('pingpong-row');
      await userEvent.click(rows[0]);

      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByTestId('pingpong-tab-never-played');
      expect(
        within(dialog).queryByRole('link', { name: /enregistrer un match/i }),
      ).not.toBeInTheDocument();
    });

    it('does not push a route when a row is tapped', async () => {
      // A sheet, not navigation — the distinction this page was fixed for.
      givenBoard([player({ id: 'a', rank: 1 })]);

      render(<PingpongPage />);

      const rows = await screen.findAllByTestId('pingpong-row');
      await userEvent.click(rows[0]);

      await screen.findByRole('dialog');
      expect(push).not.toHaveBeenCalled();
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

  /**
   * The match history, which now lives here and nowhere else.
   *
   * `/pingpong/matches` was a fully-built page nothing linked to — no `Link`
   * anywhere in the tree pointed at it, so it was reachable only by typing
   * the URL. It has been deleted and its rendering folded into this page.
   *
   * The section matters most on a cold start. Ping-pong launched with zero
   * matches and zero players, and calibration withholds a rank until eight
   * weighted matches, so the first eight matches produce a leaderboard that
   * is still empty. A screen whose only content is an empty ranking reads as
   * a broken feature; the same screen showing yesterday's matches reads as a
   * feature nobody has got round to yet. Hence: matches appear from the first
   * one recorded, whether or not anybody is ranked.
   */
  describe('the matches section', () => {
    /**
     * The page must hand the hook's paging state down, not just its first
     * page. Every one of those props is optional on the section — that was
     * deliberate, so the file could compile before the page was wired — which
     * means nothing else here would notice if the wiring were dropped and the
     * history silently stopped at page one. Hence a test on the wiring
     * itself rather than on the rendered list.
     */
    it('hands the section a way to ask for the next page', async () => {
      fetchRecentMatches.mockResolvedValue({
        data: [match()],
        meta: { hasMore: true, nextCursor: '2026-01-01T00:00:00Z|abc', limit: 20 },
      });
      givenBoard([player()]);
      render(<PingpongPage />);

      await userEvent.click(
        await screen.findByRole('tab', { name: /matchs/i }),
      );

      // The section only builds an observer when it was handed BOTH
      // `hasMore` and `onLoadMore`. Watching the constructor is the direct
      // evidence of wiring; the rendered list looks identical either way,
      // which is exactly why dropping a prop went unnoticed.
      await waitFor(() => expect(observe).toHaveBeenCalled());

      // Scrolling the sentinel into view is what reads `onLoadMore`. Without
      // it the section builds an observer that can never call anything, and
      // the history silently stops at page one.
      act(() => intersect());
      await waitFor(() =>
        expect(fetchRecentMatches).toHaveBeenCalledTimes(2),
      );
    });

    /**
     * The history sits behind a tab now rather than under the board.
     *
     * Both requests still fire on load, in parallel, exactly as before — the
     * tab swaps a rendered panel, it does not gate a fetch. What changed is
     * that a test wanting a match card has to open the panel holding it.
     */
    async function openMatches() {
      await userEvent.click(screen.getByRole('tab', { name: /matchs/i }));
    }

    it('stays hidden until its tab is picked', async () => {
      // A tab that reveals something already on screen is decoration. The
      // panel must genuinely be absent on the ranking tab — asserting only
      // that it APPEARS after a click would pass just as well if both
      // panels were rendered the whole time.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');

      expect(screen.queryByTestId('pingpong-matches')).not.toBeInTheDocument();
      expect(screen.queryByTestId('match-card')).not.toBeInTheDocument();

      await openMatches();
      expect(await screen.findByTestId('match-card')).toBeInTheDocument();
    });

    it('leaves the panel unheaded, because the tab already names it', async () => {
      // The tab that opened the panel is its label. A "Derniers matchs"
      // heading directly under a pressed "Matchs" tab is the same word
      // twice, and it would put a second h2 on a page whose single-heading
      // rule the guard above pins.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();
      await screen.findByTestId('match-card');

      const headings = screen.getAllByRole('heading').map((h) => h.textContent);
      expect(headings).toEqual(['Classement ping-pong']);
    });

    it('renders a card per match on the matches tab', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match({ id: 'm1' }), match({ id: 'm2' })]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();

      expect(await screen.findAllByTestId('match-card')).toHaveLength(2);
    });

    it('shows matches even when nobody is ranked yet', async () => {
      // The cold-start case, and the reason the section exists. For the first
      // eight weighted matches every player is still calibrating, so the
      // ranked list is empty while real matches have been played.
      givenBoard([
        player({ id: 'a', rank: null, provisional: true }),
        player({ id: 'b', rank: null, provisional: true }),
      ]);
      givenMatches([match({ id: 'm1' })]);

      render(<PingpongPage />);
      expect(await screen.findByTestId('pingpong-count')).toHaveTextContent('0');
      await openMatches();

      expect(await screen.findByTestId('match-card')).toBeInTheDocument();
    });

    it('groups matches under a date separator', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([
        match({ id: 'recent', playedAt: '2026-03-14T12:00:00Z' }),
        match({ id: 'older', playedAt: '2026-03-01T12:00:00Z' }),
      ]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();
      await screen.findAllByTestId('match-card');
      const section = screen.getByTestId('pingpong-matches');
      // Two different days means two separators, each carrying its count.
      expect(within(section).getAllByTestId('match-card')).toHaveLength(2);
      expect(section.textContent).not.toMatch(/undefined/i);
    });

    it('keeps the API order, newest first', async () => {
      // The API sorts DESC; grouping must not reverse it.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([
        match({ id: 'recent', playedAt: '2026-03-14T12:00:00Z' }),
        match({ id: 'older', playedAt: '2026-03-01T12:00:00Z' }),
      ]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();

      const cards = await screen.findAllByTestId('match-card');
      expect(cards[0]).toHaveAttribute('data-match-id', 'recent');
      expect(cards[1]).toHaveAttribute('data-match-id', 'older');
    });

    it('keeps a match whose player the API could not load', async () => {
      // Archived players come back null while their matches remain. Dropping
      // the row would silently shorten everyone's history.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match({ playerBId: 'disparu', playerB: null })]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();

      const card = await screen.findByTestId('match-card');
      expect(within(card).getByTestId('match-player-b')).toHaveTextContent(
        /joueur inconnu/i,
      );
      expect(card).not.toHaveTextContent(/undefined/i);
    });

    it('shows a skeleton while the matches are in flight', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      fetchRecentMatches.mockReturnValue(new Promise(() => {}));

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();

      expect(screen.getByTestId('pingpong-matches-loading')).toBeInTheDocument();
    });

    it('renders no matches section at all when there are none', async () => {
      // Nothing to show and nothing to explain: the board's own empty state
      // already says to record the first match. An "aucun match" panel
      // underneath it would be the same sentence twice.
      //
      // On an empty board there is no tab bar either — same `!isEmpty` gate
      // as the add button — so there is nothing to open.
      givenBoard([]);
      givenMatches([]);

      render(<PingpongPage />);

      await screen.findByTestId('pingpong-empty');
      expect(screen.queryByTestId('pingpong-matches')).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    /**
     * The two requests are independent, which is the point of fetching the
     * matches here rather than folding them into the leaderboard hook.
     */
    describe('independence from the leaderboard', () => {
      it('still renders the board when the matches fail', async () => {
        // Restructured for the tabs, not patched. The two panels no longer
        // share a screen, so "board intact AND error visible" is not a state
        // that exists to assert. What the test is actually for — a dead
        // history leaving a working leaderboard — is now a round trip: the
        // board renders, the failure is confined to the other panel, and the
        // board is still there on the way back.
        givenBoard([player({ id: 'a', rank: 1 })]);
        fetchRecentMatches.mockRejectedValue(new Error('500'));

        render(<PingpongPage />);

        expect(await screen.findAllByTestId('pingpong-row')).toHaveLength(1);
        expect(screen.queryByTestId('pingpong-error')).not.toBeInTheDocument();

        await openMatches();
        // Awaited, not read synchronously: the rejection settles a tick
        // later than the panel renders, and a getBy here races it.
        await screen.findByTestId('pingpong-matches-error');
        // The board's own error state stayed away — the failure is scoped.
        expect(screen.queryByTestId('pingpong-error')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('tab', { name: /classement/i }));
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1);
      });

      it('offers a retry that reloads only the matches', async () => {
        givenBoard([player({ id: 'a', rank: 1 })]);
        fetchRecentMatches.mockRejectedValue(new Error('500'));

        render(<PingpongPage />);
        await screen.findAllByTestId('pingpong-row');
        await openMatches();

        const error = await screen.findByTestId('pingpong-matches-error');
        givenMatches([match()]);
        await userEvent.click(within(error).getByRole('button'));

        expect(await screen.findByTestId('match-card')).toBeInTheDocument();
      });

      it('shows no matches section when the board itself failed', async () => {
        // A dead board means the whole screen is an error message. Matches
        // below it would suggest the failure was partial when it was not.
        givenBoard([], { error: new Error('offline') });
        givenMatches([match()]);

        render(<PingpongPage />);

        await screen.findByTestId('pingpong-error');
        expect(screen.queryByTestId('pingpong-matches')).not.toBeInTheDocument();
      });

      it('fetches the matches once', async () => {
        givenBoard([player({ id: 'a', rank: 1 })]);
        givenMatches([match()]);

        render(<PingpongPage />);
        await screen.findAllByTestId('pingpong-row');
        await openMatches();

        await screen.findByTestId('match-card');
        expect(fetchRecentMatches).toHaveBeenCalledTimes(1);
      });

      it('fetches the matches before the tab is opened', async () => {
        // The tab swaps a rendered panel; it does not gate a request. Both
        // fetches fire in parallel on load, as they did when the two
        // sections shared a screen, so opening the history is instant rather
        // than the start of a spinner.
        givenBoard([player({ id: 'a', rank: 1 })]);
        givenMatches([match()]);

        render(<PingpongPage />);

        await screen.findAllByTestId('pingpong-row');
        expect(fetchRecentMatches).toHaveBeenCalledTimes(1);
      });
    });

    it('offers a way to record a match when the board failed to load', async () => {
      // A failed leaderboard read is a broken read path, not a broken write
      // path. Leaving the error state with no action makes an unrelated
      // failure block recording a match that has already been played.
      givenBoard([], { error: new Error('offline') });

      render(<PingpongPage />);

      const error = await screen.findByTestId('pingpong-error');
      expect(
        within(error).getByRole('link', { name: /enregistrer un match/i }),
      ).toHaveAttribute('href', '/pingpong/add');
    });
  });
});

/**
 * Stands in for the bottom nav's centre holder.
 *
 * The real one lives in `BottomNav`, which is layout chrome and not mounted
 * here. Registering a plain div gives the page's `AddActivitySlot` somewhere
 * to portal to, so the gate above is tested rather than the plumbing.
 */
function NavSlotStub() {
  const register = useAddActivitySlotTarget();
  return <div ref={register} data-testid="nav-slot" />;
}
