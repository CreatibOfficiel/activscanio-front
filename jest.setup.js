// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Clerk. Without this, importing `@clerk/nextjs` pulls in `@clerk/backend`,
// which ships untranspiled .mjs files that Jest does not transform — the import
// fails with "Unexpected token 'export'". Component tests should not load the
// real auth SDK anyway.
//
// Override per test with `jest.mocked(useAuth).mockReturnValue({ ... })`.
jest.mock('@clerk/nextjs', () => ({
  __esModule: true,
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_test',
    sessionId: 'sess_test',
    getToken: jest.fn().mockResolvedValue('mock-token'),
    signOut: jest.fn(),
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_test',
      firstName: 'Test',
      lastName: 'User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
  })),
  ClerkProvider: ({ children }) => children,
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => null,
}))

// Mock react-hot-toast to avoid portal rendering issues in jsdom
jest.mock('react-hot-toast', () => {
  const mockToast = Object.assign(
    jest.fn(),
    {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
      custom: jest.fn(),
      promise: jest.fn(),
      dismiss: jest.fn(),
    }
  );
  return {
    __esModule: true,
    default: mockToast,
  };
})
