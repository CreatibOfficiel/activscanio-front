import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Modal from '../Modal';

describe('Modal — accessible name', () => {
  it('uses the title as the accessible name', () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="Réglages">
        <p>content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Réglages');
  });

  it('honours an explicit ariaLabelledBy over the title element', () => {
    render(
      <>
        <h1 id="external-heading">Titre externe</h1>
        <Modal isOpen onClose={jest.fn()} ariaLabelledBy="external-heading">
          <p>content</p>
        </Modal>
      </>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Titre externe');
  });

  it('does not point at a missing element when there is no title', () => {
    render(
      <Modal isOpen onClose={jest.fn()}>
        <p>content</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    // Either absent, or pointing at an element that actually exists.
    if (labelledBy !== null) {
      expect(document.getElementById(labelledBy)).not.toBeNull();
    }
  });
});

describe('Modal — focus management', () => {
  it('does not steal focus when it has never been opened', async () => {
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'outside';
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);

    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Fermée">
        <p>content</p>
      </Modal>,
    );

    // A closed modal that was never opened must leave focus alone.
    expect(document.activeElement).toBe(outsideButton);
    outsideButton.remove();
  });

  it('restores focus to the trigger after being closed', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Ouvrir</button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Test">
            <p>content</p>
          </Modal>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Modal — focus trap', () => {
  it('skips disabled controls when wrapping focus', async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={jest.fn()} showCloseButton={false}>
        <button>premier</button>
        <button disabled>désactivé</button>
        <button>dernier</button>
      </Modal>,
    );

    const first = screen.getByRole('button', { name: 'premier' });
    const last = screen.getByRole('button', { name: 'dernier' });

    last.focus();
    expect(document.activeElement).toBe(last);

    // Tab from the last focusable control wraps to the first one.
    await user.tab();
    expect(document.activeElement).toBe(first);

    // Shift+Tab from the first wraps back to the last, never the disabled one.
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it('wraps focus when the last node in the DOM is not focusable', () => {
    // A hidden input sits last in the DOM. The naive selector treats it as the
    // trap's last element, so Tab from the real last control never wraps and
    // focus escapes the dialog.
    render(
      <Modal isOpen onClose={jest.fn()} showCloseButton={false}>
        <button>premier</button>
        <button>dernier</button>
        <input type="hidden" name="csrf" />
      </Modal>,
    );

    const first = screen.getByRole('button', { name: 'premier' });
    const last = screen.getByRole('button', { name: 'dernier' });

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('wraps focus when a disabled control sits last in the DOM', () => {
    render(
      <Modal isOpen onClose={jest.fn()} showCloseButton={false}>
        <button>premier</button>
        <button>dernier</button>
        <button disabled>désactivé</button>
      </Modal>,
    );

    const first = screen.getByRole('button', { name: 'premier' });
    const last = screen.getByRole('button', { name: 'dernier' });

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('does not crash when the modal holds no focusable element', () => {
    expect(() =>
      render(
        <Modal isOpen onClose={jest.fn()} showCloseButton={false}>
          <p>rien de focusable</p>
        </Modal>,
      ),
    ).not.toThrow();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Modal — closing behaviour', () => {
  it('calls onClose on Escape', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        <p>content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape when closeOnEsc is false', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test" closeOnEsc={false}>
        <p>content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('releases the scroll lock once closed', () => {
    const { rerender } = render(
      <Modal isOpen onClose={jest.fn()} title="Test">
        <p>content</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={jest.fn()} title="Test">
        <p>content</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });
});
