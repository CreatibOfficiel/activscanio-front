import { FC } from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton: FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const defaultHeight = {
    text: 'h-4',
    circular: 'h-12 w-12',
    rectangular: 'h-20',
    rounded: 'h-20',
  };

  const styles = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`
        animate-pulse bg-neutral-700
        ${variants[variant]}
        ${!height ? defaultHeight[variant] : ''}
        ${!width && variant !== 'circular' ? 'w-full' : ''}
        ${className}
      `}
      style={styles}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
