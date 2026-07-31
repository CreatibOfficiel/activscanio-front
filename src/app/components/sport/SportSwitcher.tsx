'use client';

import { FC, KeyboardEvent, useRef } from 'react';
import { motion } from 'motion/react';
import { Sport } from '../../hooks/useSportPreference';

interface SportSwitcherProps {
  value: Sport;
  onChange: (sport: Sport) => void;
  /** Defaults to both. A parent showing one sport should not render this. */
  sports?: Sport[];
  className?: string;
}

const SPORT_LABELS: Record<Sport, string> = {
  'mario-kart': 'Mario Kart',
  'ping-pong': 'Ping-Pong',
};

const SPORT_ICONS: Record<Sport, string> = {
  'mario-kart': '🏎️',
  'ping-pong': '🏓',
};

/**
 * Pick which sport's leaderboard to show.
 *
 * A radiogroup rather than a tablist. Tabs assert that what follows are
 * facets of one thing; two ratings that are explicitly never comparable are
 * two datasets, and choosing one is a filter. The APG radio pattern covers
 * exactly this, and needs none of the aria-controls / role="tabpanel"
 * plumbing that tabs require and that quietly rots.
 *
 * Keyboard behaviour follows the APG radio pattern: the group is a single
 * tab stop, arrows move and select in one motion, and the ends wrap.
 * TimePeriodToggle claims the same role without any of this — worth fixing
 * there too, but not from here.
 */
const SportSwitcher: FC<SportSwitcherProps> = ({
  value,
  onChange,
  sports = ['mario-kart', 'ping-pong'],
  className = '',
}) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, delta: number) => {
    // Wrap: arrowing past either end returns to the other, so the group
    // never dead-ends.
    const next = (from + delta + sports.length) % sports.length;
    onChange(sports[next]);
    buttonRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        move(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        move(index, -1);
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Sport affiché"
      className={`inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-700 ${className}`}
    >
      {sports.map((sport, index) => {
        const isActive = value === sport;

        return (
          <button
            key={sport}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            role="radio"
            aria-checked={isActive}
            // Only the selected option is in the tab order: the whole group
            // is one stop, as the radio pattern requires.
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              // Re-selecting the active sport would refetch the same board.
              if (!isActive) onChange(sport);
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="sport-indicator"
                className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rounded-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span aria-hidden="true">{SPORT_ICONS[sport]}</span>
              {SPORT_LABELS[sport]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SportSwitcher;
