import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SportSwitcher from '../SportSwitcher';

/**
 * Sport switcher.
 *
 * A radiogroup, not a tablist. Tabs assert that the panels below are facets
 * of one thing; two ELO ratings that are never comparable are two datasets,
 * and picking one is a filter. The APG radio pattern covers exactly this —
 * "mutually exclusive checkable buttons" — and needs far less wiring than
 * tabs, which would also require aria-controls and role="tabpanel" plumbing
 * that has to stay correct.
 *
 * The keyboard behaviour is the part worth testing: under the APG radio
 * pattern the whole group is ONE tab stop and arrows move between options.
 * The existing TimePeriodToggle claims role="radiogroup" without any of it,
 * which makes the role a promise the component does not keep.
 */
describe('SportSwitcher', () => {
  it('renders one radio per sport', () => {
    render(<SportSwitcher value="mario-kart" onChange={jest.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('marks the active sport as checked', () => {
    render(<SportSwitcher value="ping-pong" onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /ping-pong/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /mario kart/i })).not.toBeChecked();
  });

  it('is a radiogroup, not a tablist', () => {
    render(<SportSwitcher value="mario-kart" onChange={jest.fn()} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('carries a group label', () => {
    // Without one a screen reader announces two radios with no idea what
    // they are choosing between.
    render(<SportSwitcher value="mario-kart" onChange={jest.fn()} />);

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName();
  });

  it('reports the chosen sport on click', async () => {
    const onChange = jest.fn();
    render(<SportSwitcher value="mario-kart" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /ping-pong/i }));

    expect(onChange).toHaveBeenCalledWith('ping-pong');
  });

  it('does not fire when the active sport is clicked again', async () => {
    // Re-selecting is a no-op; firing would refetch the same board.
    const onChange = jest.fn();
    render(<SportSwitcher value="mario-kart" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /mario kart/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  describe('keyboard', () => {
    it('is a single tab stop', async () => {
      // The APG radio pattern: Tab enters the group, arrows move within it.
      // Two tab stops would make a filter cost two keystrokes to skip.
      render(<SportSwitcher value="mario-kart" onChange={jest.fn()} />);

      const [first, second] = screen.getAllByRole('radio');
      expect(first).toHaveAttribute('tabindex', '0');
      expect(second).toHaveAttribute('tabindex', '-1');
    });

    it('moves the tab stop with the selection', async () => {
      render(<SportSwitcher value="ping-pong" onChange={jest.fn()} />);

      const [first, second] = screen.getAllByRole('radio');
      expect(second).toHaveAttribute('tabindex', '0');
      expect(first).toHaveAttribute('tabindex', '-1');
    });

    it('selects the next sport on ArrowRight', async () => {
      const onChange = jest.fn();
      render(<SportSwitcher value="mario-kart" onChange={onChange} />);

      screen.getByRole('radio', { name: /mario kart/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(onChange).toHaveBeenCalledWith('ping-pong');
    });

    it('selects the previous sport on ArrowLeft', async () => {
      const onChange = jest.fn();
      render(<SportSwitcher value="ping-pong" onChange={onChange} />);

      screen.getByRole('radio', { name: /ping-pong/i }).focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(onChange).toHaveBeenCalledWith('mario-kart');
    });

    it('wraps around at the ends', async () => {
      // APG: the group is circular, so arrowing past the last option
      // returns to the first rather than dead-ending.
      const onChange = jest.fn();
      render(<SportSwitcher value="ping-pong" onChange={onChange} />);

      screen.getByRole('radio', { name: /ping-pong/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(onChange).toHaveBeenCalledWith('mario-kart');
    });

    it('treats ArrowDown like ArrowRight', async () => {
      const onChange = jest.fn();
      render(<SportSwitcher value="mario-kart" onChange={onChange} />);

      screen.getByRole('radio', { name: /mario kart/i }).focus();
      await userEvent.keyboard('{ArrowDown}');

      expect(onChange).toHaveBeenCalledWith('ping-pong');
    });
  });

  it('accepts a restricted sport list', () => {
    // A user who follows one sport gets no switcher at all — the parent
    // decides that. But the component must not assume two either.
    render(
      <SportSwitcher
        value="ping-pong"
        sports={['ping-pong']}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });
});
