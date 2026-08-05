import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewTabs from '../ViewTabs';

/**
 * The shared in-page view switcher.
 *
 * Generalised from `PingpongViewTabs`, which was itself a copy of
 * `TimePeriodToggle`'s keyboard handling. Three near-identical controls is
 * the point where the copy stops being cheaper than the abstraction — and
 * the app is about to grow a fourth call site on the Mario Kart board.
 *
 * A `tablist`, not a radiogroup, and the distinction is not cosmetic. A
 * radiogroup filters one thing down; a tablist swaps between two different
 * things sharing a screen. A ranking and a history are two different things
 * — the history is not a subset of the board — and `tablist` is what tells
 * assistive tech an entire panel is about to be replaced.
 *
 * Deliberately NOT the shape `ProfileTabs` uses. That one finds its siblings
 * with a document-wide `querySelectorAll('[role="tab"]')`, so two tablists
 * on one page steal each other's arrow keys. With two call sites shipping
 * from this file, that bug would now be reachable in production.
 *
 * The `idPrefix` is what keeps those two call sites from colliding: both
 * would otherwise mint `panel-ranking`, and duplicate ids make
 * `aria-controls` point at whichever the browser saw first.
 */
describe('ViewTabs', () => {
  const VIEWS = [
    { id: 'ranking', label: 'Classement' },
    { id: 'history', label: 'Historique' },
  ] as const;

  function renderTabs(
    overrides: Partial<React.ComponentProps<typeof ViewTabs>> = {},
  ) {
    return render(
      <ViewTabs
        views={VIEWS}
        value="ranking"
        onChange={jest.fn()}
        idPrefix="demo"
        label="Vue"
        {...overrides}
      />,
    );
  }

  it('is a tablist, not a radiogroup', () => {
    renderTabs();

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders one tab per view', () => {
    renderTabs();

    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: /classement/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /historique/i })).toBeInTheDocument();
  });

  it('marks the current view selected', () => {
    renderTabs({ value: 'history' });

    expect(screen.getByRole('tab', { name: /historique/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('reports the view that was picked', async () => {
    const onChange = jest.fn();
    renderTabs({ onChange });

    await userEvent.click(screen.getByRole('tab', { name: /historique/i }));

    expect(onChange).toHaveBeenCalledWith('history');
  });

  it('names the group for assistive tech', () => {
    renderTabs({ label: 'Vue Mario Kart' });

    expect(screen.getByRole('tablist')).toHaveAccessibleName('Vue Mario Kart');
  });

  describe('ids', () => {
    it('points each tab at the panel it governs', () => {
      renderTabs();

      expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
        'aria-controls',
        'demo-panel-ranking',
      );
      expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
        'id',
        'demo-tab-ranking',
      );
    });

    it('namespaces ids per call site so two strips never collide', () => {
      // Both boards carry a 'ranking' view. Without the prefix both mint
      // `panel-ranking`, and a duplicate id makes aria-controls resolve to
      // whichever element the browser happened to see first.
      renderTabs({ idPrefix: 'mariokart' });

      expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
        'aria-controls',
        'mariokart-panel-ranking',
      );
    });
  });

  describe('keyboard', () => {
    it('is one tab stop, not one per tab', () => {
      renderTabs();

      expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
        'tabindex',
        '0',
      );
      expect(screen.getByRole('tab', { name: /historique/i })).toHaveAttribute(
        'tabindex',
        '-1',
      );
    });

    it('moves right with an arrow', async () => {
      const onChange = jest.fn();
      renderTabs({ onChange });

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(onChange).toHaveBeenCalledWith('history');
    });

    it('wraps around', async () => {
      const onChange = jest.fn();
      renderTabs({ onChange });

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(onChange).toHaveBeenCalledWith('history');
    });

    it('jumps to the ends with Home and End', async () => {
      const onChange = jest.fn();
      renderTabs({ onChange });

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{End}');
      expect(onChange).toHaveBeenLastCalledWith('history');

      onChange.mockClear();
      renderTabs({ onChange, value: 'history' });
      screen.getAllByRole('tab', { name: /historique/i })[1].focus();
      await userEvent.keyboard('{Home}');
      expect(onChange).toHaveBeenLastCalledWith('ranking');
    });

    it('moves focus with the selection', async () => {
      // Automatic activation: the arrow both selects and focuses, so the
      // next press moves on rather than repeating.
      renderTabs();

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: /historique/i })).toHaveFocus();
    });

    it('leaves other tablists on the page alone', async () => {
      // The ProfileTabs bug, which this component exists partly to avoid: a
      // document-wide querySelectorAll('[role="tab"]') makes every tablist
      // on the page one keyboard group. With two call sites shipping from
      // this file, one page can now hold two of them.
      render(
        <>
          <div role="tablist" aria-label="Un autre">
            <button role="tab" aria-selected="true" data-testid="foreign-tab">
              Ailleurs
            </button>
          </div>
          <ViewTabs
            views={VIEWS}
            value="ranking"
            onChange={jest.fn()}
            idPrefix="demo"
            label="Vue"
          />
        </>,
      );

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByTestId('foreign-tab')).not.toHaveFocus();
      expect(screen.getByRole('tab', { name: /historique/i })).toHaveFocus();
    });
  });
});
