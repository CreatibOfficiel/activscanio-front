'use client';

import { useEffect, useState } from 'react';
import { usePWAUpdate } from '@/app/hooks/usePWAUpdate';

export function PWAUpdateBanner() {
  const { updateAvailable, updateServiceWorker } = usePWAUpdate();
  const [countdown, setCountdown] = useState(30);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!updateAvailable || dismissed) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          updateServiceWorker();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [updateAvailable, dismissed, updateServiceWorker]);

  if (!updateAvailable || dismissed) return null;

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
              <p className="text-xs text-neutral-400">{countdown}s</p>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => updateServiceWorker()}
            className="px-3 py-1.5 bg-primary-500 text-neutral-900 rounded-lg font-semibold text-xs whitespace-nowrap hover:bg-primary-500/90 transition-colors"
          >
            Mettre à jour
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
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
            style={{ width: `${((30 - countdown) / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
