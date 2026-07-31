import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SportChoiceCards, { toSportPreference } from '../SportChoiceCards';

/**
 * Choosing which sports you follow.
 *
 * Two checkboxes, not three exclusive options. "Both" is not a thing the user
 * picks — it is what the backend column happens to call two boxes being
 * ticked. Modelling it as a third option forces an ordering question
 * ("Mario Kart / Ping-Pong / Les deux"?) that has no good answer, and makes
 * "I follow both" feel like a different kind of answer from "I follow one".
 *
 * The props are deliberately not typed as SportPreference: the union is a
 * storage detail, converted at the edge by toSportPreference.
 *
 * The keyboard contract is the part most likely to rot. role="checkbox"
 * requires Space, and the onboarding step this mirrors uses onKeyPress, which
 * React deprecated and which never fires for Space at all — so that step's
 * checkboxes cannot be toggled by the key their own role promises.
 */
describe('SportChoiceCards', () => {
  it('renders one checkbox per sport', () => {
    render(
      <SportChoiceCards marioKart pingpong={false} onChange={jest.fn()} />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('reflects which sports are followed', () => {
    render(
      <SportChoiceCards marioKart pingpong={false} onChange={jest.fn()} />,
    );

    expect(screen.getByRole('checkbox', { name: /mario kart/i })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /ping-pong/i }),
    ).not.toBeChecked();
  });

  it('has no "both" option', () => {
    // Two boxes ticked already means both. A third control would be a second
    // way to say the same thing, and the two could disagree.
    render(<SportChoiceCards marioKart pingpong onChange={jest.fn()} />);

    expect(screen.queryByRole('checkbox', { name: /les deux/i })).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  describe('reporting changes', () => {
    it('reports the full next state, not the box that moved', async () => {
      // The parent needs both values to derive a preference; handing it one
      // flag would make it reconstruct the other from a stale prop.
      const onChange = jest.fn();
      render(
        <SportChoiceCards marioKart pingpong={false} onChange={onChange} />,
      );

      await userEvent.click(screen.getByRole('checkbox', { name: /ping-pong/i }));

      expect(onChange).toHaveBeenCalledWith({ marioKart: true, pingpong: true });
    });

    it('reports unticking a box', async () => {
      const onChange = jest.fn();
      render(<SportChoiceCards marioKart pingpong onChange={onChange} />);

      await userEvent.click(screen.getByRole('checkbox', { name: /mario kart/i }));

      expect(onChange).toHaveBeenCalledWith({
        marioKart: false,
        pingpong: true,
      });
    });

    it('reports the empty state rather than swallowing it', async () => {
      // Whether "neither" is allowed is the caller's rule, not this
      // component's. Onboarding disables Continue; settings refuses the write.
      const onChange = jest.fn();
      render(
        <SportChoiceCards marioKart pingpong={false} onChange={onChange} />,
      );

      await userEvent.click(screen.getByRole('checkbox', { name: /mario kart/i }));

      expect(onChange).toHaveBeenCalledWith({
        marioKart: false,
        pingpong: false,
      });
    });
  });

  describe('keyboard', () => {
    it('toggles on Enter', async () => {
      const onChange = jest.fn();
      render(
        <SportChoiceCards marioKart pingpong={false} onChange={onChange} />,
      );

      screen.getByRole('checkbox', { name: /ping-pong/i }).focus();
      await userEvent.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith({ marioKart: true, pingpong: true });
    });

    it('toggles on Space', async () => {
      // The key role="checkbox" actually mandates. onKeyPress never fires for
      // it, which is why the onboarding step this mirrors is keyboard-broken.
      const onChange = jest.fn();
      render(
        <SportChoiceCards marioKart pingpong={false} onChange={onChange} />,
      );

      screen.getByRole('checkbox', { name: /ping-pong/i }).focus();
      await userEvent.keyboard(' ');

      expect(onChange).toHaveBeenCalledWith({ marioKart: true, pingpong: true });
    });

    it('does not scroll the page when Space toggles a box', async () => {
      // Space on a focused non-input scrolls unless prevented, so the answer
      // the user just gave would jump off screen.
      render(
        <SportChoiceCards marioKart pingpong={false} onChange={jest.fn()} />,
      );

      const box = screen.getByRole('checkbox', { name: /ping-pong/i });
      box.focus();

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      box.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('reaches both boxes with Tab', async () => {
      // Checkboxes are independent controls: unlike a radiogroup, each one is
      // its own tab stop.
      render(<SportChoiceCards marioKart pingpong onChange={jest.fn()} />);

      const [first, second] = screen.getAllByRole('checkbox');
      await userEvent.tab();
      expect(document.activeElement).toBe(first);
      await userEvent.tab();
      expect(document.activeElement).toBe(second);
    });
  });

  it('drives a controlled parent', async () => {
    // The whole contract in one pass: the parent owns the state, and both
    // boxes end up ticked without the component holding anything itself.
    function Harness() {
      const [value, setValue] = useState({ marioKart: true, pingpong: false });
      return <SportChoiceCards {...value} onChange={setValue} />;
    }

    render(<Harness />);
    await userEvent.click(screen.getByRole('checkbox', { name: /ping-pong/i }));

    expect(screen.getByRole('checkbox', { name: /mario kart/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /ping-pong/i })).toBeChecked();
  });
});

/**
 * The edge conversion.
 *
 * The backend column is 'mario-kart' | 'ping-pong' | 'both' — there is no
 * "neither". Callers must guard the empty case before calling this.
 */
describe('toSportPreference', () => {
  it('maps two ticks to both', () => {
    expect(toSportPreference({ marioKart: true, pingpong: true })).toBe('both');
  });

  it('maps a single tick to that sport', () => {
    expect(toSportPreference({ marioKart: true, pingpong: false })).toBe(
      'mario-kart',
    );
    expect(toSportPreference({ marioKart: false, pingpong: true })).toBe(
      'ping-pong',
    );
  });

  it('returns null for neither, rather than inventing a value', () => {
    // Returning 'both' here would silently turn "I want out of everything"
    // into "I want everything" — the exact opposite of the user's action.
    expect(toSportPreference({ marioKart: false, pingpong: false })).toBeNull();
  });
});
