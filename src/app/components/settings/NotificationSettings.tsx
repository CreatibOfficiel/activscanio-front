'use client';

import { FC, useState } from 'react';
import { useNotifications } from '@/app/hooks/useNotifications';
import { toast } from 'sonner';

export const NotificationSettings: FC = () => {
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
    return <div className="animate-pulse">Chargement des préférences...</div>;
  }

  if (!isSupported) {
    return (
      <div className="rounded-lg bg-warning-500/10 border border-warning-500 p-4">
        <p className="text-warning-500">
          Les notifications ne sont pas supportées sur cet appareil
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h3 className="text-xl font-bold mb-2">Notifications</h3>
        <p className="text-neutral-400 text-sm">
          Gérez vos préférences de notifications pour rester informé
        </p>
      </div>

      {/* Avertissement iOS */}
      {isIOS && !isPWAInstalled && (
        <div className="rounded-lg bg-info-500/10 border border-info-500 p-4">
          <p className="text-info-500 text-sm">
            Sur iOS, ajoutez l&apos;app à votre écran d&apos;accueil pour activer les notifications push
          </p>
        </div>
      )}

      {/* Notifications Push */}
      <div className="rounded-lg bg-neutral-800 border border-neutral-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold mb-1">Notifications Push</h4>
            <p className="text-sm text-neutral-400">
              Recevez des notifications même quand l&apos;app est fermée
            </p>
          </div>

          <button
            onClick={preferences?.enablePush ? handleDisablePush : handleEnablePush}
            disabled={isSaving || permission === 'denied'}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              preferences?.enablePush
                ? 'bg-success-500 hover:bg-success-600 text-neutral-900'
                : 'bg-primary-500 hover:bg-primary-600 text-neutral-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {preferences?.enablePush ? 'Activées ✓' : 'Activer'}
          </button>
        </div>

        {permission === 'denied' && (
          <p className="text-error-500 text-sm">
            Vous avez refusé les notifications. Modifiez les permissions dans les paramètres de votre navigateur.
          </p>
        )}

        {preferences?.enablePush && (
          <button
            onClick={handleTestNotification}
            className="text-sm text-primary-500 hover:text-primary-400 underline"
          >
            Envoyer une notification de test
          </button>
        )}
      </div>

      {/* Notifications In-App */}
      <div className="rounded-lg bg-neutral-800 border border-neutral-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold mb-1">Notifications In-App</h4>
            <p className="text-sm text-neutral-400">
              Toasts dans l&apos;application quand vous êtes connecté
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
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
      <div className="rounded-lg bg-neutral-800 border border-neutral-700 p-6">
        <h4 className="font-semibold mb-4">Types de notifications</h4>

        <div className="space-y-4">
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
    <div className="flex items-start justify-between py-3 border-b border-neutral-700 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <span className="text-2xl">{icon}</span>
        <div>
          <h5 className="font-medium mb-0.5">{title}</h5>
          <p className="text-sm text-neutral-400">{description}</p>
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
      </label>
    </div>
  );
};
