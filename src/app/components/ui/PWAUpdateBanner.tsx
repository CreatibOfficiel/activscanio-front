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
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary-500 text-neutral-900 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">Nouvelle version disponible</p>
              <p className="text-xs sm:text-sm opacity-90">
                Mise à jour automatique dans {countdown} seconde{countdown !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateServiceWorker()}
              className="px-4 py-2 bg-neutral-900 text-primary-500 rounded-lg font-semibold text-sm hover:bg-neutral-800 transition-colors"
            >
              Mettre à jour maintenant
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 text-neutral-900 hover:bg-primary-600 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 h-1 bg-neutral-900/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-neutral-900 transition-all duration-1000 ease-linear"
            style={{ width: `${((30 - countdown) / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
