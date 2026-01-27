'use client';

import { FC, ReactNode, useState, useRef, useEffect, useCallback } from 'react';

type TooltipPosition = 'top' | 'bottom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  className?: string;
  delay?: number;
}

/**
 * Tooltip Component
 *
 * A reusable tooltip that:
 * - Appears on hover (desktop) and tap (mobile)
 * - Supports top/bottom positioning
 * - Auto-dismisses on mobile after tap outside
 */
const Tooltip: FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside for mobile
  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const handleClickOutside = (e: TouchEvent | MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isVisible]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const handleTouch = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-700 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-700 border-x-transparent border-t-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={!isMobile ? showTooltip : undefined}
      onMouseLeave={!isMobile ? hideTooltip : undefined}
      onTouchStart={isMobile ? handleTouch : undefined}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`
            absolute left-1/2 -translate-x-1/2 z-50
            ${positionClasses[position]}
            px-3 py-2 rounded-lg
            bg-neutral-800 border border-neutral-700
            text-sm text-neutral-200
            shadow-lg
            animate-in fade-in-0 zoom-in-95 duration-150
            min-w-[200px] max-w-[280px] whitespace-normal text-left
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0
              border-[6px]
              ${arrowClasses[position]}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
