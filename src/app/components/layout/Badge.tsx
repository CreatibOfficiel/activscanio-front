import { FC, ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'gold' | 'silver' | 'bronze';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-neutral-700 text-neutral-300',
    primary: 'bg-primary-500 text-neutral-900',
    success: 'bg-success-500 text-white',
    error: 'bg-error-500 text-white',
    warning: 'bg-yellow-500 text-neutral-900',
    gold: 'bg-gold-500 text-neutral-900',
    silver: 'bg-silver-500 text-neutral-900',
    bronze: 'bg-bronze-500 text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
