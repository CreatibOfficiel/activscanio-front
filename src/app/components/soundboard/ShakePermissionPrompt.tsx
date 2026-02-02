'use client';

import { FC, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { hasPermissionAPI, isDeviceMotionSupported } from '../../hooks/useShakeDetection';

interface ShakePermissionPromptProps {
  hasPermission: boolean | null;
  onRequestPermission: () => Promise<boolean>;
}

const ShakePermissionPrompt: FC<ShakePermissionPromptProps> = ({
  hasPermission,
  onRequestPermission,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show on iOS devices that support motion and need permission
    const shouldShow =
      isDeviceMotionSupported() &&
      hasPermissionAPI() &&
      hasPermission === null &&
      !dismissed;

    setIsVisible(shouldShow);
  }, [hasPermission, dismissed]);

  if (!isVisible) return null;

  const handleRequestPermission = async () => {
    const granted = await onRequestPermission();
    if (granted) {
      toast.success('Secoue ton tel pour ouvrir la soundboard !', {
        icon: '📳',
        duration: 3000,
      });
    } else {
      toast.error('Permission refusée. Tu peux toujours ouvrir la soundboard depuis les paramètres.', {
        duration: 4000,
      });
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-slideUp lg:left-auto lg:right-4 lg:max-w-sm">
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📳</span>
          <div className="flex-1">
            <p className="text-bold text-white mb-1">
              Activer le shake-to-open ?
            </p>
            <p className="text-sub text-neutral-400 mb-3">
              Secoue ton téléphone pour ouvrir la soundboard rapidement
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRequestPermission}
                className="flex-1 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Activer
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShakePermissionPrompt;
