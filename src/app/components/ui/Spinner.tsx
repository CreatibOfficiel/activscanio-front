import { FC } from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'neutral';
  className?: string;
}

const Spinner: FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colors = {
    primary: 'border-primary-500',
    white: 'border-white',
    neutral: 'border-neutral-500',
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizes[size]} ${colors[color]} ${className}`}
      role="status"
      aria-label="Chargement"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

export default Spinner;
