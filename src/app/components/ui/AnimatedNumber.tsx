'use client';

import { useRef, useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { motion, useInView } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorClass?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

export function AnimatedNumber({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  size = 'md',
  colorClass = 'text-white',
  className = '',
}: AnimatedNumberProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`font-bold ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {hasAnimated ? (
        <CountUp
          start={0}
          end={value}
          duration={duration}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          separator=" "
        />
      ) : (
        <span>
          {prefix}0{suffix}
        </span>
      )}
    </motion.div>
  );
}
