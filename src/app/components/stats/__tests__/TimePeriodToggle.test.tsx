import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimePeriodToggle from '../TimePeriodToggle';

/**
 * Time period toggle.
 *
 * Shipped declaring role="radiogroup" with none of the keyboard behaviour
 * that role promises: every option was its own tab stop and arrows did
 * nothing. Assistive technology announces a radio group and tells the user
 * to expect arrow keys, so the role was a claim the component did not keep.
 *
 * These tests were added with the fix — the component had none.
 */
describe('TimePeriodToggle', () => {
  it('renders one radio per period', () => {
    render(<TimePeriodToggle value="month" onChange={jest.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the active period as checked', () => {
    render(<TimePeriodToggle value="year" onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /cette année/i })).toBeChecked();
  });

  it('reports the chosen period on click', async () => {
    const onChange = jest.fn();
    render(<TimePeriodToggle value="month" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: /tout le temps/i }));

    expect(onChange).toHaveBeenCalledWith('all');
  });

  describe('keyboard', () => {
    it('is a single tab stop', () => {
      render(<TimePeriodToggle value="month" onChange={jest.fn()} />);

      const radios = screen.getAllByRole('radio');
      const inTabOrder = radios.filter(
        (radio) => radio.getAttribute('tabindex') === '0',
      );
      expect(inTabOrder).toHaveLength(1);
    });

    it('puts the tab stop on the selected option', () => {
      render(<TimePeriodToggle value="all" onChange={jest.fn()} />);

      expect(
        screen.getByRole('radio', { name: /tout le temps/i }),
      ).toHaveAttribute('tabindex', '0');
    });

    it('moves forward on ArrowRight', async () => {
      const onChange = jest.fn();
      render(<TimePeriodToggle value="month" onChange={onChange} />);

      screen.getByRole('radio', { name: /cette saison/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(onChange).toHaveBeenCalledWith('year');
    });

    it('moves back on ArrowLeft', async () => {
      const onChange = jest.fn();
      render(<TimePeriodToggle value="year" onChange={onChange} />);

      screen.getByRole('radio', { name: /cette année/i }).focus();
      await userEvent.keyboard('{ArrowLeft}');

      expect(onChange).toHaveBeenCalledWith('month');
    });

    it('wraps from the last option to the first', async () => {
      const onChange = jest.fn();
      render(<TimePeriodToggle value="all" onChange={onChange} />);

      screen.getByRole('radio', { name: /tout le temps/i }).focus();
      await userEvent.keyboard('{ArrowRight}');

      expect(onChange).toHaveBeenCalledWith('month');
    });
  });
});
