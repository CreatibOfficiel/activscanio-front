'use client';

import { FC, useState } from 'react';
import { useNotifications } from '@/app/hooks/useNotifications';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  /** Show compact version without header */
  compact?: boolean;
}

export const NotificationSettings: FC<NotificationSettingsProps> = ({
  compact = false,
}) => {
  const {
    permission,
    preferences,
    isLoading,
    isSupported,
    isIOS,
    isPWAInstalled,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updatePreferences,
    sendTestNotification,
  } = useNotifications();

  const [isSaving, setIsSaving] = useState(false);

  const handleEnablePush = async () => {
    try {
      setIsSaving(true);

      if (isIOS && !isPWAInstalled) {
        toast.info(
          'Sur iOS, installez l\'app sur votre écran d\'accueil pour activer les notifications push',
          { duration: 5000 }
        );
        return;
      }

      const perm = await requestPermission();

      if (perm === 'granted') {
        const success = await subscribeToPush();

        if (success) {
          await updatePreferences({ enablePush: true });
          toast.success('Notifications push activées !');
        } else {
          toast.error('Erreur lors de l\'inscription aux notifications push');
        }
      } else if (perm === 'denied') {
        toast.error(
          'Permission refusée. Autorisez les notifications dans les paramètres de votre navigateur.',
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'activation des notifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setIsSaving(true);
      await unsubscribeFromPush();
      await updatePreferences({ enablePush: false });
      toast.success('Notifications push désactivées');
    } catch {
      toast.error('Erreur lors de la désactivation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryToggle = async (
    category: 'betting' | 'achievements' | 'rankings' | 'races' | 'special',
    enabled: boolean
  ) => {
    if (!preferences) return;

    try {
      await updatePreferences({
        categories: {
          ...preferences.categories,
          [category]: enabled,
        },
      });
      toast.success('Préférences mises à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast.success('Notification de test envoyée !');
    } catch {
      toast.error('Erreur lors de l\'envoi du test');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse text-neutral-400 p-4">
        Chargement des préférences...
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl bg-warning-500/10 border border-warning-500 p-4">
        <p className="text-warning-500 text-regular">
          Les notifications ne sont pas supportées sur cet appareil
        </p>
      </div>
    );
  }

  // Spacing based on compact mode
  const sectionSpacing = compact ? 'space-y-3' : 'space-y-4 sm:space-y-6';
  const cardPadding = compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6';

  return (
    <div className={sectionSpacing}>
      {/* Avertissement iOS */}
      {isIOS && !isPWAInstalled && (
        <div className="rounded-xl bg-info-500/10 border border-info-500 p-3 sm:p-4">
          <p className="text-info-500 text-sub sm:text-regular">
            Sur iOS, ajoutez l&apos;app à votre écran d&apos;accueil pour activer les notifications push
          </p>
        </div>
      )}

      {/* Notifications Push */}
      <div className={`rounded-xl bg-neutral-800 border border-neutral-700 ${cardPadding}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-bold text-white mb-1">Notifications Push</h4>
            <p className="text-sub text-neutral-400">
              Recevez des notifications même quand l&apos;app est fermée
            </p>
          </div>

          <button
            onClick={preferences?.enablePush ? handleDisablePush : handleEnablePush}
            disabled={isSaving || permission === 'denied'}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sub sm:text-regular font-semibold transition-colors whitespace-nowrap min-h-[44px] ${
              preferences?.enablePush
                ? 'bg-success-500 hover:bg-success-600 text-neutral-900'
                : 'bg-primary-500 hover:bg-primary-600 text-neutral-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? '...' : preferences?.enablePush ? 'Activées' : 'Activer'}
          </button>
        </div>

        {permission === 'denied' && (
          <p className="text-error-500 text-sub mt-3">
            Vous avez refusé les notifications. Modifiez les permissions dans les paramètres de votre navigateur.
          </p>
        )}

        {preferences?.enablePush && (
          <button
            onClick={handleTestNotification}
            className="text-sub text-primary-500 hover:text-primary-400 underline mt-3 min-h-[44px]"
          >
            Envoyer une notification de test
          </button>
        )}
      </div>

      {/* Notifications In-App */}
      <div className={`rounded-xl bg-neutral-800 border border-neutral-700 ${cardPadding}`}>
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <div className="min-w-0 flex-1">
            <h4 className="text-bold text-white mb-1">Notifications In-App</h4>
            <p className="text-sub text-neutral-400">
              Toasts dans l&apos;application quand vous êtes connecté
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={preferences?.enableInApp ?? true}
              onChange={(e) => updatePreferences({ enableInApp: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>
      </div>

      {/* Catégories de Notifications */}
      <div className={`rounded-xl bg-neutral-800 border border-neutral-700 ${cardPadding}`}>
        <h4 className="text-bold text-white mb-3 sm:mb-4">Types de notifications</h4>

        <div className="space-y-1">
          <NotificationToggle
            icon="🎲"
            title="Paris"
            description="Résultats de paris, rappels, streak en danger"
            enabled={preferences?.categories.betting ?? true}
            onChange={(enabled) => handleCategoryToggle('betting', enabled)}
          />

          <NotificationToggle
            icon="🏆"
            title="Achievements"
            description="Achievements débloqués, level up, titres"
            enabled={preferences?.categories.achievements ?? true}
            onChange={(enabled) => handleCategoryToggle('achievements', enabled)}
          />

          <NotificationToggle
            icon="📊"
            title="Classements"
            description="Entrée/sortie du top 3, changements de position"
            enabled={preferences?.categories.rankings ?? true}
            onChange={(enabled) => handleCategoryToggle('rankings', enabled)}
          />

          <NotificationToggle
            icon="🏁"
            title="Courses"
            description="Nouvelles courses, résultats postés"
            enabled={preferences?.categories.races ?? true}
            onChange={(enabled) => handleCategoryToggle('races', enabled)}
          />

          <NotificationToggle
            icon="⚡"
            title="Performances Spéciales"
            description="Scores parfaits (strike), win streaks, records"
            enabled={preferences?.categories.special ?? true}
            onChange={(enabled) => handleCategoryToggle('special', enabled)}
          />
        </div>
      </div>
    </div>
  );
};

/** Hook to get push notification status summary */
export const useNotificationStatus = () => {
  const { preferences, isLoading } = useNotifications();

  if (isLoading) return 'Chargement...';
  if (!preferences) return 'Non configuré';

  const pushStatus = preferences.enablePush ? 'Push activées' : 'Push désactivées';
  const enabledCategories = Object.values(preferences.categories).filter(Boolean).length;

  return `${pushStatus} · ${enabledCategories}/5 catégories`;
};

// Sous-composant pour les toggles
interface NotificationToggleProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const NotificationToggle: FC<NotificationToggleProps> = ({
  icon,
  title,
  description,
  enabled,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between py-3 gap-3 border-b border-neutral-700/50 last:border-0 min-h-[52px]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <h5 className="text-regular text-white">{title}</h5>
          <p className="text-sub text-neutral-400 truncate">{description}</p>
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          aria-label={`${title}: ${enabled ? 'activé' : 'désactivé'}`}
        />
        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
      </label>
    </div>
  );
};
