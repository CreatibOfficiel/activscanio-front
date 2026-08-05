'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Where the dialog sits.
   *
   * 'sheet' anchors it to the bottom edge, full-width, for thumb reach on a
   * phone. Positioning only: the portal, scroll lock, ESC, focus trap and
   * focus restore are identical, which is the reason this is a variant here
   * rather than a second component that would not inherit their fixes.
   */
  placement?: 'center' | 'sheet';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  placement = 'center',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = '',
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full min-h-screen',
  };

  // Handle mount (for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Handle scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Lock scroll
      document.body.style.overflow = 'hidden';

      // Focus modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Focus trap
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return;

        // Skip disabled and hidden controls: if the last node in the DOM is
        // not actually focusable, the wrap never triggers and focus escapes
        // the dialog.
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = '';
      };
    } else {
      // Unlock scroll
      document.body.style.overflow = '';

      // Restore previous focus. Guarded so this branch, which also runs on the
      // very first render of a closed modal, only acts after a real open —
      // and never on a node that has since been unmounted.
      const previous = previousFocusRef.current;
      previousFocusRef.current = null;
      if (previous && document.contains(previous)) {
        // `preventScroll` matters: the body carried `overflow: hidden` while
        // the modal was open, so the browser's scroll position for the
        // restored element is stale. Without it, focusing a row near the top
        // of a long leaderboard scrolls the page down by a row or two on
        // close — the reader is moved without asking. Focus still lands
        // correctly for keyboard users; only the scrolling is suppressed.
        previous.focus({ preventScroll: true });
      }
    }
    // `mounted` is a dependency because the portal does not exist on the first
    // render: for a modal rendered with isOpen already true, this effect first
    // runs while modalRef is still null, so the focus call is a no-op and
    // focus stays on document.body — outside a trap that is nonetheless armed,
    // which lets Tab walk the page behind the backdrop. Re-running once the
    // portal mounts is what actually moves focus in. Modals opened after mount
    // were unaffected, which is why this survived so long.
  }, [isOpen, mounted]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const isSheet = placement === 'sheet';

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 animate-fadeIn ${
        isSheet ? 'items-end' : 'items-center p-4'
      }`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy ?? (title ? 'modal-title' : undefined)}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`
          relative w-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08]
          shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-slideUp
          ${
            isSheet
              ? 'rounded-t-2xl border-b-0 max-h-[85vh] pb-[env(safe-area-inset-bottom)]'
              : `rounded-2xl ${sizes[size]} ${size !== 'full' ? 'max-h-[90vh]' : ''}`
          }
          ${className}
        `}
        style={{
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-700">
            {title && (
              <h2 id="modal-title" className="text-heading text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/80 hover:border-neutral-600 transition-all duration-200 shadow-sm group"
                aria-label="Fermer la modal"
              >
                <MdClose className="text-xl transition-transform duration-200 group-hover:rotate-90" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`p-4 sm:p-6 overflow-y-auto overscroll-contain ${
            isSheet ? 'max-h-[calc(85vh-140px)]' : 'max-h-[calc(90vh-140px)]'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
