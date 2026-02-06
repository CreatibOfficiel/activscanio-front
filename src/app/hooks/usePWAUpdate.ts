'use client';

import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

interface PWAUpdateState {
  updateAvailable: boolean;
  updateServiceWorker: () => void;
}

export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [workbox, setWorkbox] = useState<Workbox | null>(null);

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
      console.log('[PWA] Nouveau SW actif - reload');
      window.location.reload();
    });

    wb.register()
      .then((registration) => {
        console.log('[PWA] Service worker registered');

        const handleVisibilityChange = () => {
          if (!document.hidden && registration) {
            registration.update();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', () => {
          if (registration) registration.update();
        });

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      })
      .catch((error) => {
        console.error('[PWA] Registration failed:', error);
      });

    setWorkbox(wb);
  }, []);

  const updateServiceWorker = () => {
    if (workbox) {
      workbox.messageSwWaiting({ type: 'SKIP_WAITING' });
    }
  };

  return { updateAvailable, updateServiceWorker };
}
