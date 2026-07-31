import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StreakLostModal from '../StreakLostModal';
import { StreakLossPayload } from '../../../types/streak-loss';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

/**
 * The streak-lost modal.
 *
 * It carried a "Placer mon prono" button pushing to /betting, a route
 * deleted with the betting system. That was unreachable for a while only by
 * accident: the API sent the loss under a key the client did not read, so
 * the modal never opened at all. Fixing that key made the dead link
 * reachable, which is why both were fixed together.
 *
 * Both kinds of streak are repaired the same way — by racing — so there is
 * one call to action now, not two.
 */
describe('StreakLostModal', () => {
  const participation: StreakLossPayload = {
    type: 'participation',
    lostValue: 5,
    lostAt: '2026-03-10T12:00:00Z',
  };
  const play: StreakLossPayload = {
    type: 'play',
    lostValue: 3,
    lostAt: '2026-03-10T12:00:00Z',
    missedDays: ['2026-03-09'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('offers no betting call to action for a participation loss', () => {
    render(<StreakLostModal losses={[participation]} onClose={jest.fn()} />);

    expect(screen.queryByRole('button', { name: /prono/i })).toBeNull();
  });

  it('sends a participation loss to the races', async () => {
    // The streak is repaired by playing, so that is where the button goes.
    const onClose = jest.fn();
    render(<StreakLostModal losses={[participation]} onClose={onClose} />);

    await userEvent.click(
      screen.getByRole('button', { name: /jouer une course/i }),
    );

    expect(push).toHaveBeenCalledWith('/races');
    expect(onClose).toHaveBeenCalled();
  });

  it('sends a play loss to the races', async () => {
    render(<StreakLostModal losses={[play]} onClose={jest.fn()} />);

    await userEvent.click(
      screen.getByRole('button', { name: /jouer une course/i }),
    );

    expect(push).toHaveBeenCalledWith('/races');
  });

  it('shows one call to action when both streaks broke', () => {
    // Two buttons to the same place would be noise.
    render(
      <StreakLostModal losses={[participation, play]} onClose={jest.fn()} />,
    );

    expect(
      screen.getAllByRole('button', { name: /jouer une course/i }),
    ).toHaveLength(1);
  });

  it('never routes anywhere but /races', async () => {
    render(
      <StreakLostModal losses={[participation, play]} onClose={jest.fn()} />,
    );

    for (const button of screen.getAllByRole('button')) {
      await userEvent.click(button);
    }

    for (const [destination] of push.mock.calls as [string][]) {
      expect(destination).toBe('/races');
    }
  });

  it('holds no reference to the betting route in its source', () => {
    // A render test only covers the states it thinks to build.
    const source = readFileSync(
      join(__dirname, '..', 'StreakLostModal.tsx'),
      'utf8',
    );

    expect(source).not.toMatch(/["'`]\/betting/);
  });
});
