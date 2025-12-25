import { toast } from 'sonner';

export interface NotificationData {
  title: string;
  body: string;
  category: 'betting' | 'achievements' | 'rankings' | 'races' | 'special';
  url?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

/**
 * Envoie une notification in-app (toast)
 */
export function showInAppNotification(data: NotificationData) {
  const toastConfig = {
    duration: 5000,
    action: data.url ? {
      label: 'Voir',
      onClick: () => window.location.href = data.url!,
    } : undefined,
  };

  switch (data.category) {
    case 'achievements':
      toast.success(`🏆 ${data.title}`, {
        description: data.body,
        ...toastConfig,
      });
      break;
    case 'betting':
      toast.info(`🎲 ${data.title}`, {
        description: data.body,
        ...toastConfig,
      });
      break;
    case 'rankings':
      toast(`📊 ${data.title}`, {
        description: data.body,
        ...toastConfig,
      });
      break;
    case 'races':
      toast(`🏁 ${data.title}`, {
        description: data.body,
        ...toastConfig,
      });
      break;
    case 'special':
      toast.success(`⚡ ${data.title}`, {
        description: data.body,
        ...toastConfig,
      });
      break;
  }
}

interface NotificationPreferences {
  enableInApp?: boolean;
  enablePush?: boolean;
  categories?: Record<string, boolean>;
}

/**
 * Vérifie si une notification doit être envoyée selon les préférences
 */
export function shouldSendNotification(
  category: string,
  preferences: NotificationPreferences | null
): boolean {
  if (!preferences) return true; // Par défaut, tout activé

  // Vérifier si les notifications sont activées globalement
  if (!preferences.enableInApp && !preferences.enablePush) {
    return false;
  }

  // Vérifier la catégorie spécifique
  return preferences.categories?.[category] ?? true;
}
