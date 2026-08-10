import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongPage from '../page';
import { usePingpongLeaderboard } from '../../hooks/usePingpongLeaderboard';
import { useSportPreference } from '../../hooks/useSportPreference';
import {
  AddActivitySlotProvider,
  useAddActivitySlotTarget,
} from '../../context/AddActivitySlotContext';
import {
  buildPingpongBoard,
  segmentPingpongLeaderboard,
} from '../../utils/pingpong-leaderboard';
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
      // The shape the page actually renders from. `segmentation` is still
      // returned by the hook because the TV board consumes it; this page reads
      // `board`, which ranks everyone rather than only those the API gated in.
      board: buildPingpongBoard(players),
      loading: state.loading ?? false,
      error: state.error ?? null,
      refresh: jest.fn(),
    });
  }

  /**
   * The real league, measured in production after a full rating recompute.
   *
   * Two of these eight carried a rank from the API. The rest were shown with
   * an empty rank column, including Don Joran (4 weighted matches against a
   * bar of 5) and Maxime (rd 202 against a ceiling of 200).
   */
  const PRODUCTION_LEAGUE = [
    player({ id: 'charles', firstName: 'Charles', conservativeScore: 1808, rd: 180, weightedMatchCount: 8, rank: 1, provisional: false }),
    player({ id: 'valentin', firstName: 'Valentin', conservativeScore: 1617, rd: 287, weightedMatchCount: 1, rank: null, provisional: true }),
    player({ id: 'joran', firstName: 'Don Joran', conservativeScore: 1611, rd: 202, weightedMatchCount: 4, rank: null, provisional: true }),
    player({ id: 'florian', firstName: 'Florian', conservativeScore: 1593, rd: 290, weightedMatchCount: 1, rank: null, provisional: true }),
    player({ id: 'maxime', firstName: 'Maxime', conservativeScore: 1592, rd: 203, weightedMatchCount: 4, rank: null, provisional: true }),
    player({ id: 'thibaud', firstName: 'Thibaud', conservativeScore: 1381, rd: 166, weightedMatchCount: 7, rank: 2, provisional: false }),
    player({ id: 'ness', firstName: 'Ness', conservativeScore: 1278, rd: 251, weightedMatchCount: 2, rank: null, provisional: true }),
    player({ id: 'clotilde', firstName: 'Clotilde', conservativeScore: 1191, rd: 235, weightedMatchCount: 3, rank: null, provisional: true }),
  ];

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

  it('shows every player across every tier, on one surface or the other', async () => {
    // Was "renders one row per player across every tier". With three players
    // the podium now takes all three, so counting rows alone would assert on
    // an empty list. The property was always "nobody is missing" — a player
    // who cannot find themselves assumes the app forgot them — so it is
    // asserted across both surfaces instead.
    givenBoard([
      player({ id: 'a', firstName: 'Marc', rank: 1, conservativeScore: 1500 }),
      player({ id: 'b', firstName: 'Julie', rank: null, provisional: true, conservativeScore: 1400 }),
      player({ id: 'c', firstName: 'Sam', rank: null, inactive: true, conservativeScore: 1300 }),
    ]);

    render(<PingpongPage />);

    await waitFor(() =>
      expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
    );
    const shown = [
      ...screen.getAllByTestId('pingpong-podium-card'),
      ...screen.queryAllByTestId('pingpong-row'),
    ]
      .map((el) => el.textContent ?? '')
      .join(' ');
    for (const name of ['Marc', 'Julie', 'Sam']) {
      expect(shown).toContain(name);
    }
  });

  /**
   * The real league, end to end.
   *
   * The screen this change exists to fix: eight people in the office, two of
   * them numbered, six rows with an empty rank column. Asserted against the
   * measured production figures rather than a tidy fixture, because the two
   * near-misses — Don Joran on 4 of 5 matches, Maxime on rd 202 against a 200
   * ceiling — are what make the gate indefensible rather than merely strict.
   */
  describe('the production league', () => {
    it('shows all eight players, three on cards and five in the list', async () => {
      // The split, asserted as the split. Eight people are on the screen; the
      // podium holds three of them and the list the other five. Asserting on
      // rows alone would now pass with three players silently dropped.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
      );
      expect(screen.getAllByTestId('pingpong-row')).toHaveLength(5);
    });

    it('puts nobody in both the podium and the list', async () => {
      // THE REPORTED DEFECT, pinned on the real data. Every name appears
      // exactly once across the two surfaces.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
      );

      const NAMES = [
        'Charles',
        'Valentin',
        'Don Joran',
        'Florian',
        'Maxime',
        'Thibaud',
        'Ness',
        'Clotilde',
      ];
      const cardText = screen
        .getAllByTestId('pingpong-podium-card')
        .map((c) => c.textContent ?? '')
        .join(' ');
      const rowText = screen
        .getAllByTestId('pingpong-row')
        .map((r) => r.textContent ?? '')
        .join(' ');

      for (const name of NAMES) {
        const onPodium = cardText.includes(name);
        const inList = rowText.includes(name);
        // Exactly one of the two, for every single player.
        expect({ name, onPodium, inList }).toEqual({
          name,
          onPodium: !inList,
          inList: !onPodium,
        });
      }
    });

    it('starts the list at rank 4, with true contiguous ranks', async () => {
      // No renumbering. The first row under the podium is the 4th best player
      // and says 4 — which is what gating the podium on POSITION buys, and
      // what a confidence gate could not have offered.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(5),
      );
      const positions = screen
        .getAllByTestId('pingpong-rank')
        .map((el) => el.textContent);
      expect(positions).toEqual(['4', '5', '6', '7', '8']);
    });

    it('crowns Charles, Valentin and Don Joran', async () => {
      // The measured outcome, stated rather than implied — and it is NOT what
      // the brief for this change predicted. The reasoning handed down was
      // that the conservative score sinks a one-match player below the
      // podium, giving Charles / Don Joran / Maxime. It does not:
      // `conservativeScore` IS rating − 2×RD, so the deviation is already
      // charged against these very numbers and charging it again would be
      // double counting. Valentin is crowned second on ONE match.
      //
      // Pinned explicitly so nobody re-derives the wrong expectation from the
      // rd column and "fixes" the sort to match it.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('pingpong-podium-card');
      expect(cards[0]).toHaveTextContent('Charles');
      expect(cards[1]).toHaveTextContent('Valentin');
      expect(cards[2]).toHaveTextContent('Don Joran');
    });

    it('marks the two uncertain crowned players and not Charles', async () => {
      // What makes the above honest rather than merely defensible. Valentin
      // (1 match) and Don Joran (4) carry the `?`; Charles's rating is
      // settled and is stated plainly.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('pingpong-podium-card');
      expect(cards[0]).not.toHaveTextContent('?');
      expect(cards[1]).toHaveTextContent('1617?');
      expect(cards[2]).toHaveTextContent('1611?');
    });

    it('orders the list by rating, not by the API rank', async () => {
      // Thibaud is the API's rank 2 and sixth by rating. Sorting on the API
      // rank would put him at the top of the list, above two stronger players
      // who were only below him because the gate excluded them.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(5),
      );
      const names = screen
        .getAllByTestId('pingpong-row')
        .map((row) => row.textContent);
      expect(names[0]).toMatch(/Florian/);
      expect(names[2]).toMatch(/Thibaud/);
      expect(names[4]).toMatch(/Clotilde/);
    });

    it('marks the uncertain ratings in the list and leaves Thibaud alone', async () => {
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(5),
      );
      const marks = screen
        .getAllByTestId('pingpong-row')
        .map((row) => row.getAttribute('data-uncertain'));
      // Florian, Maxime, Thibaud, Ness, Clotilde — Thibaud is the only
      // settled rating left once Charles is on a card.
      expect(marks).toEqual(['true', 'true', 'false', 'true', 'true']);
    });

    it('counts all eight in the subtitle, not just the list', async () => {
      // The count describes the board, so it must not drop the three the
      // podium took. "5 joueurs" over eight visible faces contradicts the
      // screen.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getByTestId('pingpong-count')).toHaveTextContent('8'),
      );
    });

    it('never says nobody is ranked', async () => {
      // The old cold-start note. Everyone is ranked now, so the sentence is
      // simply false — and it named the wrong threshold besides.
      givenBoard(PRODUCTION_LEAGUE);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(5),
      );
      expect(
        screen.queryByTestId('pingpong-nobody-ranked'),
      ).not.toBeInTheDocument();
    });
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
    // Still exactly one heading, but it moved: it used to sit above the tab
    // selector, where it stayed put while the reader was on Matchs and
    // titled a panel that was not rendered. It is inside the ranking panel
    // now. The equality is kept rather than loosened — one heading per panel
    // is the rule this file has always pinned, and the tiers must still not
    // grow headers of their own.
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toEqual(['Classement ping-pong']);
  });

  /**
   * DELIBERATELY REVERSED. This asserted ranked players sort above unranked
   * ones regardless of rating, which followed from the tiers: `ranked` was
   * concatenated before `calibrating`.
   *
   * One list ordered on rating replaces that. The conservative score is
   * rating − 2×RD, so an unsettled rating is already penalised for its own
   * uncertainty — a player with one match sinks on the arithmetic rather than
   * on a rule, which is what makes ranking mixed confidence defensible. Here
   * Julie's 1600 survives that penalty and Marc's 1200 does not, so she leads.
   */
  it('orders players by rating rather than by whether the API ranked them', async () => {
    givenBoard([
      player({
        id: 'new',
        firstName: 'Julie',
        rank: null,
        provisional: true,
        conservativeScore: 1600,
      }),
      player({ id: 'top', firstName: 'Marc', rank: 1, conservativeScore: 1200 }),
    ]);

    render(<PingpongPage />);

    await waitFor(() => expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2));
    const names = screen.getAllByTestId('pingpong-row').map((row) => row.textContent);
    expect(names[0]).toMatch(/Julie/);
    expect(names[1]).toMatch(/Marc/);
  });

  /**
   * The heading follows the selected panel.
   *
   * Same defect as the Mario Kart board and fixed the same way. The page used
   * to title itself "Classement ping-pong" above the tab selector, with the
   * "N joueurs classés + M en calibrage" line under it. Pick Matchs and both
   * stayed: a ranking's title and a ranking's tier counts sitting over a match
   * history that has neither.
   *
   * `page-views.test.tsx` holds the mirror of this block for `/`. The two
   * boards are siblings and a fix that landed on one only would recreate the
   * asymmetry the tab work removed.
   */
  describe('the heading follows the selected panel', () => {
    const rankingTitle = /classement ping-pong/i;

    async function openMatchesTab() {
      await userEvent.click(screen.getByRole('tab', { name: /matchs/i }));
    }

    it('titles the page with the ranking while the ranking is showing', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');

      expect(
        screen.getByRole('heading', { level: 1, name: rankingTitle }),
      ).toBeInTheDocument();
    });

    it('drops the ranking title and its counts on Matchs', async () => {
      // The defect itself. Both must go, and the counts are queried by their
      // text so the assertion cannot be satisfied by a relabelled element.
      givenBoard([
        player({ id: 'a', rank: 1 }),
        player({ id: 'b', rank: null, provisional: true }),
      ]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      expect(screen.getByTestId('pingpong-count')).toBeInTheDocument();

      await openMatchesTab();

      expect(
        screen.queryByRole('heading', { name: rankingTitle }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('pingpong-count')).not.toBeInTheDocument();
      // The subtitle's second half went from "+ N en calibrage" to "N niveaux
      // confirmés" when the tiers collapsed into one list. Same assertion,
      // following the copy.
      expect(
        screen.queryByTestId('pingpong-confident-count'),
      ).not.toBeInTheDocument();
    });

    it('titles the page with the matches once Matchs is picked', async () => {
      // Level 1. With nothing above the tabs naming the page, an h2 here
      // would leave the document without a top-level heading.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatchesTab();

      expect(
        screen.getByRole('heading', { level: 1, name: /^matchs$/i }),
      ).toBeInTheDocument();
    });

    it('restores the ranking title on the way back', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatchesTab();
      await userEvent.click(screen.getByRole('tab', { name: /classement/i }));

      expect(
        screen.getByRole('heading', { level: 1, name: rankingTitle }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { level: 1, name: /^matchs$/i }),
      ).not.toBeInTheDocument();
    });

    it('carries exactly one h1 on either tab', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

      await openMatchesTab();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });

    it('still suppresses the counts on a cold start', async () => {
      // Preserved behaviour, moved inside the panel with the title. "0 joueur
      // classé" over an empty board states a fact nobody needs and makes a new
      // feature read as a dead one. The empty state below says the useful
      // thing instead.
      givenBoard([]);

      render(<PingpongPage />);
      await screen.findByTestId('pingpong-empty');

      expect(screen.queryByTestId('pingpong-count')).not.toBeInTheDocument();
    });

    it('titles the page even when the board is empty', async () => {
      // The tabs are gated on a non-empty board, so on a cold start there is
      // no panel to own a heading. The page must still have one, or the empty
      // state ships a document with no h1 at all.
      givenBoard([]);

      render(<PingpongPage />);
      await screen.findByTestId('pingpong-empty');

      expect(
        screen.getByRole('heading', { level: 1, name: rankingTitle }),
      ).toBeInTheDocument();
    });

    it('titles the page while the board is loading and when it fails', async () => {
      // Same reason: neither state renders a tab strip or a panel, so the
      // heading cannot come from one.
      givenBoard([], { loading: true });
      const { unmount } = render(<PingpongPage />);
      await screen.findByTestId('pingpong-loading');
      expect(
        screen.getByRole('heading', { level: 1, name: rankingTitle }),
      ).toBeInTheDocument();
      unmount();

      givenBoard([], { error: new Error('offline') });
      render(<PingpongPage />);
      await screen.findByTestId('pingpong-error');
      expect(
        screen.getByRole('heading', { level: 1, name: rankingTitle }),
      ).toBeInTheDocument();
    });
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
   * The podium, RE-GATED ON POSITION, AND IT REMOVES ITS PLAYERS AGAIN.
   *
   * Third rule this screen has had. 1: three RANKED players, removed from the
   * list. 2: three CONFIDENT players, removed from nothing. 3: ranks 1-3,
   * removed from the list.
   *
   * (2) was the reported defect — "on affiche les trois personnes qui sont
   * confirmés en mode podium et en dessous on les re afficher dans la liste
   * mélangés avec les gens non confirmés donc c'est ultra perturbant." The
   * same three faces twice, six inches apart, the second time shuffled among
   * players the podium had skipped.
   *
   * Gating on position is what makes removal safe: the podium IS ranks 1-3,
   * so the list resumes at 4 and stays contiguous with no renumbering. The
   * cost is that a provisional player can be crowned — on the production
   * league Valentin is, with one match — and the card carries a `?` for it.
   */
  describe('the podium', () => {
    it('shows none with one player', async () => {
      givenBoard([player({ id: 'a', rank: 1, provisional: false })]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(1),
      );
      expect(
        screen.queryByTestId('pingpong-podium-card'),
      ).not.toBeInTheDocument();
    });

    it('shows none with two settled players', async () => {
      givenBoard([
        player({ id: 'a', rank: 1, provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', rank: 2, provisional: false, conservativeScore: 1400 }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2),
      );
      expect(
        screen.queryByTestId('pingpong-podium-card'),
      ).not.toBeInTheDocument();
    });

    it('appears at three players whatever their confidence', async () => {
      // REVERSED from "shows none with three players when only two are
      // settled". Confidence no longer decides who is crowned; position does.
      // With three players the podium takes all three and the list is empty.
      givenBoard([
        player({ id: 'a', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', provisional: true, rank: null, conservativeScore: 1300 }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
      );
      expect(screen.queryAllByTestId('pingpong-row')).toHaveLength(0);
    });

    it('appears once three ratings are settled', async () => {
      givenBoard([
        player({ id: 'a', firstName: 'Marc', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', firstName: 'Julie', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', firstName: 'Sam', provisional: false, conservativeScore: 1300 }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
      );
    });

    it('takes the crowned three out of the list', async () => {
      // DELIBERATELY REVERSED from "keeps every player in the list when a
      // podium is drawn", which is the defect itself. Marc, Julie and Sam are
      // on cards; only Léa is left in the list.
      givenBoard([
        player({ id: 'a', firstName: 'Marc', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', firstName: 'Julie', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', firstName: 'Sam', provisional: false, conservativeScore: 1300 }),
        player({ id: 'd', firstName: 'Léa', provisional: false, conservativeScore: 1200 }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3),
      );
      const rows = screen.getAllByTestId('pingpong-row');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent('Léa');
    });

    it('crowns an uncertain player who is in the top three', async () => {
      // DELIBERATELY REVERSED from "crowns the settled players even when an
      // uncertain one outrates them". Nina leads the board on one match, and
      // she is crowned first rather than skipped — skipping her would mean
      // the podium is not ranks 1-2-3 and the list could not resume at 4.
      //
      // What stops that being a bare claim is the `?` on her card, asserted
      // below.
      givenBoard([
        player({ id: 'lucky', firstName: 'Nina', provisional: true, rank: null, conservativeScore: 1900 }),
        player({ id: 'a', firstName: 'Marc', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', firstName: 'Julie', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', firstName: 'Sam', provisional: false, conservativeScore: 1300 }),
      ]);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('pingpong-podium-card');
      expect(cards).toHaveLength(3);
      expect(cards[0]).toHaveTextContent('Nina');
      // And she is gone from the list, which now starts at Sam.
      const rows = screen.getAllByTestId('pingpong-row');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent('Sam');
    });

    it('marks an uncertain crowned player with a question mark', async () => {
      // The honesty that makes crowning on position defensible. Nina's rating
      // is a guess off one match and the card says so, in the same convention
      // the rows use.
      givenBoard([
        player({ id: 'lucky', firstName: 'Nina', provisional: true, rank: null, conservativeScore: 1900 }),
        player({ id: 'a', firstName: 'Marc', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', firstName: 'Julie', provisional: false, conservativeScore: 1400 }),
      ]);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('pingpong-podium-card');
      expect(cards[0]).toHaveTextContent('1900?');
      // And a settled crowned player is not marked, or the `?` would just be
      // decoration on every card.
      expect(cards[1]).toHaveTextContent('1500');
      expect(cards[1]).not.toHaveTextContent('?');
    });

    it('crowns three even when every rating is uncertain', async () => {
      // REVERSED from "shows no podium when every rating is uncertain". The
      // realistic first week now gets a podium — three cards, each carrying a
      // `?`, and an empty list under it.
      givenBoard([
        player({ id: 'a', rank: null, provisional: true, conservativeScore: 1300 }),
        player({ id: 'b', rank: null, provisional: true, conservativeScore: 1200 }),
        player({ id: 'c', rank: null, provisional: true, conservativeScore: 1100 }),
      ]);

      render(<PingpongPage />);

      const cards = await screen.findAllByTestId('pingpong-podium-card');
      expect(cards).toHaveLength(3);
      expect(cards.map((c) => c.textContent)).toEqual([
        expect.stringContaining('1300?'),
        expect.stringContaining('1200?'),
        expect.stringContaining('1100?'),
      ]);
    });

    it('badges the cards 1, 2, 3 even when the API ranked nobody', async () => {
      // Every rank here is null, which is what the API sends for a
      // provisional player. A card reading `player.rank` would render the
      // fallback badge — a grey 0 where a gold 1 belongs.
      givenBoard([
        player({ id: 'a', rank: null, provisional: true, conservativeScore: 1300 }),
        player({ id: 'b', rank: null, provisional: true, conservativeScore: 1200 }),
        player({ id: 'c', rank: null, provisional: true, conservativeScore: 1100 }),
      ]);

      render(<PingpongPage />);

      await screen.findAllByTestId('pingpong-podium-card');
      expect(
        screen.getAllByTestId('podium-rank-badge').map((b) => b.textContent),
      ).toEqual(['1', '2', '3']);
    });

    /**
     * The "nobody is ranked" note is GONE, deliberately.
     *
     * It read "Personne n'est encore classé, 8 matchs nécessaires" — three
     * things wrong with it now. Everyone is ranked, so its premise is false;
     * the threshold was 5, not 8, so its number was wrong even before this
     * change; and the state it explained (a list of unnumbered rows) cannot
     * occur any more.
     */
    it('never tells anyone they are unranked', async () => {
      givenBoard([
        player({ id: 'a', rank: null, provisional: true }),
        player({ id: 'b', rank: null, provisional: true }),
      ]);

      render(<PingpongPage />);

      await waitFor(() =>
        expect(screen.getAllByTestId('pingpong-row')).toHaveLength(2),
      );
      expect(
        screen.queryByTestId('pingpong-nobody-ranked'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/personne n'est encore class/i)).toBeNull();
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
      //
      // The row index went back to 0 with the podium's removal. It was 3
      // because the crowned three were also rows 0-2, so rows[0] and card 0
      // were the same player and a broken swap would have passed. They are
      // disjoint again: rows[0] is Léa, who is on no card, so the second
      // click genuinely changes subject.
      givenBoard([
        player({ id: 'a', firstName: 'Marc', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', firstName: 'Julie', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', firstName: 'Sam', provisional: false, conservativeScore: 1300 }),
        player({ id: 'd', firstName: 'Léa', provisional: false, conservativeScore: 1200 }),
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
      // so the preceding "3/5 matchs" runs straight into "Ton rang" and
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

  /**
   * The count is now everyone on the board, not everyone the gate admitted.
   *
   * It used to read "2 joueurs classés + 1 en calibrage", which described the
   * tiers. With one list the honest summary is the size of that list — and on
   * the production league the old line would have said "2 joueurs classés"
   * above eight numbered rows, contradicting the screen underneath it.
   */
  it('counts every player it is showing', async () => {
    givenBoard([
      player({ id: 'a', rank: 1, conservativeScore: 1500 }),
      player({ id: 'b', rank: 2, conservativeScore: 1400 }),
      player({ id: 'c', rank: null, provisional: true, conservativeScore: 1300 }),
    ]);

    render(<PingpongPage />);

    await waitFor(() =>
      expect(screen.getByTestId('pingpong-count')).toHaveTextContent('3'),
    );
  });

  it('says how many of them have a confirmed rating', async () => {
    // The uncertainty, stated once at the top rather than only per row. On the
    // production league this reads "8 joueurs · 2 niveaux confirmés".
    givenBoard(PRODUCTION_LEAGUE);

    render(<PingpongPage />);

    await waitFor(() =>
      expect(screen.getByTestId('pingpong-count')).toHaveTextContent('8'),
    );
    expect(screen.getByTestId('pingpong-confident-count')).toHaveTextContent(
      '2',
    );
  });

  /**
   * The match history, which now lives here and nowhere else.
   *
   * `/pingpong/matches` was a fully-built page nothing linked to — no `Link`
   * anywhere in the tree pointed at it, so it was reachable only by typing
   * the URL. It has been deleted and its rendering folded into this page.
   *
   * The section mattered most on a cold start. Ping-pong launched with zero
   * matches and zero players, and calibration used to withhold a rank, so the
   * first matches produced a leaderboard that was still empty. A screen whose
   * only content is an empty ranking reads as a broken feature.
   *
   * That cold start is gone — everyone is ranked from their first match — but
   * the section stays: matches appear from the first one recorded, and the
   * history is worth a tab on its own merits rather than as cover for an empty
   * board.
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

    it('titles the panel and drops the ranking heading', async () => {
      // DELIBERATELY REVERSED. This used to assert the matches panel carried
      // no heading, on the reasoning that the pressed tab already named it.
      // That reasoning held only while a page-level "Classement ping-pong"
      // sat above the tabs — and that heading was the actual bug: it titled
      // the ranking while the reader was looking at the matches.
      //
      // With the page title gone, an unheaded panel leaves the document with
      // no h1 at all. So the panel names itself, and the ranking's title goes
      // away with the ranking. Still exactly one heading, still no
      // "Derniers matchs" duplicating anything — the panel's title IS the
      // page's title now.
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match()]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();
      await screen.findByTestId('match-card');

      const headings = screen.getAllByRole('heading').map((h) => h.textContent);
      expect(headings).toEqual(['Matchs']);
    });

    it('renders a card per match on the matches tab', async () => {
      givenBoard([player({ id: 'a', rank: 1 })]);
      givenMatches([match({ id: 'm1' }), match({ id: 'm2' })]);

      render(<PingpongPage />);
      await screen.findAllByTestId('pingpong-row');
      await openMatches();

      expect(await screen.findAllByTestId('match-card')).toHaveLength(2);
    });

    it('shows matches even when no rating is confirmed yet', async () => {
      // The cold-start case, and the reason the section exists. The count now
      // reads 2 rather than 0 — both players are on the board — while the
      // confirmed tally is what stays at zero.
      givenBoard([
        player({ id: 'a', rank: null, provisional: true, conservativeScore: 1300 }),
        player({ id: 'b', rank: null, provisional: true, conservativeScore: 1200 }),
      ]);
      givenMatches([match({ id: 'm1' })]);

      render(<PingpongPage />);
      expect(await screen.findByTestId('pingpong-count')).toHaveTextContent('2');
      expect(
        screen.getByTestId('pingpong-confident-count'),
      ).toHaveTextContent('0');
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
