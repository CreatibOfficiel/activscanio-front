'use client';

import { useEffect, useState, useCallback } from 'react';
import { Workbox } from 'workbox-window';

interface PWAUpdateState {
  /** True when a new SW starts waiting during the current session (fallback banner) */
  updateAvailable: boolean;
  updateServiceWorker: () => void;
}

const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const UPDATE_STARTED_KEY = 'pwa-update-started-at';
const UPDATE_DISMISSED_KEY = 'pwa-update-dismissed';

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

    // Fallback: if skipWaiting somehow doesn't fire, detect waiting SW
    wb.addEventListener('waiting', () => {
      console.log('[PWA] Nouvelle version en attente (fallback)');
      if (!sessionStorage.getItem(UPDATE_STARTED_KEY)) {
        sessionStorage.setItem(UPDATE_STARTED_KEY, String(Date.now()));
      }
      sessionStorage.removeItem(UPDATE_DISMISSED_KEY);
      setUpdateAvailable(true);
    });

    // New SW took control → reload to use new assets
    wb.addEventListener('controlling', () => {
      console.log('[PWA] Nouveau SW actif, rechargement...');
      sessionStorage.removeItem(UPDATE_STARTED_KEY);
      sessionStorage.removeItem(UPDATE_DISMISSED_KEY);
      window.location.reload();
    });

    let lastUpdateCheck = 0;

    wb.register()
      .then((registration) => {
        console.log('[PWA] Service worker registered');

        // Force an update check immediately after registration
        registration?.update();

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
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      sessionStorage.removeItem(UPDATE_STARTED_KEY);
      sessionStorage.removeItem(UPDATE_DISMISSED_KEY);
      window.location.reload();
    });

    navigator.serviceWorker?.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    });
  }, []);

  return { updateAvailable, updateServiceWorker };
}
