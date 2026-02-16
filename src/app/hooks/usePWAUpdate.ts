'use client';

import { useEffect, useState, useCallback } from 'react';
import { Workbox } from 'workbox-window';

interface PWAUpdateState {
  updateAvailable: boolean;
  updateServiceWorker: () => void;
}

const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV === 'development' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    const wb = new Workbox('/sw-custom.js', { scope: '/' });

    wb.addEventListener('waiting', () => {
      console.log('[PWA] Nouvelle version disponible');
      setUpdateAvailable(true);
    });

    wb.addEventListener('controlling', () => {
      console.log('[PWA] Nouveau SW actif, rechargement...');
      window.location.reload();
    });

    let lastUpdateCheck = 0;

    wb.register()
      .then((registration) => {
        console.log('[PWA] Service worker registered');

        if (registration?.waiting) {
          console.log('[PWA] SW already waiting');
          setUpdateAvailable(true);
        }

        const handleVisibilityChange = () => {
          const now = Date.now();
          if (!document.hidden && registration && now - lastUpdateCheck > UPDATE_CHECK_INTERVAL) {
            lastUpdateCheck = now;
            registration.update();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      })
      .catch((error) => {
        console.error('[PWA] Registration failed:', error);
      });
  }, []);

  const updateServiceWorker = useCallback(() => {
    // Listen for the new SW to take control, then reload
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    navigator.serviceWorker?.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // No waiting SW found, force reload as last resort
        window.location.reload();
      }
    });
  }, []);

  return { updateAvailable, updateServiceWorker };
}
