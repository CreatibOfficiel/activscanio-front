'use client';

import { FC, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';

interface TrendIndicator {
  direction: 'up' | 'down';
  value: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  subValue?: string;
  variant?: 'default' | 'compact' | 'hero';
  animated?: boolean;
  trend?: TrendIndicator;
  colorClass?: string;
  className?: string;
}

/**
 * Unified StatCard Component
 *
 * Replaces StatCard, QuickStatPill, and LifetimeStatCard with a single
 * flexible component supporting multiple variants:
 * - default: Standard card with icon, label, value, optional subValue
 * - compact: Smaller padding, centered layout for grids
 * - hero: Large size for featured stats
 */
const StatCard: FC<StatCardProps> = ({
  label,
  value,
  icon,
  subValue,
  variant = 'default',
  animated = false,
  trend,
  colorClass = 'text-white',
  className = '',
}) => {
  const variants = {
    default: {
      container: 'p-4 rounded-lg bg-neutral-900 border border-neutral-700',
      iconSize: 'text-lg',
      labelSize: 'text-xs',
      valueSize: 'text-2xl',
      subValueSize: 'text-xs',
    },
    compact: {
      container: 'p-3 rounded-lg bg-neutral-900 border border-neutral-700',
      iconSize: 'text-lg',
      labelSize: 'text-xs',
      valueSize: 'text-xl',
      subValueSize: 'text-xs',
    },
    hero: {
      container: 'p-6 rounded-xl bg-neutral-900 border border-neutral-700',
      iconSize: 'text-2xl',
      labelSize: 'text-sm',
      valueSize: 'text-4xl',
      subValueSize: 'text-sm',
    },
  };

  const styles = variants[variant];
  const isNumeric = typeof value === 'number';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${styles.container} ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={styles.iconSize}>{icon}</span>
        <span className={`${styles.labelSize} text-neutral-400 truncate`}>
          {label}
        </span>
        {trend && (
          <span
            className={`ml-auto text-xs font-medium ${
              trend.direction === 'up' ? 'text-success-400' : 'text-error-400'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>

      {animated && isNumeric ? (
        <AnimatedNumber
          value={value as number}
          size={variant === 'hero' ? 'lg' : variant === 'compact' ? 'sm' : 'md'}
          colorClass={colorClass}
          className="font-bold"
        />
      ) : (
        <div className={`${styles.valueSize} font-bold ${colorClass}`}>
          {value}
        </div>
      )}

      {subValue && (
        <div className={`${styles.subValueSize} text-neutral-500 mt-0.5`}>
          {subValue}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
