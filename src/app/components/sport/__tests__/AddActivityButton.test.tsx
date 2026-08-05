import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddActivityButton from '../AddActivityButton';
import { useSportPreference } from '../../../hooks/useSportPreference';

jest.mock('../../../hooks/useSportPreference');

const mockedPreference = useSportPreference as jest.MockedFunction<
  typeof useSportPreference
>;

/**
 * The add-activity control.
 *
 * Its shape follows from how many sports the user follows, and the two shapes
 * are genuinely different controls rather than one control with a branch:
 *
 * - One sport: a link straight to that sport's entry screen. There is nothing
 *   to choose, so a sheet asking would be a dialog with one answer.
 * - Both sports: a button opening a bottom sheet with the two destinations.
 *
 * Not a speed-dial FAB. Two actions sits below MUI's own documented three-to-
 * six floor for the pattern, and Material 3's Compose guidance dropped speed
 * dial entirely. A sheet also keeps the targets thumb-height on a phone,
 * which stacked mini-FABs do not.
 *
 * Both destinations are links in both modes. They navigate, so middle-click,
 * long-press and "open in new tab" have to work; a button with router.push
 * silently breaks all three.
 */
describe('AddActivityButton', () => {
  /**
   * Where the control sits is not decoration — it is the whole difference
   * between the two variants, and it broke in production without a single
   * test noticing. `relative` sat in the shared base string, and Tailwind
   * resolves conflicting utilities by their order in the STYLESHEET, not in
   * the class attribute, so it beat the `fixed` the floating variant
   * appended. The button rendered in the flow at the top of the page,
   * underneath Safari's own chrome, on both boards.
   *
   * Asserting on class names is usually a smell. Here the class IS the
   * behaviour: nothing else in jsdom can observe that an element is pinned
   * above the nav rather than sitting in the document flow.
   */
  describe('where each variant sits', () => {
    it('pins the floating variant above the nav, bottom right', () => {
      givenSports(['ping-pong']);
      render(<AddActivityButton variant="floating" />);

      const control = screen.getByRole('link');
      expect(control).toHaveClass('fixed');
      expect(control).toHaveClass('right-6');
      // The one that regressed: a stray `relative` anywhere in the string
      // takes the element out of fixed positioning.
      expect(control).not.toHaveClass('relative');
    });

    it('leaves the nav variant in the flow, for the bar to place', () => {
      givenSports(['ping-pong']);
      render(<AddActivityButton variant="nav" />);

      const control = screen.getByRole('link');
      expect(control).not.toHaveClass('fixed');
      // `relative` is load-bearing here: the glow is a -z-10 layer behind it.
      expect(control).toHaveClass('relative');
    });
  });

  function givenSports(
    sports: Array<'mario-kart' | 'ping-pong'>,
    loading = false,
  ) {
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
      loading,
      saving: false,
      change: jest.fn(),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('following one sport', () => {
    it('is a link straight to the Mario Kart entry screen', () => {
      givenSports(['mario-kart']);

      render(<AddActivityButton />);

      expect(screen.getByRole('link')).toHaveAttribute('href', '/races/add');
    });

    it('is a link straight to the ping-pong entry screen', () => {
      givenSports(['ping-pong']);

      render(<AddActivityButton />);

      expect(screen.getByRole('link')).toHaveAttribute('href', '/pingpong/add');
    });

    it('names the destination sport', () => {
      // A generic "Ajouter" would cost exactly what the direct link gained:
      // the user knowing where the control goes before pressing it.
      givenSports(['ping-pong']);

      render(<AddActivityButton />);

      expect(screen.getByRole('link')).toHaveAccessibleName(/ping-pong/i);
    });

    it('opens no dialog when pressed', async () => {
      givenSports(['mario-kart']);

      render(<AddActivityButton />);
      await userEvent.click(screen.getByRole('link'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('never mounts the sheet', () => {
      // Not merely hidden: an unopened sheet in the tree still costs a portal
      // and a keydown listener on every screen the button appears on.
      givenSports(['mario-kart']);

      render(<AddActivityButton />);

      expect(screen.queryByTestId('add-activity-sheet')).not.toBeInTheDocument();
    });
  });

  describe('following both sports', () => {
    it('is a button, not a link', () => {
      // It has two destinations, so it has none of its own.
      givenSports(['mario-kart', 'ping-pong']);

      render(<AddActivityButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('carries a name that promises a choice', () => {
      givenSports(['mario-kart', 'ping-pong']);

      render(<AddActivityButton />);

      const name = screen.getByRole('button').getAttribute('aria-label') ?? '';
      expect(name).toMatch(/ajouter/i);
      // It must not claim a single sport it is not going to.
      expect(name).not.toMatch(/mario kart|ping-pong/i);
    });

    it('differs in accessible name from the single-sport variant', () => {
      givenSports(['mario-kart', 'ping-pong']);
      const { unmount } = render(<AddActivityButton />);
      const bothName = screen.getByRole('button').getAttribute('aria-label');
      unmount();

      givenSports(['mario-kart']);
      render(<AddActivityButton />);
      const singleName = screen.getByRole('link').getAttribute('aria-label');

      expect(bothName).not.toBe(singleName);
    });

    it('opens a dialog offering exactly the two entry screens', async () => {
      givenSports(['mario-kart', 'ping-pong']);

      render(<AddActivityButton />);
      await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

      const dialog = screen.getByRole('dialog');
      const links = within(dialog).getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links.map((l) => l.getAttribute('href'))).toEqual([
        '/races/add',
        '/pingpong/add',
      ]);
    });

    it('offers choices as links, not buttons', async () => {
      // They navigate. Middle-click, long-press and cmd-click must work, and
      // a button with router.push breaks all three silently.
      givenSports(['mario-kart', 'ping-pong']);

      render(<AddActivityButton />);
      await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getAllByRole('link')).toHaveLength(2);
      expect(within(dialog).queryByRole('button', { name: /course/i })).toBeNull();
      expect(within(dialog).queryByRole('button', { name: /match/i })).toBeNull();
    });

    it('labels each choice with its sport', async () => {
      givenSports(['mario-kart', 'ping-pong']);

      render(<AddActivityButton />);
      await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

      const dialog = screen.getByRole('dialog');
      expect(
        within(dialog).getByRole('link', { name: /course|mario kart/i }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole('link', { name: /match|ping-pong/i }),
      ).toBeInTheDocument();
    });

    it('closes the sheet once a choice is taken', async () => {
      // The sheet must not still be sitting there when the user comes back
      // from the entry screen.
      givenSports(['mario-kart', 'ping-pong']);

      render(<AddActivityButton />);
      await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));
      await userEvent.click(
        within(screen.getByRole('dialog')).getAllByRole('link')[0],
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('while the preference is still loading', () => {
    /**
     * The hook answers 'both' while in flight, which is right for a
     * leaderboard — showing a sport someone ignores beats hiding one they
     * play. It is wrong here.
     *
     * Rendering the both-sports button during the load means the control
     * offers a choice, then becomes a direct link to a different destination
     * once the real value lands. On a phone that swap happens under a thumb
     * already travelling toward the target. Rendering nothing costs a few
     * hundred milliseconds; guessing costs a wrong screen the user has to
     * back out of.
     */
    it('renders no control at all', () => {
      givenSports(['mario-kart', 'ping-pong'], true);

      render(<AddActivityButton />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('renders no control even when the loaded value would be a single sport', () => {
      givenSports(['ping-pong'], true);

      render(<AddActivityButton />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('appears once the preference resolves', () => {
      givenSports(['ping-pong'], true);
      const { rerender } = render(<AddActivityButton />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();

      givenSports(['ping-pong'], false);
      rerender(<AddActivityButton />);

      expect(screen.getByRole('link')).toHaveAttribute('href', '/pingpong/add');
    });
  });
});
