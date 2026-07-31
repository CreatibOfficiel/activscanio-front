import { act, renderHook, waitFor } from '@testing-library/react';
import { useSportPreference } from '../useSportPreference';
import { useCurrentUserData } from '../useCurrentUserData';
import { UsersRepository, UserData } from '../../repositories/UsersRepository';

jest.mock('../useCurrentUserData', () => ({
  useCurrentUserData: jest.fn(),
  setCachedUserData: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue('tok') }),
}));

const mockedUserData = useCurrentUserData as jest.MockedFunction<
  typeof useCurrentUserData
>;

/**
 * Sport preference.
 *
 * The load-bearing case is the default. This value decides which screens
 * render, and it is missing in three ordinary situations: a signed-out
 * visitor, a user row written before the column existed, and any moment
 * while the request is in flight. Getting the default wrong blanks a
 * leaderboard on every page load — a failure that looks like a bug in the
 * leaderboard, not in this hook.
 */
describe('useSportPreference', () => {
  function givenUser(user: Partial<UserData> | null, loading = false) {
    mockedUserData.mockReturnValue({
      userData: user as UserData | null,
      loading,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('defaulting', () => {
    it('shows both sports when the user has no preference stored', async () => {
      // A row written before the column existed.
      givenUser({ id: 'u1' });

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.preference).toBe('both');
      expect(result.current.showsMarioKart).toBe(true);
      expect(result.current.showsPingpong).toBe(true);
    });

    it('shows both sports for a signed-out visitor', async () => {
      givenUser(null);

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.showsMarioKart).toBe(true);
      expect(result.current.showsPingpong).toBe(true);
    });

    it('shows both sports while the request is still in flight', async () => {
      // Defaulting to a single sport here would blank the other leaderboard
      // on every page load, then flash it back in.
      givenUser(null, true);

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.showsMarioKart).toBe(true);
      expect(result.current.showsPingpong).toBe(true);
      expect(result.current.loading).toBe(true);
    });
  });

  describe('reading a stored preference', () => {
    it('shows only Mario Kart', () => {
      givenUser({ id: 'u1', sportPreference: 'mario-kart' });

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.showsMarioKart).toBe(true);
      expect(result.current.showsPingpong).toBe(false);
      expect(result.current.followsBoth).toBe(false);
    });

    it('shows only ping-pong', () => {
      givenUser({ id: 'u1', sportPreference: 'ping-pong' });

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.showsMarioKart).toBe(false);
      expect(result.current.showsPingpong).toBe(true);
      expect(result.current.followsBoth).toBe(false);
    });

    it('flags followsBoth only when both are on', () => {
      givenUser({ id: 'u1', sportPreference: 'both' });

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.followsBoth).toBe(true);
    });
  });

  describe('sports list', () => {
    it('lists Mario Kart before ping-pong', () => {
      // Order is the display order, so it must be stable rather than
      // whatever object iteration happens to give.
      givenUser({ id: 'u1', sportPreference: 'both' });

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.sports).toEqual(['mario-kart', 'ping-pong']);
    });

    it('holds a single sport when only one is followed', () => {
      givenUser({ id: 'u1', sportPreference: 'ping-pong' });

      const { result } = renderHook(() => useSportPreference());

      expect(result.current.sports).toEqual(['ping-pong']);
    });
  });

  describe('change', () => {
    it('writes the new preference', async () => {
      givenUser({ id: 'u1', sportPreference: 'both' });
      const spy = jest
        .spyOn(UsersRepository, 'changeSportPreference')
        .mockResolvedValue({ id: 'u1' } as UserData);

      const { result } = renderHook(() => useSportPreference());

      await act(async () => {
        await result.current.change('ping-pong');
      });

      expect(spy).toHaveBeenCalledWith('ping-pong', 'tok');
    });

    it('clears the saving flag even when the write fails', async () => {
      // Otherwise a failed save leaves the settings screen stuck on a
      // spinner with no way back.
      givenUser({ id: 'u1' });
      jest
        .spyOn(UsersRepository, 'changeSportPreference')
        .mockRejectedValue(new Error('offline'));

      const { result } = renderHook(() => useSportPreference());

      await act(async () => {
        await expect(result.current.change('ping-pong')).rejects.toThrow(
          'offline',
        );
      });

      await waitFor(() => expect(result.current.saving).toBe(false));
    });
  });
});
