'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseShakeDetectionOptions {
  threshold?: number;     // Acceleration threshold to detect shake (default: 15)
  timeout?: number;       // Minimum time between shake triggers in ms (default: 1000)
  enabled?: boolean;      // Whether detection is active (default: true)
  onShake: () => void;    // Callback when shake is detected
}

interface ShakePermissionState {
  isSupported: boolean;
  needsPermission: boolean;
  hasPermission: boolean | null; // null = not yet requested
  requestPermission: () => Promise<boolean>;
}

const STORAGE_KEY = 'mushroom_shake_permission';

// Check if we're in iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
}

// Check if DeviceMotion API is available
function isDeviceMotionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'DeviceMotionEvent' in window;
}

// Check if permission API exists (iOS 13+)
function hasPermissionAPI(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
  );
}

export function useShakeDetection({
  threshold = 15,
  timeout = 1000,
  enabled = true,
  onShake,
}: UseShakeDetectionOptions): ShakePermissionState {
  const lastShakeRef = useRef<number>(0);
  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const isSupported = isDeviceMotionSupported();
  const needsPermission = hasPermissionAPI();

  // Load saved permission state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'granted') {
        setHasPermission(true);
      } else if (stored === 'denied') {
        setHasPermission(false);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Request permission for iOS
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!needsPermission) {
      // No permission needed (Android, desktop)
      setHasPermission(true);
      return true;
    }

    try {
      const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);

      try {
        localStorage.setItem(STORAGE_KEY, granted ? 'granted' : 'denied');
      } catch {
        // localStorage not available
      }

      return granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, [needsPermission]);

  // Handle device motion event
  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;

      const { x, y, z } = accelerationIncludingGravity;
      if (x === null || y === null || z === null) return;

      const last = lastAccelerationRef.current;

      // Calculate change in acceleration
      const deltaX = Math.abs(x - last.x);
      const deltaY = Math.abs(y - last.y);
      const deltaZ = Math.abs(z - last.z);

      // Calculate total acceleration change
      const totalDelta = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

      // Update last values
      lastAccelerationRef.current = { x, y, z };

      // Check if shake detected
      if (totalDelta > threshold) {
        const now = Date.now();
        if (now - lastShakeRef.current > timeout) {
          lastShakeRef.current = now;
          onShake();
        }
      }
    },
    [threshold, timeout, onShake]
  );

  // Set up event listener
  useEffect(() => {
    if (!enabled || !isSupported) return;

    // On iOS, we need permission
    if (needsPermission && hasPermission !== true) return;

    // On Android/desktop, start listening immediately
    window.addEventListener('devicemotion', handleMotion);

    // Disable when app goes to background
    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.removeEventListener('devicemotion', handleMotion);
      } else if (enabled) {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isSupported, needsPermission, hasPermission, handleMotion]);

  // Auto-request permission on non-iOS devices
  useEffect(() => {
    if (enabled && isSupported && !needsPermission && hasPermission === null) {
      setHasPermission(true);
    }
  }, [enabled, isSupported, needsPermission, hasPermission]);

  return {
    isSupported,
    needsPermission,
    hasPermission,
    requestPermission,
  };
}

// Export helpers for external use
export { isIOSSafari, isDeviceMotionSupported, hasPermissionAPI };
