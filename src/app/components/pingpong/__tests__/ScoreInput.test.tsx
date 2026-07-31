import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScoreInput from '../ScoreInput';

/**
 * A single set score field.
 *
 * Three findings from the research shape this component.
 *
 * `type="text"` with `inputmode="numeric"`, not `type="number"` — GOV.UK
 * documents why they switched: scroll wheels silently change values, NVDA
 * announces an unlabelled spin button, and Chrome discards letters without
 * telling anyone.
 *
 * Select-on-focus, because Baymard watched someone try to change 1 to 2 and
 * get 21: the field was not cleared, so the digit appended. Scores are one
 * or two digits, so that is exactly the failure mode here.
 *
 * No steppers. NN/g's criterion is distributional — steppers suit a field
 * with one common value and small deviations. Tapping + eleven times is the
 * opposite of that.
 */
describe('ScoreInput', () => {
  it('uses a numeric keypad without being a number input', () => {
    render(<ScoreInput label="Set 1, joueur A" value="" onChange={jest.fn()} />);

    const input = screen.getByLabelText('Set 1, joueur A');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('carries an accessible name', () => {
    // Two bare boxes side by side tell a screen reader nothing about which
    // player each belongs to.
    render(<ScoreInput label="Set 2, joueur B" value="7" onChange={jest.fn()} />);

    expect(screen.getByLabelText('Set 2, joueur B')).toBeInTheDocument();
  });

  it('selects the existing value on focus', async () => {
    // So typing replaces rather than appends: the 1 → 21 trap.
    render(<ScoreInput label="Score" value="11" onChange={jest.fn()} />);

    const input = screen.getByLabelText<HTMLInputElement>('Score');
    await userEvent.click(input);

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
  });

  it('reports digits as they are typed', async () => {
    const onChange = jest.fn();
    render(<ScoreInput label="Score" value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Score'), '9');

    expect(onChange).toHaveBeenCalledWith('9');
  });

  it('ignores letters', async () => {
    // Chrome drops them silently on type="number"; here we drop them
    // deliberately, so the field never holds something unparseable.
    const onChange = jest.fn();
    render(<ScoreInput label="Score" value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Score'), 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores a third digit', async () => {
    // No table tennis set reaches 100. Capping stops a stray keypress from
    // producing a score the API will reject.
    const onChange = jest.fn();
    render(<ScoreInput label="Score" value="11" onChange={onChange} />);

    const input = screen.getByLabelText('Score');
    await userEvent.type(input, '5', {
      initialSelectionStart: 2,
      initialSelectionEnd: 2,
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows clearing the field', async () => {
    // An empty field is not zero. Blocking deletion would strand someone
    // who mistyped.
    const onChange = jest.fn();
    render(<ScoreInput label="Score" value="9" onChange={onChange} />);

    await userEvent.clear(screen.getByLabelText('Score'));

    expect(onChange).toHaveBeenCalledWith('');
  });

  describe('invalid state', () => {
    it('marks the field invalid for assistive tech', () => {
      render(
        <ScoreInput label="Score" value="12" onChange={jest.fn()} invalid />,
      );

      expect(screen.getByLabelText('Score')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    it('is not invalid by default', () => {
      render(<ScoreInput label="Score" value="11" onChange={jest.fn()} />);

      expect(screen.getByLabelText('Score')).toHaveAttribute(
        'aria-invalid',
        'false',
      );
    });
  });
});
