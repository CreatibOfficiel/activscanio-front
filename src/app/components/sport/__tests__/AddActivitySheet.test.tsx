import { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddActivitySheet from '../AddActivitySheet';

/**
 * The bottom sheet offering the two entry screens.
 *
 * Built on the shared Modal rather than hand-rolled. Modal already owns the
 * portal, the scroll lock, ESC, the focus trap and focus restore — every one
 * of which was fixed there recently, and none of which a second implementation
 * would inherit those fixes. This component adds bottom anchoring and its two
 * links; the dialog contract below is Modal's, re-asserted here because this
 * is the surface a user actually meets it through.
 */
describe('AddActivitySheet', () => {
  it('renders nothing while closed', () => {
    render(<AddActivitySheet isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a dialog with an accessible name', () => {
    // Without one, a screen reader announces a dialog holding two links and
    // no statement of what is being chosen.
    render(<AddActivitySheet isOpen onClose={jest.fn()} />);

    expect(screen.getByRole('dialog')).toHaveAccessibleName();
  });

  it('offers exactly the two entry screens, as links', () => {
    render(<AddActivitySheet isOpen onClose={jest.fn()} />);

    const links = within(screen.getByRole('dialog')).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/races/add',
      '/pingpong/add',
    ]);
  });

  it('reports the choice so the parent can close', () => {
    const onClose = jest.fn();
    render(<AddActivitySheet isOpen onClose={onClose} />);

    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('link')[0]);

    expect(onClose).toHaveBeenCalled();
  });

  describe('focus', () => {
    it('moves focus inside on open', () => {
      // Otherwise focus stays on the trigger behind the backdrop and Tab
      // walks the page underneath the sheet.
      render(<AddActivitySheet isOpen onClose={jest.fn()} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('keeps Tab inside the sheet', async () => {
      const user = userEvent.setup();
      render(<AddActivitySheet isOpen onClose={jest.fn()} />);

      const dialog = screen.getByRole('dialog');
      const focusables = within(dialog).getAllByRole('link');
      focusables[focusables.length - 1].focus();

      await user.tab();

      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('returns focus to the trigger on close', async () => {
      // The user pressed a button at a known spot on screen; landing back on
      // document.body after closing loses that place entirely.
      const user = userEvent.setup();

      function Harness() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Ajouter</button>
            <AddActivitySheet isOpen={open} onClose={() => setOpen(false)} />
          </>
        );
      }

      render(<Harness />);
      const trigger = screen.getByRole('button', { name: 'Ajouter' });
      await user.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('closing', () => {
    it('closes on Escape', () => {
      const onClose = jest.fn();
      render(<AddActivitySheet isOpen onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes when the backdrop is pressed', () => {
      // Tapping away is how a phone user dismisses a sheet; the close button
      // is a fallback, not the route.
      const onClose = jest.fn();
      render(<AddActivitySheet isOpen onClose={onClose} />);

      const backdrop = screen.getByRole('presentation');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when the sheet body itself is pressed', () => {
      const onClose = jest.fn();
      render(<AddActivitySheet isOpen onClose={jest.fn()} />);

      fireEvent.click(screen.getByRole('dialog'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('locks the page behind it and releases on close', () => {
    const { rerender } = render(
      <AddActivitySheet isOpen onClose={jest.fn()} />,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<AddActivitySheet isOpen={false} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });
});
