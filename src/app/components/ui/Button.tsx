import { FC, ReactNode, ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'error' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  ariaLabel,
  className = '',
  ...rest
}) => {
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-neutral-900 disabled:bg-neutral-700 disabled:text-neutral-500',
    secondary: 'bg-neutral-700 hover:bg-neutral-600 text-white disabled:bg-neutral-800 disabled:text-neutral-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-neutral-900 disabled:bg-neutral-700 disabled:text-neutral-500',
    error: 'bg-error-500 hover:bg-error-600 text-white disabled:bg-neutral-700 disabled:text-neutral-500',
    success: 'bg-success-500 hover:bg-success-600 text-white disabled:bg-neutral-700 disabled:text-neutral-500',
    ghost: 'bg-transparent hover:bg-neutral-800 text-neutral-100 disabled:bg-transparent disabled:text-neutral-600',
    outline: 'bg-transparent border-2 border-primary-500 hover:bg-primary-500/10 text-primary-500 disabled:border-neutral-700 disabled:text-neutral-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-6 py-2 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-bold
        transition-colors duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {loading && <Spinner size="sm" color={variant === 'primary' || variant === 'warning' ? 'neutral' : 'white'} />}
      {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
