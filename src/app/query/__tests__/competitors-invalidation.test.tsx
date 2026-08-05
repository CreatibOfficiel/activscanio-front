import { ReactNode } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCompetitorsQuery,
  useInvalidateCompetitors,
} from '../useCompetitors';
import { authenticatedFetch } from '../../utils/authenticated-fetch';

/**
 * The real-time flow, which is the highest regression risk in this migration.
 *
 * `SocketWrapper` used to call `AppProvider.refreshCompetitors`, a plain fetch.
 * When a race is recorded the server emits `race:announcement`, `race:results`
 * and `competitor:updated` in the same tick, so that produced three separate
 * requests for one event. It now invalidates a query key instead.
 *
 * Two properties have to hold, and the second is the one that could silently
 * break the app:
 *   1. a burst of invalidations collapses into ONE refetch;
 *   2. the leaderboard still actually updates afterwards.
 *
 * Property 1 does not come for free. Measured against React Query v5, three
 * same-tick `invalidateQueries` calls issue three refetches — it dedupes
 * in-flight requests, not repeated invalidations of an idle query. Hence the
 * explicit coalescing in `useInvalidateCompetitors`, which is exactly what the
 * first test here pins down.
 */

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('test-token'),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

jest.mock('../../utils/authenticated-fetch', () => ({
  authenticatedFetch: jest.fn(),
}));

const mockedFetch = authenticatedFetch as jest.MockedFunction<
  typeof authenticatedFetch
>;

const competitor = (id: string, score: number) => ({
  id,
  firstName: id,
  lastName: 'X',
  rating: 1500,
  rd: 50,
  conservativeScore: score,
});

function respondWith(payload: unknown) {
  mockedFetch.mockResolvedValue({
    ok: true,
    json: async () => payload,
  } as Response);
}

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  });
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Stands in for the leaderboard plus the socket handlers that refresh it. */
function Harness() {
  const { data } = useCompetitorsQuery();
  const invalidate = useInvalidateCompetitors();
  return (
    <>
      <div data-testid="top">{data?.[0]?.conservativeScore ?? '-'}</div>
      <button data-testid="burst" onClick={() => {
        // The three socket events that arrive together after a race.
        invalidate();
        invalidate();
        invalidate();
      }} />
      <button data-testid="single" onClick={() => invalidate()} />
    </>
  );
}

describe('competitors — socket-driven invalidation', () => {
  it('collapses a burst of three invalidations into a single refetch', async () => {
    respondWith([competitor('a', 100)]);
    render(<Harness />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('100');
    });
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    respondWith([competitor('a', 250)]);
    await act(async () => {
      screen.getByTestId('burst').click();
      // Past the coalescing window, so the single scheduled refetch runs.
      await new Promise((r) => setTimeout(r, 120));
    });

    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('250');
    });

    // The initial load plus exactly one refetch for the whole burst.
    // Before the migration this was 1 + 3.
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('still delivers fresh data after an invalidation', async () => {
    // Guards the failure mode that matters most: an invalidation that dedupes
    // so aggressively it never refetches would leave a permanently stale
    // leaderboard, with nothing on screen to indicate it.
    respondWith([competitor('a', 100)]);
    render(<Harness />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('100');
    });

    respondWith([competitor('a', 999)]);
    await act(async () => {
      screen.getByTestId('burst').click();
      await new Promise((r) => setTimeout(r, 120));
    });

    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('999');
    });
  });

  it('refetches for a lone event, without needing a burst to trigger it', async () => {
    // The coalescing must not turn into a requirement for multiple events:
    // `competitor:updated` often arrives on its own.
    respondWith([competitor('a', 100)]);
    render(<Harness />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('100');
    });

    respondWith([competitor('a', 500)]);
    await act(async () => {
      screen.getByTestId('single').click();
      await new Promise((r) => setTimeout(r, 120));
    });

    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('500');
    });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('refetches again for an event arriving after the window closed', async () => {
    // Two genuinely separate races must produce two refreshes; the coalescing
    // window is per-burst, not a rate limit that swallows later events.
    respondWith([competitor('a', 100)]);
    render(<Harness />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('100');
    });

    respondWith([competitor('a', 200)]);
    await act(async () => {
      screen.getByTestId('single').click();
      await new Promise((r) => setTimeout(r, 120));
    });
    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('200');
    });

    respondWith([competitor('a', 300)]);
    await act(async () => {
      screen.getByTestId('single').click();
      await new Promise((r) => setTimeout(r, 120));
    });
    await waitFor(() => {
      expect(screen.getByTestId('top')).toHaveTextContent('300');
    });

    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });
});
