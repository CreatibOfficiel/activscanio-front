'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { useSoundboard } from '../../context/SoundboardContext';
import { useShakeDetection } from '../../hooks/useShakeDetection';
import ShakePermissionPrompt from './ShakePermissionPrompt';

const ShakeDetector: FC = () => {
  const { state, open } = useSoundboard();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleShake = useCallback(() => {
    // Only open if not already open
    if (!state.isOpen) {
      open();
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, [state.isOpen, open]);

  const { hasPermission, requestPermission, isSupported, needsPermission } = useShakeDetection({
    threshold: 15,
    timeout: 1000,
    enabled: state.isUnlocked && !state.isOpen,
    onShake: handleShake,
  });

  // Show permission prompt after unlock on iOS
  useEffect(() => {
    if (
      state.isUnlocked &&
      isSupported &&
      needsPermission &&
      hasPermission === null
    ) {
      // Slight delay to let the unlock animation finish
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isUnlocked, isSupported, needsPermission, hasPermission]);

  // Hide prompt when permission is granted or soundboard opens
  useEffect(() => {
    if (hasPermission !== null || state.isOpen) {
      setShowPrompt(false);
    }
  }, [hasPermission, state.isOpen]);

  // Don't render anything if soundboard is not unlocked
  if (!state.isUnlocked) return null;

  // Only show the prompt component if needed
  if (!showPrompt) return null;

  return (
    <ShakePermissionPrompt
      hasPermission={hasPermission}
      onRequestPermission={requestPermission}
    />
  );
};

export default ShakeDetector;
