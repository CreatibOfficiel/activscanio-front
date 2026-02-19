'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationPreferences {
  enablePush: boolean;
  enableInApp: boolean;
  categories: {
    betting: boolean;
    achievements: boolean;
    rankings: boolean;
    races: boolean;
    special: boolean;
  };
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isSupported: boolean;
  isIOS: boolean;
  isPWAInstalled: boolean;
  iOSVersion: number | null;
  requestPermission: () => Promise<NotificationPermission>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { getToken } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [iOSVersion, setIOSVersion] = useState<number | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Initialisation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier support
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    // Détecter iOS et version
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    setIsIOS(iOS);
    if (iOS) {
      const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        setIOSVersion(parseFloat(`${match[1]}.${match[2]}`));
      }
    }

    // Détecter PWA installée
    const installed = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as unknown as { standalone?: boolean }).standalone ||
                     document.referrer.includes('android-app://');
    setIsPWAInstalled(installed);

    if (supported) {
      setPermission(Notification.permission);
    }

    // Charger préférences
    loadPreferences();
  }, [loadPreferences]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Les notifications ne sont pas supportées sur cet appareil.');
    }

    if (isIOS && iOSVersion !== null && iOSVersion < 16.4) {
      throw new Error(`iOS ${iOSVersion} détecté. Les notifications push nécessitent iOS 16.4 ou plus récent. Mettez à jour votre iPhone.`);
    }

    if (isIOS && !isPWAInstalled) {
      throw new Error('Sur iOS, installez l\'app sur l\'écran d\'accueil (Partager → Sur l\'écran d\'accueil) pour activer les notifications push.');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported, isIOS, isPWAInstalled, iOSVersion]);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      console.warn('[Push] Cannot subscribe: supported=%s, permission=%s', isSupported, permission);
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!registration.pushManager) {
        console.error('[Push] pushManager unavailable — iOS trop ancien ou pas en mode PWA');
        throw new Error('Push non disponible. Vérifiez que l\'app est installée sur l\'écran d\'accueil et que vous êtes sur iOS 16.4+.');
      }

      // Vérifier si déjà subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured');
          throw new Error('Configuration push manquante côté serveur.');
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Envoyer au backend
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(subscription)
        }
      );

      if (!response.ok) {
        console.error('[Push] Backend subscribe failed: %s', response.status);
        throw new Error('Erreur serveur lors de l\'inscription push.');
      }

      return true;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      throw error;
    }
  }, [isSupported, permission, getToken]);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/unsubscribe`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }, [getToken]);

  const updatePreferences = useCallback(async (
    prefs: Partial<NotificationPreferences>
  ): Promise<void> => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(prefs)
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setPreferences(updated);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, [getToken]);

  return {
    permission,
    preferences,
    isLoading,
    isSupported,
    isIOS,
    isPWAInstalled,
    iOSVersion,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updatePreferences,
  };
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
