'use client';

import { FC, ReactNode } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import Tooltip from './Tooltip';

type TooltipPosition = 'top' | 'bottom';

interface InfoTooltipProps {
  /** The content to display in the tooltip */
  content: ReactNode;
  /** Optional children to wrap with the tooltip - if not provided, shows info icon */
  children?: ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  /** Additional class name for the wrapper */
  className?: string;
  /** Size of the info icon (default: 'sm') */
  iconSize?: 'xs' | 'sm' | 'md';
  /** Hide the info icon and only show the children */
  hideIcon?: boolean;
}

/**
 * InfoTooltip Component
 *
 * A wrapper around Tooltip that displays an info icon (i) in a circle.
 * Perfect for contextual help throughout the app.
 *
 * Usage:
 * - With children: Wraps children and adds info icon
 * - Without children: Shows just the info icon
 *
 * @example
 * // Just the info icon with tooltip
 * <InfoTooltip content="Explication ici" />
 *
 * @example
 * // With children (text label + info icon)
 * <InfoTooltip content="Explication ici">
 *   <span>Score conservateur</span>
 * </InfoTooltip>
 */
const InfoTooltip: FC<InfoTooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  iconSize = 'sm',
  hideIcon = false,
}) => {
  const iconSizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const iconContainerClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
  };

  const InfoIcon = (
    <span
      className={`
        inline-flex items-center justify-center
        ${iconContainerClasses[iconSize]}
        rounded-full
        border border-neutral-500
        text-neutral-400
        hover:text-primary-400 hover:border-primary-400
        transition-colors cursor-help
        flex-shrink-0
      `}
      aria-label="Plus d'informations"
    >
      <MdInfoOutline className={iconSizeClasses[iconSize]} />
    </span>
  );

  // If hideIcon is true, just wrap children
  if (hideIcon && children) {
    return (
      <Tooltip content={content} position={position} className={className}>
        {children}
      </Tooltip>
    );
  }

  // If no children, just show the info icon
  if (!children) {
    return (
      <Tooltip content={content} position={position} className={className}>
        {InfoIcon}
      </Tooltip>
    );
  }

  // With children, show children + info icon
  return (
    <Tooltip content={content} position={position} className={className}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        {InfoIcon}
      </span>
    </Tooltip>
  );
};

export default InfoTooltip;
