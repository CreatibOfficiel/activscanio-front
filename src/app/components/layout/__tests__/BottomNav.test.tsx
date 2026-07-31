import { render, screen } from '@testing-library/react';
import BottomNav from '../BottomNav';

const mockPathname = jest.fn(() => '/');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

jest.mock('../../../context/SoundboardContext', () => ({
  useSoundboard: () => ({ state: { isUnlocked: false }, open: jest.fn() }),
}));

/**
 * The bottom navigation.
 *
 * The items are the same for everyone, whatever sport they follow. That is a
 * deliberate decision, not an oversight: `useSportPreference` defaults to
 * 'both' whenever the value is missing — signed out, a row written before
 * the column existed, or any moment while the request is in flight — and
 * `useCurrentUserData` fetches asynchronously from an empty cache on a cold
 * load. A preference-driven nav would therefore paint four items, then drop
 * to three a few hundred milliseconds later, moving targets under a thumb
 * already reaching for them.
 *
 * The component had no tests. These were added with the ping-pong item.
 */
describe('BottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  const labels = () =>
    screen.getAllByRole('link').map((link) => link.textContent?.trim());

  it('offers a route for each of the four sections', () => {
    render(<BottomNav />);

    expect(labels()).toEqual([
      'Classement',
      'Courses',
      'Ping-Pong',
      'Profil',
    ]);
  });

  it('links ping-pong to its own board', () => {
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: /ping-pong/i })).toHaveAttribute(
      'href',
      '/pingpong',
    );
  });

  it('marks the ping-pong tab active on its board', () => {
    mockPathname.mockReturnValue('/pingpong');
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: /ping-pong/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps the ping-pong tab active inside the match list', () => {
    // Without activePaths, isActiveRoute only matches an exact path, so the
    // tab would go dark inside its own section.
    mockPathname.mockReturnValue('/pingpong/matches');
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: /ping-pong/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('does not mark ping-pong active on the Mario Kart board', () => {
    mockPathname.mockReturnValue('/');
    render(<BottomNav />);

    expect(screen.getByRole('link', { name: /ping-pong/i })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('hides itself inside the match entry flow', () => {
    // A task flow, like /races/add: the chrome gets out of the way.
    mockPathname.mockReturnValue('/pingpong/add');
    const { container } = render(<BottomNav />);

    expect(container).toBeEmptyDOMElement();
  });

  it('still hides itself inside the race entry flow', () => {
    mockPathname.mockReturnValue('/races/add');
    const { container } = render(<BottomNav />);

    expect(container).toBeEmptyDOMElement();
  });
});
