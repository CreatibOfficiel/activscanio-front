import { FC, ReactNode } from 'react';
import Spinner from './Spinner';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'error';
  hover?: boolean;
  loading?: boolean;
  role?: string;
  tabIndex?: number;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
  'aria-checked'?: boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
}

const Card: FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  hover = false,
  loading = false,
  role,
  tabIndex,
  onKeyPress,
  'aria-label': ariaLabel,
  'aria-checked': ariaChecked,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
}) => {
  const variants = {
    default: 'bg-neutral-800 border-neutral-700',
    primary: 'bg-primary-900 border-primary-500',
    success: 'bg-success-500/10 border-success-500',
    error: 'bg-error-500/10 border-error-500',
  };

  const hoverClass = hover
    ? 'hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200'
    : '';

  const cursorClass = onClick ? 'cursor-pointer' : '';

  const ariaProps = {
    ...(role && { role }),
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...(ariaChecked !== undefined && { 'aria-checked': ariaChecked }),
    ...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy }),
    ...(ariaRequired !== undefined && { 'aria-required': ariaRequired }),
  };

  const content = (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/80 rounded-lg">
          <Spinner size="md" />
        </div>
      )}
    </div>
  );

  if (onClick && !loading) {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`text-left w-full rounded-lg border ${variants[variant]} ${hoverClass} ${cursorClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${className}`}
        {...(tabIndex !== undefined && { tabIndex })}
        {...(onKeyPress && { onKeyPress })}
        {...ariaProps}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`rounded-lg border ${variants[variant]} ${hoverClass} ${className}`}
      {...(tabIndex !== undefined && { tabIndex })}
      {...(onKeyPress && { onKeyPress })}
      {...ariaProps}
    >
      {content}
    </div>
  );
};

export default Card;
