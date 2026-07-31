import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RacesPage from '../page';
import { AppContext } from '../../context/AppContext';
import { useInfiniteRaces } from '../../hooks/useInfiniteRaces';
import { useSportPreference } from '../../hooks/useSportPreference';
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
      <AppContext.Provider
        value={
          {
            isLoading: false,
            allCompetitors: [],
          } as unknown as React.ContextType<typeof AppContext>
        }
      >
        <RacesPage />
      </AppContext.Provider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    givenSports(['mario-kart']);
    givenRaces([race('r1')]);
  });

  it('links straight to the race form for a Mario-Kart-only user', () => {
    renderPage();

    expect(
      screen.getByRole('link', { name: /ajouter une course/i }),
    ).toHaveAttribute('href', '/races/add');
  });

  it('offers both sports to a user who follows both', async () => {
    givenSports(['mario-kart', 'ping-pong']);

    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    const links = within(screen.getByRole('dialog')).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/races/add',
      '/pingpong/add',
    ]);
  });

  it('stays hidden while there are no races', () => {
    // The empty state already carries its own call to action, so the floating
    // control would be the second identical prompt on one screen.
    givenRaces([], 0);

    renderPage();

    expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
  });

  it('is present once there is at least one race', () => {
    givenRaces([race('r1')], 1);

    renderPage();

    expect(screen.getByTestId('add-activity')).toBeInTheDocument();
  });
});
