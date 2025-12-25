'use client';

import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number; // Intersection observer threshold (0-1)
  rootMargin?: string; // How far before entering viewport to start loading
}

/**
 * LazyImage Component
 *
 * Lazy loads images using IntersectionObserver for better performance.
 * Shows a placeholder until the image enters the viewport.
 *
 * Features:
 * - Intersection Observer for viewport detection
 * - Smooth fade-in transition when loaded
 * - Placeholder support
 * - Configurable load threshold and margins
 * - Automatic cleanup
 *
 * @example
 * <LazyImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   placeholder="/path/to/placeholder.jpg"
 *   className="w-full h-auto"
 *   rootMargin="50px"
 * />
 */
export default function LazyImage({
  src,
  alt,
  placeholder = '/placeholder-image.png',
  className = '',
  onLoad,
  onError,
  threshold = 0.01,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isInView && !isLoaded) {
      // Preload the image
      const img = new Image();
      img.src = src;

      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };

      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
    }
  }, [isInView, isLoaded, src, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`
        transition-opacity duration-300
        ${isLoaded ? 'opacity-100' : 'opacity-50'}
        ${hasError ? 'grayscale' : ''}
        ${className}
      `}
      loading="lazy"
      {...props}
    />
  );
}

/**
 * LazyImageWithSkeleton Component
 *
 * Variant with a loading skeleton instead of placeholder image
 */
interface LazyImageWithSkeletonProps extends LazyImageProps {
  aspectRatio?: string; // e.g., "16/9", "1/1", "4/3"
}

export function LazyImageWithSkeleton({
  src,
  alt,
  className = '',
  aspectRatio = '16/9',
  ...props
}: LazyImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden" style={{ aspectRatio }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-shimmer" />
      )}
      <LazyImage
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
