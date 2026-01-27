'use client';

import { FC, useEffect, useState, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useInView } from 'motion/react';
import 'react-circular-progressbar/dist/styles.css';

interface CircularWinRateProps {
  winRate: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 160,
};

/**
 * CircularWinRate Component
 *
 * Displays win rate as a circular progress bar with animation.
 * Uses emerald color scheme for betting stats.
 */
const CircularWinRate: FC<CircularWinRateProps> = ({
  winRate,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(animated ? 0 : winRate);

  useEffect(() => {
    if (isInView && animated && displayValue === 0) {
      // Animate from 0 to winRate over 1.5 seconds
      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(winRate * easeOut);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, animated, winRate, displayValue]);

  const dimension = sizeMap[size];

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <CircularProgressbar
        value={displayValue}
        text={`${Math.round(displayValue)}%`}
        styles={buildStyles({
          // Rotation of path and trail, in number of turns (0-1)
          rotation: 0,

          // Whether to use rounded or flat corners on the ends
          strokeLinecap: 'round',

          // Text size
          textSize: '1.5rem',

          // How long animation takes to go from one percentage to another, in seconds
          pathTransitionDuration: 0.5,

          // Colors
          pathColor: `rgb(16, 185, 129)`, // emerald-500
          textColor: '#ffffff',
          trailColor: 'rgb(38, 38, 38)', // neutral-800
          backgroundColor: 'transparent',
        })}
      />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-neutral-400">
        Win Rate
      </div>
    </div>
  );
};

export default CircularWinRate;
