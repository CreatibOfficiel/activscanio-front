import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongViewTabs from '../PingpongViewTabs';

/**
 * The Classement / Matchs switch.
 *
 * A `tablist`, not a radiogroup. The two are easy to confuse and the
 * difference is what the control does: a radiogroup filters one thing, a
 * tablist swaps between two different things that share a screen. A ranking
 * and a match history are two different things — the second is not a subset
 * of the first — and `tablist` is the role that tells assistive tech a whole
 * panel is about to be replaced.
 *
 * The keyboard shape follows `TimePeriodToggle`: one tab stop for the whole
 * strip, arrows to move between tabs, focus driven by a ref array.
 *
 * Deliberately NOT the shape `ProfileTabs` uses. That one finds its siblings
 * with a document-wide `querySelectorAll('[role="tab"]')`, so two tablists
 * on one page steal each other's arrow keys. The rest of the app is free to
 * grow a second one.
 */
describe('PingpongViewTabs', () => {
  it('is a tablist, not a radiogroup', () => {
    render(<PingpongViewTabs value="ranking" onChange={jest.fn()} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('offers the two views', () => {
    render(<PingpongViewTabs value="ranking" onChange={jest.fn()} />);

    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: /classement/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /matchs/i })).toBeInTheDocument();
  });

  it('marks the current view selected', () => {
    render(<PingpongViewTabs value="matches" onChange={jest.fn()} />);

    expect(screen.getByRole('tab', { name: /matchs/i })).toHaveAttribute(
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
    render(<PingpongViewTabs value="ranking" onChange={onChange} />);

    await userEvent.click(screen.getByRole('tab', { name: /matchs/i }));

    expect(onChange).toHaveBeenCalledWith('matches');
  });

  it('points each tab at its panel', () => {
    // Without aria-controls a screen reader has no way to find the panel a
    // tab governs.
    render(<PingpongViewTabs value="ranking" onChange={jest.fn()} />);

    expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
      'aria-controls',
    );
  });

  describe('keyboard', () => {
    it('is one tab stop, not two', () => {
      // The WAI-ARIA pattern the role promises: Tab enters the strip once
      // and arrows move within it.
      render(<PingpongViewTabs value="ranking" onChange={jest.fn()} />);

      expect(screen.getByRole('tab', { name: /classement/i })).toHaveAttribute(
        'tabindex',
        '0',
      );
      expect(screen.getByRole('tab', { name: /matchs/i })).toHaveAttribute(
        'tabindex',
        '-1',
      );
    });

    it('moves right with an arrow', async () => {
      const onChange = jest.fn();
      render(<PingpongViewTabs value="ranking" onChange={onChange} />);

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(onChange).toHaveBeenCalledWith('matches');
    });

    it('wraps around', async () => {
      const onChange = jest.fn();
      render(<PingpongViewTabs value="ranking" onChange={onChange} />);

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(onChange).toHaveBeenCalledWith('matches');
    });

    it('jumps to the ends with Home and End', async () => {
      const onChange = jest.fn();
      render(<PingpongViewTabs value="ranking" onChange={onChange} />);

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{End}');
      expect(onChange).toHaveBeenLastCalledWith('matches');

      onChange.mockClear();
      screen.getByRole('tab', { name: /matchs/i }).focus();
      await userEvent.keyboard('{Home}');
      expect(onChange).toHaveBeenLastCalledWith('ranking');
    });

    it('moves focus with the selection', async () => {
      // Automatic activation: the arrow both selects and focuses, so the
      // next arrow press moves on rather than repeating.
      const onChange = jest.fn();
      render(<PingpongViewTabs value="ranking" onChange={onChange} />);

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: /matchs/i })).toHaveFocus();
    });

    it('leaves other tablists on the page alone', async () => {
      // The bug this component was written to avoid: a document-wide
      // querySelectorAll('[role="tab"]') makes every tablist on the page one
      // keyboard group, so arrows in one move focus into another.
      const onChange = jest.fn();
      render(
        <>
          <div role="tablist" aria-label="Un autre">
            <button role="tab" aria-selected="true" data-testid="foreign-tab">
              Ailleurs
            </button>
          </div>
          <PingpongViewTabs value="ranking" onChange={onChange} />
        </>,
      );

      screen.getByRole('tab', { name: /classement/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByTestId('foreign-tab')).not.toHaveFocus();
      expect(screen.getByRole('tab', { name: /matchs/i })).toHaveFocus();
    });
  });
});
