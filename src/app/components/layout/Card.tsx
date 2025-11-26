import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'error';
  hover?: boolean;
}

const Card: FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  hover = false,
}) => {
  const variants = {
    default: 'bg-neutral-800 border-neutral-700',
    primary: 'bg-primary-900 border-primary-500',
    success: 'bg-success-500/10 border-success-500',
    error: 'bg-error-500/10 border-error-500',
  };

  const hoverClass = hover
    ? 'hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all'
    : '';

  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`rounded-lg border ${variants[variant]} ${hoverClass} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
