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

        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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
      };
    } else {
      // Unlock scroll
      document.body.style.overflow = '';

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || title ? 'modal-title' : undefined}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`
          relative w-full bg-neutral-800 border border-neutral-700 rounded-2xl
          shadow-2xl overflow-hidden animate-slideUp
          ${sizes[size]}
          ${size !== 'full' ? 'max-h-[90vh]' : ''}
          ${className}
        `}
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
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 transition-colors"
                aria-label="Fermer la modal"
              >
                <MdClose className="text-2xl" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
