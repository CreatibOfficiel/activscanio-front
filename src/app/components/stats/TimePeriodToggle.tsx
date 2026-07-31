'use client';

import { FC, KeyboardEvent, useRef } from 'react';
import { motion } from 'motion/react';

export type TimePeriod = 'month' | 'year' | 'all';

interface TimePeriodToggleProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

const periodLabels: Record<TimePeriod, string> = {
  month: 'Cette saison',
  year: 'Cette année',
  all: 'Tout le temps',
};

/**
 * TimePeriodToggle Component
 *
 * Toggle buttons for switching between time periods in stats views.
 * Features animated selection indicator.
 *
 * Keyboard behaviour follows the WAI-ARIA radio pattern the role promises:
 * the group is a single tab stop and arrows move between options. Declaring
 * role="radiogroup" without it tells assistive tech to expect a behaviour
 * that is not there — and left every option as its own tab stop.
 */
const TimePeriodToggle: FC<TimePeriodToggleProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const periods: TimePeriod[] = ['month', 'year', 'all'];
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, delta: number) => {
    const next = (from + delta + periods.length) % periods.length;
    onChange(periods[next]);
    buttonRefs.current[next]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
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
      className={`inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-700 ${className}`}
      role="radiogroup"
      aria-label="Période de statistiques"
    >
      {periods.map((period, index) => (
        <button
          key={period}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          role="radio"
          aria-checked={value === period}
          tabIndex={value === period ? 0 : -1}
          onClick={() => onChange(period)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            value === period
              ? 'text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {value === period && (
            <motion.div
              layoutId="period-indicator"
              className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rounded-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{periodLabels[period]}</span>
        </button>
      ))}
    </div>
  );
};

export default TimePeriodToggle;
