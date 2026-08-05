import { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUserData } from '../../hooks/useCurrentUserData';
import { useSportPreference } from '../../hooks/useSportPreference';
import { UsersRepository } from '../../repositories/UsersRepository';

/**
 * The regression this file exists for.
 *
 * /profile used to fire `/users/me` twice, ~12ms apart: the page ran its own
 * `UsersRepository.getMe` inside a `Promise.all` while `useSportPreference`
 * independently triggered the module-cached `useCurrentUserData`. Neither knew
 * about the other, and the old cache was only written *after* a response
 * landed, so two components mounting in the same commit both saw an empty
 * cache and both fetched.
 *
 * These tests assert the property that fixes it: any number of concurrent
 * consumers of the current user produce exactly one network call.
 */

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('test-token'),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

jest.mock('../../repositories/UsersRepository', () => ({
  UsersRepository: {
    getMe: jest.fn(),
    changeSportPreference: jest.fn(),
  },
}));

const getMe = UsersRepository.getMe as jest.MockedFunction<
  typeof UsersRepository.getMe
>;

const USER = {
  id: 'u1',
  clerkId: 'c1',
  email: 'a@b.c',
  firstName: 'Ada',
  lastName: 'L',
  role: 'player' as const,
  sportPreference: 'both' as const,
  hasCompletedOnboarding: true,
  competitorId: 'comp-1',
};

/**
 * A fresh client per test, built once and reused for that test's rerenders.
 *
 * It must NOT be rebuilt on every render: a new client is a new cache, which
 * would throw away the very deduplication these tests assert. `staleTime`
 * mirrors the real `useCurrentUserData` value so a warm entry is not
 * immediately considered stale and refetched.
 */
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 5 * 60_000 } },
  });
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Reads the user directly, the way the profile page now does. */
function DirectReader() {
  const { userData } = useCurrentUserData();
  return <div data-testid="direct">{userData?.firstName ?? '-'}</div>;
}

/** Reads it through the sport preference, the way the page also does. */
function PreferenceReader() {
  const { preference } = useSportPreference();
  return <div data-testid="preference">{preference}</div>;
}

beforeEach(() => {
  jest.clearAllMocks();
  getMe.mockResolvedValue(USER);
});

describe('current user — request deduplication', () => {
  it('fires a single /users/me for two consumers mounted together', async () => {
    // This is the /profile shape exactly: the page body and the sport
    // preference hook, in one commit.
    render(
      <>
        <DirectReader />
        <PreferenceReader />
      </>,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByTestId('direct')).toHaveTextContent('Ada');
    });
    expect(screen.getByTestId('preference')).toHaveTextContent('both');

    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it('does not refetch for a consumer that mounts later', async () => {
    const { rerender } = render(<DirectReader />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('direct')).toHaveTextContent('Ada');
    });
    expect(getMe).toHaveBeenCalledTimes(1);

    // A late mount reads the warm cache rather than issuing its own request —
    // this is what makes a back-navigation instant. Wrapped explicitly so the
    // rerender keeps the same client, and therefore the same cache.
    rerender(
      <QueryClientProvider client={client}>
        <DirectReader />
        <PreferenceReader />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('preference')).toHaveTextContent('both');
    });
    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it('still surfaces a loading state before the user arrives', async () => {
    // The spinner must not disappear just because the data is now shared:
    // /profile gates its whole render on this flag.
    let resolve!: (v: typeof USER) => void;
    getMe.mockReturnValue(new Promise((r) => (resolve = r)));

    function LoadingProbe() {
      const { loading } = useCurrentUserData();
      return <div data-testid="loading">{String(loading)}</div>;
    }

    render(<LoadingProbe />, { wrapper });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    resolve(USER);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });
});
