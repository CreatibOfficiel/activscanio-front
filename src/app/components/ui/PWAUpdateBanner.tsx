'use client';

import { useEffect, useState, useRef } from 'react';
import { usePWAUpdate } from '@/app/hooks/usePWAUpdate';

const COUNTDOWN_DURATION = 30;
const UPDATE_STARTED_KEY = 'pwa-update-started-at';
const UPDATE_DISMISSED_KEY = 'pwa-update-dismissed';

export function PWAUpdateBanner() {
  const { updateAvailable, updateServiceWorker } = usePWAUpdate();

  // Restore countdown from sessionStorage so navigation doesn't reset it
  const [countdown, setCountdown] = useState(() => {
    if (typeof window === 'undefined') return COUNTDOWN_DURATION;
    const startedAt = sessionStorage.getItem(UPDATE_STARTED_KEY);
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - Number(startedAt)) / 1000);
      return Math.max(0, COUNTDOWN_DURATION - elapsed);
    }
    return COUNTDOWN_DURATION;
  });

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(UPDATE_DISMISSED_KEY) === 'true';
  });

  const hasTriggeredRef = useRef(false);

  // Trigger update when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && updateAvailable && !dismissed && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      updateServiceWorker();
      setTimeout(() => window.location.reload(), 3000);
    }
  }, [countdown, updateAvailable, dismissed, updateServiceWorker]);

  // Countdown interval — deps don't include countdown so it runs once
  useEffect(() => {
    if (!updateAvailable || dismissed || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAvailable, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'true');
  };

  if (!updateAvailable || dismissed) return null;

  const progress = ((COUNTDOWN_DURATION - countdown) / COUNTDOWN_DURATION) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-800 border-b border-primary-500/30 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon + text */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Nouvelle version disponible</p>
              <p className="text-xs text-neutral-400">
                {countdown > 0
                  ? `Rafraîchissement auto dans ${countdown}s`
                  : 'Rafraîchissement en cours...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => updateServiceWorker()}
            className="px-3 py-1.5 bg-primary-500 text-neutral-900 rounded-lg font-semibold text-xs whitespace-nowrap hover:bg-primary-500/90 transition-colors cursor-pointer"
          >
            Mettre à jour
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-0.5 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
