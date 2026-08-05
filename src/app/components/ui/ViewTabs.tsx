'use client';

import { KeyboardEvent, useRef } from 'react';

export interface ViewTabsOption<T extends string> {
  id: T;
  label: string;
}

interface ViewTabsProps<T extends string> {
  views: readonly ViewTabsOption<T>[];
  value: T;
  onChange: (view: T) => void;
  /**
   * Namespaces the generated ids. Two boards both carry a 'ranking' view, so
   * without a prefix both would mint `panel-ranking` and a duplicate id makes
   * `aria-controls` resolve to whichever element the browser saw first.
   */
  idPrefix: string;
  /** The tablist's accessible name. */
  label: string;
  className?: string;
}

/** Shared with the pages, which put the matching ids on their panels. */
export const viewPanelId = (idPrefix: string, view: string) =>
  `${idPrefix}-panel-${view}`;
export const viewTabId = (idPrefix: string, view: string) =>
  `${idPrefix}-tab-${view}`;

/**
 * The in-page view switcher: one strip of tabs that swaps a rendered panel.
 *
 * A `tablist`, not a radiogroup, and the distinction is not cosmetic. A
 * radiogroup filters one thing down; a tablist swaps between two different
 * things sharing a screen. A ranking and a history are two different things —
 * the history is not a subset of the board — and `tablist` is what tells
 * assistive tech an entire panel is about to be replaced.
 *
 * Generalised out of `PingpongViewTabs`, which was itself a copy of
 * `TimePeriodToggle`'s keyboard handling. Two copies is tolerable; the Mario
 * Kart board makes three, which is where the copy stops being cheaper than
 * the abstraction.
 *
 * It navigates nothing and writes nothing to the URL. The ping-pong page once
 * carried a segmented radiogroup that looked like a filter and called
 * `router.push('/')`, which was the bug that got it deleted. Keeping the
 * router out of here is what stops that shape coming back: the back button
 * still leaves the page rather than unwinding a toggle.
 *
 * Keyboard behaviour is the WAI-ARIA tabs pattern with automatic activation:
 * one tab stop for the strip, arrows to move within it, Home/End for the
 * ends, focus driven by a **scoped** ref array. Deliberately not
 * `ProfileTabs`, which finds its siblings with a document-wide
 * `querySelectorAll('[role="tab"]')` — two tablists on one page then steal
 * each other's arrow keys. That component's bug is left alone here on
 * purpose (it is a separate refactor), but this one must not reproduce it:
 * with two call sites shipping from this file, one page can now legitimately
 * hold two strips.
 */
export default function ViewTabs<T extends string>({
  views,
  value,
  onChange,
  idPrefix,
  label,
  className = '',
}: ViewTabsProps<T>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const next = (index + views.length) % views.length;
    onChange(views[next].id);
    tabRefs.current[next]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        select(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        select(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        select(0);
        break;
      case 'End':
        event.preventDefault();
        select(views.length - 1);
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`inline-flex gap-1 rounded-xl bg-neutral-800 p-1 ${className}`}
    >
      {views.map((view, index) => {
        const selected = view.id === value;

        return (
          <button
            key={view.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={viewTabId(idPrefix, view.id)}
            aria-selected={selected}
            aria-controls={viewPanelId(idPrefix, view.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(view.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              selected
                ? 'bg-primary-500 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
