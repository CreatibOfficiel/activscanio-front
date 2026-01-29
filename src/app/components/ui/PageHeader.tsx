'use client';

import { FC, ReactNode } from 'react';
import Link from 'next/link';
import { MdArrowBack } from 'react-icons/md';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** If defined, shows a back button linking to this URL */
  backHref?: string;
  /** Label for back button (default: "Retour") */
  backLabel?: string;
  /** Optional CTA or action element on the right */
  rightAction?: ReactNode;
  /** Header variant: hub (centered, no back), detail (inline with back), flow (task flow) */
  variant?: 'hub' | 'detail' | 'flow';
  /** Progress indicator for flow variant */
  progress?: { current: number; total: number };
  /** Additional className */
  className?: string;
}

/**
 * Standardized page header component for consistent UX across the app.
 *
 * Variants:
 * - hub: Large centered title, no back button (for main pages like /betting, /races, /profile)
 * - detail: Back button + inline title + optional right CTA (for sub-pages like /betting/history)
 * - flow: Back button + inline title + optional progress bar (for task flows like /betting/place-bet)
 */
const PageHeader: FC<PageHeaderProps> = ({
  title,
  subtitle,
  backHref,
  backLabel = 'Retour',
  rightAction,
  variant = 'detail',
  progress,
  className = '',
}) => {
  // Hub variant: centered title, no back button
  if (variant === 'hub') {
    return (
      <header className={`mb-6 ${className}`}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-neutral-400 text-sm text-center mt-1">{subtitle}</p>
        )}
      </header>
    );
  }

  // Flow variant: back button, inline title, optional progress bar
  if (variant === 'flow') {
    return (
      <header className={`mb-6 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back button */}
          <div className="flex items-center gap-3 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
                aria-label={backLabel}
              >
                <MdArrowBack className="w-5 h-5" />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-neutral-400 text-sm truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right: Action or progress text */}
          <div className="flex items-center gap-2 shrink-0">
            {progress && (
              <span className="text-sm font-medium text-neutral-400">
                {progress.current}/{progress.total}
              </span>
            )}
            {rightAction}
          </div>
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mt-3 h-1 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}
      </header>
    );
  }

  // Detail variant (default): back button + inline title + optional right CTA
  return (
    <header className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
              aria-label={backLabel}
            >
              <MdArrowBack className="w-5 h-5" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-neutral-400 text-sm truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
};

export default PageHeader;
