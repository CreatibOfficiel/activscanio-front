import { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingGuard } from '../OnboardingGuard';
import { OnboardingProvider } from '../../../context/OnboardingContext';
import { UsersRepository } from '../../../repositories/UsersRepository';
import { setStoredOnboardingComplete } from '../../../utils/onboarding-storage';

/**
 * What this file pins down.
 *
 * The guard sits in the root layout and wraps the entire app, so anything it
 * waits on is prepended to the load of every single page. It used to hold
 * `children` back until `/users/me` answered, putting a serial network hop in
 * front of the first paint everywhere.
 *
 * The tests below assert both halves of the fix: a user we have already seen
 * onboard renders without waiting for the request, while a user we know
 * nothing about is still gated — otherwise someone who owes us onboarding
 * would see the home page flash before the redirect.
 */

const push = jest.fn();
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: push }),
  usePathname: () => mockPathname,
}));

const getToken = jest.fn();
let mockUserId: string | null = 'clerk-user-1';

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    getToken,
    userId: mockUserId,
  }),
}));

jest.mock('../../../repositories/UsersRepository', () => ({
  UsersRepository: { getMe: jest.fn() },
}));

const getMe = UsersRepository.getMe as jest.MockedFunction<
  typeof UsersRepository.getMe
>;

const USER = {
  id: 'u1',
  clerkId: 'clerk-user-1',
  email: 'a@b.c',
  firstName: 'Ada',
  lastName: 'L',
  role: 'player' as const,
  sportPreference: 'both' as const,
  hasCompletedOnboarding: true,
  competitorId: 'comp-1',
};

let client: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <OnboardingProvider>{children}</OnboardingProvider>
    </QueryClientProvider>
  );
}

/** A never-settling `/users/me`, so "rendered" can only mean "did not wait". */
function pendingGetMe() {
  getMe.mockReturnValue(new Promise(() => {}));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockPathname = '/';
  mockUserId = 'clerk-user-1';
  getToken.mockResolvedValue('test-token');
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('OnboardingGuard — first paint', () => {
  it('renders children before the onboarding check resolves, for a known user', async () => {
    // The load-bearing test. `/users/me` never settles here, so if children
    // appear at all it is because the guard stopped gating on it.
    setStoredOnboardingComplete('clerk-user-1', true);
    pendingGetMe();

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByTestId('app')).toBeInTheDocument();
    });
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
  });

  it('still runs the check in the background once unblocked', async () => {
    // Rendering early must not mean skipping verification: the request has to
    // go out anyway, both to confirm and to warm the shared /users/me cache.
    setStoredOnboardingComplete('clerk-user-1', true);
    getMe.mockResolvedValue(USER);

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(getMe).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  it('populates the shared /users/me cache entry', async () => {
    // The React Query sharing this guard was recently wired up for: its
    // response is what the rest of the tree reads instead of refetching.
    setStoredOnboardingComplete('clerk-user-1', true);
    getMe.mockResolvedValue(USER);

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(client.getQueryData(['currentUser'])).toEqual(USER);
    });
  });

  it('gates an unknown user so onboarding cannot flash', async () => {
    // The counterweight. With nothing in storage we must behave exactly as
    // before, or a user pending onboarding sees the app before the redirect.
    pendingGetMe();

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByTestId('app')).not.toBeInTheDocument();
  });

  it('does not reuse another account stored flag', async () => {
    // A second account on the same device must not inherit the first one's
    // "done" flag and skip the check it actually needs.
    setStoredOnboardingComplete('clerk-user-1', true);
    mockUserId = 'clerk-user-2';
    pendingGetMe();

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('redirects a user who has not completed onboarding', async () => {
    getMe.mockResolvedValue({ ...USER, hasCompletedOnboarding: false });

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('clears a stale flag when the server says onboarding is not done', async () => {
    // Someone reset back into onboarding must lose the fast path, otherwise
    // they would keep rendering the app first on every later load.
    setStoredOnboardingComplete('clerk-user-1', true);
    getMe.mockResolvedValue({ ...USER, hasCompletedOnboarding: false });

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/onboarding');
    });
    expect(localStorage.getItem('onboardingComplete:clerk-user-1')).toBeNull();
  });

  it('renders children on an exempt path without any check', () => {
    mockPathname = '/tv/display';
    pendingGetMe();

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(getMe).not.toHaveBeenCalled();
  });

  it('renders children for a signed-out user rather than gating them', async () => {
    // Unauthenticated visitors are the middleware's problem, not the guard's.
    getToken.mockResolvedValue(null);
    pendingGetMe();

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByTestId('app')).toBeInTheDocument();
    });
    expect(getMe).not.toHaveBeenCalled();
  });

  it('keeps the app up when a background confirmation fails', async () => {
    // A transient blip must not swap a working, already-rendered UI for a
    // full-screen error.
    setStoredOnboardingComplete('clerk-user-1', true);
    getMe.mockRejectedValue(new Error('network down'));

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(getMe).toHaveBeenCalled();
    });
    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.queryByText('Oups !')).not.toBeInTheDocument();
  });

  it('still shows the error screen when it was gating the render', async () => {
    // The retry affordance has to survive for the case it was written for:
    // a cold load that cannot reach the server.
    getMe.mockRejectedValue(new Error('network down'));

    render(
      <OnboardingGuard>
        <div data-testid="app">app</div>
      </OnboardingGuard>,
      { wrapper },
    );

    await waitFor(() => {
      expect(screen.getByText('Oups !')).toBeInTheDocument();
    });
    expect(screen.getByText('Réessayer')).toBeInTheDocument();
  });
});
