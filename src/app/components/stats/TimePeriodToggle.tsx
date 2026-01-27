'use client';

import { FC } from 'react';
import { motion } from 'motion/react';

export type TimePeriod = 'month' | 'year' | 'all';

interface TimePeriodToggleProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

const periodLabels: Record<TimePeriod, string> = {
  month: 'Ce mois',
  year: 'Cette année',
  all: 'Tout le temps',
};

/**
 * TimePeriodToggle Component
 *
 * Toggle buttons for switching between time periods in stats views.
 * Features animated selection indicator.
 */
const TimePeriodToggle: FC<TimePeriodToggleProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const periods: TimePeriod[] = ['month', 'year', 'all'];

  return (
    <div
      className={`inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-700 ${className}`}
      role="radiogroup"
      aria-label="Période de statistiques"
    >
      {periods.map((period) => (
        <button
          key={period}
          role="radio"
          aria-checked={value === period}
          onClick={() => onChange(period)}
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
