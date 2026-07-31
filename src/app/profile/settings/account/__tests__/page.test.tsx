import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSettingsPage from '../page';
import { useSportPreference } from '../../../../hooks/useSportPreference';

jest.mock('../../../../hooks/useSportPreference');

// The global Clerk mock in jest.setup.js does not cover useClerk, which this
// page uses for sign-out and the profile dialog.
jest.mock('@clerk/nextjs', () => ({
  __esModule: true,
  useClerk: () => ({ signOut: jest.fn(), openUserProfile: jest.fn() }),
  useUser: () => ({ user: { firstName: 'Test' } }),
}));

const mockedPreference = useSportPreference as jest.MockedFunction<
  typeof useSportPreference
>;

/**
 * The sport preference setting.
 *
 * Same two checkboxes as onboarding, minus the Continue button — which is
 * where the interesting problem is. Onboarding can let the user hold an
 * invalid answer ("neither") for as long as they like, because Continue is
 * disabled until it becomes valid. A settings screen saves on change, so
 * there is no later moment to validate at: the guard has to live on the
 * write itself.
 *
 * The backend column is 'mario-kart' | 'ping-pong' | 'both'. "Neither" is not
 * representable, and the failure mode if it slipped through is not a rejected
 * request — toSportPreference would have to invent something, and every
 * plausible invention is the opposite of what the user asked for.
 */
describe('AccountSettingsPage — sport preference', () => {
  const change = jest.fn();

  function givenPreference(
    preference: 'mario-kart' | 'ping-pong' | 'both',
    state: { loading?: boolean; saving?: boolean } = {},
  ) {
    const showsMarioKart = preference === 'mario-kart' || preference === 'both';
    const showsPingpong = preference === 'ping-pong' || preference === 'both';
    mockedPreference.mockReturnValue({
      preference,
      sports: [
        ...(showsMarioKart ? (['mario-kart'] as const) : []),
        ...(showsPingpong ? (['ping-pong'] as const) : []),
      ],
      showsMarioKart,
      showsPingpong,
      followsBoth: showsMarioKart && showsPingpong,
      loading: state.loading ?? false,
      saving: state.saving ?? false,
      change,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    change.mockResolvedValue(undefined);
    givenPreference('both');
  });

  it('shows a checkbox per sport', () => {
    render(<AccountSettingsPage />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('reflects the stored preference', () => {
    givenPreference('ping-pong');

    render(<AccountSettingsPage />);

    expect(
      screen.getByRole('checkbox', { name: /mario kart/i }),
    ).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /ping-pong/i })).toBeChecked();
  });

  it('saves when a second sport is added', async () => {
    givenPreference('mario-kart');

    render(<AccountSettingsPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: /ping-pong/i }));

    expect(change).toHaveBeenCalledWith('both');
  });

  it('saves when a sport is dropped and one remains', async () => {
    givenPreference('both');

    render(<AccountSettingsPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: /mario kart/i }));

    expect(change).toHaveBeenCalledWith('ping-pong');
  });

  describe('the last remaining sport', () => {
    it('does not write when the last box is unticked', async () => {
      // 'neither' has no column value. Letting the call through would mean
      // inventing one, and every candidate contradicts the user's action.
      givenPreference('mario-kart');

      render(<AccountSettingsPage />);
      await userEvent.click(
        screen.getByRole('checkbox', { name: /mario kart/i }),
      );

      expect(change).not.toHaveBeenCalled();
    });

    it('leaves the box ticked', async () => {
      // The refusal has to be visible. A box that unticks and then silently
      // does nothing reads as a save that failed.
      givenPreference('ping-pong');

      render(<AccountSettingsPage />);
      await userEvent.click(
        screen.getByRole('checkbox', { name: /ping-pong/i }),
      );

      expect(screen.getByRole('checkbox', { name: /ping-pong/i })).toBeChecked();
    });

    it('says why nothing happened', async () => {
      givenPreference('ping-pong');

      render(<AccountSettingsPage />);
      await userEvent.click(
        screen.getByRole('checkbox', { name: /ping-pong/i }),
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('drops the message once the choice becomes valid again', async () => {
      givenPreference('ping-pong');

      render(<AccountSettingsPage />);
      await userEvent.click(
        screen.getByRole('checkbox', { name: /ping-pong/i }),
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('checkbox', { name: /mario kart/i }),
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('leaves the account actions in place', () => {
    // The setting is an addition to this screen, not a replacement.
    render(<AccountSettingsPage />);

    expect(
      screen.getByRole('button', { name: /se déconnecter/i }),
    ).toBeInTheDocument();
  });
});
