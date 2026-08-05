import { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import BottomNav from '../BottomNav';
import {
  AddActivitySlotProvider,
  AddActivitySlot,
} from '../../../context/AddActivitySlotContext';

const mockPathname = jest.fn(() => '/');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

jest.mock('../../../context/SoundboardContext', () => ({
  useSoundboard: () => ({ state: { isUnlocked: false }, open: jest.fn() }),
}));

// The add control's own logic (sport preference, link-vs-sheet) is covered by
// AddActivityButton's suite. Here it only needs to be identifiable.
jest.mock('../../sport/AddActivityButton', () => ({
  __esModule: true,
  default: () => <button data-testid="add-activity">Ajouter</button>,
}));

/**
 * The bottom navigation.
 *
 * ONE TAB PER SPORT. Mario Kart used to hold two of the four entries —
 * Classement (/) and Courses (/races) — while ping-pong held one and switched
 * between its own ranking and match history with an in-page tablist. That was
 * the same information architecture expressed two different ways in one bar,
 * and the asymmetry was an accident of order: Mario Kart shipped first, alone,
 * when spending two of four slots on it cost nothing.
 *
 * It costs something now. A third sport would need a fifth and sixth slot, and
 * a four-item bar where two items are the same sport reads as though the app
 * is mostly Mario Kart. Both boards now behave identically: one tab, one
 * in-page selector for ranking-versus-history.
 *
 * The items are the same for everyone, whatever sport they follow. That is a
 * deliberate decision, not an oversight: `useSportPreference` defaults to
 * 'both' whenever the value is missing — signed out, a row written before the
 * column existed, or any moment while the request is in flight — and
 * `useCurrentUserData` fetches asynchronously from an empty cache on a cold
 * load. A preference-driven nav would paint three items, then drop to two a
 * few hundred milliseconds later, moving targets under a thumb already
 * reaching for them.
 *
 * The component had no tests. These were added with the ping-pong item.
 */
describe('BottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  const renderNav = (slot?: ReactNode) =>
    render(
      <AddActivitySlotProvider>
        <BottomNav />
        {slot}
      </AddActivitySlotProvider>,
    );

  const labels = () =>
    screen.getAllByRole('link').map((link) => link.textContent?.trim());

  it('offers one entry per sport, plus the profile', () => {
    renderNav();

    expect(labels()).toEqual(['Mario Kart', 'Ping-Pong', 'Profil']);
  });

  it('gives Mario Kart a single tab rather than two', () => {
    // The whole point of the restructure. /races is still a working URL, but
    // it is no longer a peer of the board in the nav — it is a panel inside
    // it, reached by the in-page selector.
    renderNav();

    expect(screen.queryByRole('link', { name: /^courses$/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /^classement$/i })).toBeNull();
    expect(screen.getByRole('link', { name: /mario kart/i })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('marks the Mario Kart tab active on the races route', () => {
    // Someone arriving on /races from an old link or a bookmark must still
    // see which section they are in. Without activePaths the bar would show
    // no active tab at all on a route the app still serves.
    mockPathname.mockReturnValue('/races');
    renderNav();

    expect(screen.getByRole('link', { name: /mario kart/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('links ping-pong to its own board', () => {
    renderNav();

    expect(screen.getByRole('link', { name: /ping-pong/i })).toHaveAttribute(
      'href',
      '/pingpong',
    );
  });

  it('marks the ping-pong tab active on its board', () => {
    mockPathname.mockReturnValue('/pingpong');
    renderNav();

    expect(screen.getByRole('link', { name: /ping-pong/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps the ping-pong tab active deeper in its section', () => {
    // Without activePaths, isActiveRoute only matches an exact path, so the
    // tab would go dark inside its own section.
    mockPathname.mockReturnValue('/pingpong/players/abc');
    renderNav();

    expect(screen.getByRole('link', { name: /ping-pong/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('does not mark ping-pong active on the Mario Kart board', () => {
    mockPathname.mockReturnValue('/');
    renderNav();

    expect(screen.getByRole('link', { name: /ping-pong/i })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('does not mark Mario Kart active on the ping-pong board', () => {
    // The mirror of the above, and the failure mode the '/' href invites: a
    // prefix match on '/' would light Mario Kart up on every route in the app.
    mockPathname.mockReturnValue('/pingpong');
    renderNav();

    expect(
      screen.getByRole('link', { name: /mario kart/i }),
    ).not.toHaveAttribute('aria-current');
  });

  it('hides itself inside the match entry flow', () => {
    // A task flow, like /races/add: the chrome gets out of the way.
    mockPathname.mockReturnValue('/pingpong/add');
    const { container } = renderNav();

    expect(container).toBeEmptyDOMElement();
  });

  it('still hides itself inside the race entry flow', () => {
    mockPathname.mockReturnValue('/races/add');
    const { container } = renderNav();

    expect(container).toBeEmptyDOMElement();
  });

  it('gives every tab a visible keyboard focus ring', () => {
    // The only navigation in the app that had none. A keyboard or
    // switch-control user tabbing through the bar could not tell which entry
    // they were on, and the browser default outline is suppressed by the
    // surrounding styles. Matches the sidebar's treatment.
    mockPathname.mockReturnValue('/');
    renderNav();

    for (const link of screen.getAllByRole('link')) {
      expect(link.className).toMatch(/focus-visible:ring-2/);
    }
  });

  /**
   * The add control moved off the page and into the bar.
   *
   * It used to be a FAB anchored bottom-right, floating over whatever list was
   * underneath — which on the two screens that mount it (race history, match
   * history) meant permanently covering the end of a row. Anchoring it to the
   * bar fixes that and fits the odd tab count the restructure produced.
   *
   * It straddles the bar's top edge: a little over half its height protrudes
   * above, the rest sits within. That is what makes it read as the bar's
   * primary action rather than a fourth tab.
   *
   * Structurally it is a SIBLING of the bar, not a child. The bar is
   * `overflow-hidden` — it has to be, the rounded corners clip the active-tab
   * highlight — and a protruding child would be sliced off at the top edge.
   * Fighting that clip means dropping the corner treatment on every tab to
   * accommodate one button. So the button lives in the same fixed wrapper,
   * absolutely positioned over the bar's centre, and the three tabs space
   * themselves evenly underneath as though it were not there.
   *
   * It stays gated. Both boards suppress it on an empty board, where a central
   * call to action takes over and two prompts to do the same thing would be
   * one too many. That gate is page knowledge — no route can tell whether a
   * board came back empty — so the pages keep control of it through a context
   * slot and the bar merely renders whatever they put there.
   */
  describe('add control', () => {
    it('shows no add control by default', () => {
      // Most routes are not boards. The bar must not invent an add button on
      // the profile or the achievements list.
      renderNav();

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });

    it('renders the control a page asks for', () => {
      renderNav(<AddActivitySlot />);

      expect(screen.getByTestId('add-activity')).toBeInTheDocument();
    });

    it('keeps it out of the clipped bar so the protrusion survives', () => {
      // The bar clips its children to its rounded corners. A button meant to
      // stick out above the top edge cannot be inside it, or the top half is
      // simply not drawn — and it would fail silently, looking merely small.
      renderNav(<AddActivitySlot />);

      const bar = screen.getByRole('navigation');
      expect(bar.className).toMatch(/overflow-hidden/);
      expect(
        bar.contains(screen.getByTestId('add-activity')),
      ).toBe(false);
    });

    it('centres it horizontally over the bar', () => {
      renderNav(<AddActivitySlot />);

      const holder = screen.getByTestId('add-activity-slot');
      expect(holder.className).toMatch(/left-1\/2/);
      expect(holder.className).toMatch(/-translate-x-1\/2/);
    });

    it('is not announced as a navigation link', () => {
      // It opens a form or a dialog; it does not move between sections. A
      // fourth link in the landmark would tell a screen-reader user the app
      // has four destinations when it has three.
      renderNav(<AddActivitySlot />);

      const nav = screen.getByRole('navigation');
      expect(within(nav).getAllByRole('link')).toHaveLength(3);
    });

    it('disappears again when the page withdraws it', () => {
      // Navigating from a board to the profile must take the button with it.
      const { rerender } = renderNav(<AddActivitySlot />);
      expect(screen.getByTestId('add-activity')).toBeInTheDocument();

      rerender(
        <AddActivitySlotProvider>
          <BottomNav />
        </AddActivitySlotProvider>,
      );

      expect(screen.queryByTestId('add-activity')).not.toBeInTheDocument();
    });
  });
});
