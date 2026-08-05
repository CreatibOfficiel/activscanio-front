import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RacesPage from '../page';
import { AppContext } from '../../context/AppContext';
import { useInfiniteRaces } from '../../hooks/useInfiniteRaces';
import { useSportPreference } from '../../hooks/useSportPreference';
import {
  AddActivitySlotProvider,
  useAddActivitySlotTarget,
} from '../../context/AddActivitySlotContext';
import { RaceEvent } from '../../models/RaceEvent';

jest.mock('../../hooks/useInfiniteRaces');
jest.mock('../../hooks/useSportPreference');
jest.mock('../../utils/authenticated-fetch', () => ({
  authenticatedFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ total: 0, weekly: 0, mostActive: null }),
  }),
}));

// The rows themselves are not what is under test here, and rendering them
// would drag in the full RaceEvent shape for no gain.
jest.mock('../../components/race/RaceCard', () => ({
  __esModule: true,
  default: () => <div data-testid="race-card" />,
}));

const mockedRaces = useInfiniteRaces as jest.MockedFunction<
  typeof useInfiniteRaces
>;
const mockedPreference = useSportPreference as jest.MockedFunction<
  typeof useSportPreference
>;

/**
 * The races screen's add control.
 *
 * It used to be a link hardcoded to /races/add. That was correct while races
 * were the only thing a user could add; with ping-pong it means someone who
 * follows both sports has to leave this screen to log a match.
 *
 * The gate on `total > 0` stays. A user with no races at all already has the
 * empty state's call to action a few pixels away, and two identical prompts on
 * one screen is one too many.
 *
 * The control no longer renders into the page: it portals into the bottom
 * bar's centre slot, so these render inside the slot provider with a stand-in
 * target. Without one the portal would have nowhere to go and every assertion
 * here would pass or fail for the wrong reason.
 *
 * The page itself is now a thin wrapper around `RaceHistory`, which `/` also
 * renders behind its Courses tab. The list, filters and infinite scroll are
 * covered by that component's own suite; what is still tested here is what
 * this route adds — its title, and the add control's gate.
 */
describe('RacesPage — add control', () => {
  function race(id: string): RaceEvent {
    return {
      id,
      date: '2026-07-30T10:00:00Z',
      participants: [],
    } as unknown as RaceEvent;
  }

  function givenRaces(races: RaceEvent[], total = races.length) {
    mockedRaces.mockReturnValue({
      races,
      total,
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      loadMore: jest.fn(),
    } as unknown as ReturnType<typeof useInfiniteRaces>);
  }

  function givenSports(sports: Array<'mario-kart' | 'ping-pong'>) {
    const showsMarioKart = sports.includes('mario-kart');
    const showsPingpong = sports.includes('ping-pong');
    mockedPreference.mockReturnValue({
      preference:
        showsMarioKart && showsPingpong
          ? 'both'
          : showsMarioKart
            ? 'mario-kart'
            : 'ping-pong',
      sports,
      showsMarioKart,
      showsPingpong,
      followsBoth: showsMarioKart && showsPingpong,
      loading: false,
      saving: false,
      change: jest.fn(),
    });
  }

  function renderPage() {
    return render(
      <AddActivitySlotProvider>
        <AppContext.Provider
          value={
            {
              isLoading: false,
              allCompetitors: [],
            } as unknown as React.ContextType<typeof AppContext>
          }
        >
          <RacesPage />
        </AppContext.Provider>
        <NavSlotStub />
      </AddActivitySlotProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    givenSports(['mario-kart']);
    givenRaces([race('r1')]);
  });

  // The control arrives through a portal, which needs a mount effect, so these
  // await it rather than reading the DOM on the first synchronous pass.
  it('links straight to the race form for a Mario-Kart-only user', async () => {
    renderPage();

    expect(
      await screen.findByRole('link', { name: /ajouter une course/i }),
    ).toHaveAttribute('href', '/races/add');
  });

  it('offers both sports to a user who follows both', async () => {
    givenSports(['mario-kart', 'ping-pong']);

    renderPage();
    await userEvent.click(
      await screen.findByRole('button', { name: /ajouter/i }),
    );

    const links = within(screen.getByRole('dialog')).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/races/add',
      '/pingpong/add',
    ]);
  });

  it('stays hidden while there are no races', async () => {
    // The empty state already carries its own call to action, so the bar's
    // control would be the second identical prompt on one screen.
    givenRaces([], 0);

    renderPage();

    // Waits for the portal target to register before asserting absence.
    // Reading the DOM synchronously would find nothing whether the gate works
    // or not, so this test would pass on a broken gate.
    await screen.findByTestId('nav-slot');
    expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
  });

  it('is present once there is at least one race', async () => {
    givenRaces([race('r1')], 1);

    renderPage();

    expect(await screen.findByTestId('add-activity')).toBeInTheDocument();
  });

  /**
   * What this route keeps while the board's Courses panel was rearranged.
   *
   * `/` moved its headings inside its tab panels, so the Courses panel now
   * carries an h1 of its own. This page renders the same `RaceHistory` but has
   * no tabs and no ranking, so its own title and its own countdown must both
   * survive that change untouched.
   */
  describe('standing on its own', () => {
    it('titles itself Courses at level 1', async () => {
      renderPage();

      expect(
        await screen.findByRole('heading', { level: 1, name: /^courses$/i }),
      ).toBeInTheDocument();
    });

    it('carries exactly one h1', async () => {
      // The board's panel heading must not arrive here as a second one:
      // `/races` supplies its own title and `RaceHistory` supplies none.
      renderPage();
      await screen.findByRole('heading', { level: 1 });

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });

    it('shows the season countdown, which the board suppresses', async () => {
      // `showCountdown` is left unset here, so it defaults to true. On `/` the
      // countdown belongs to the ranking panel and the flag is passed false.
      renderPage();

      expect(await screen.findByText(/fin de saison/i)).toBeInTheDocument();
    });
  });
});

/**
 * Stands in for the bottom nav's centre holder.
 *
 * The real one lives in `BottomNav`, which is layout chrome and not mounted
 * here. Registering a plain div gives the page's `AddActivitySlot` somewhere
 * to portal to, so the gate is what gets tested rather than the plumbing.
 */
function NavSlotStub() {
  const register = useAddActivitySlotTarget();
  return <div ref={register} data-testid="nav-slot" />;
}
