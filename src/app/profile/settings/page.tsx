'use client';

import { FC, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SettingsLink, SettingsButton, SettingsVersionTap } from '../../components/settings/SettingsLink';
import { useNotificationStatus } from '../../components/settings/NotificationSettings';
import { useSoundboard } from '../../context/SoundboardContext';
import { useEasterEgg } from '../../hooks/useEasterEgg';

const ProfileSettingsPage: FC = () => {
  const notificationStatus = useNotificationStatus();
  const { state, unlock, open } = useSoundboard();
  const [tapProgress, setTapProgress] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUnlock = useCallback(() => {
    unlock();
    open();

    toast.success('Soundboard unlocked!', {
      icon: '🎉',
      description: 'Secoue ton tel pour l\'ouvrir !',
      duration: 4000,
    });

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }

    setTapProgress(0);
  }, [unlock, open]);

  const { handleTap: easterEggTap } = useEasterEgg({
    targetTaps: 7,
    timeWindow: 3000,
    onUnlock: handleUnlock,
  });

  const handleVersionTap = useCallback(() => {
    if (state.isUnlocked) {
      // Already unlocked, just open the soundboard
      open();
      return;
    }

    // Trigger easter egg tap
    easterEggTap();

    // Update visual progress
    setTapProgress((prev) => Math.min(prev + 1, 7));

    // Reset progress after timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setTapProgress(0);
    }, 3000);
  }, [state.isUnlocked, easterEggTap, open]);

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Retour au profil"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          <h1 className="text-heading text-white">Paramètres</h1>
        </div>
      </header>

      {/* Settings List */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3">
        <SettingsLink
          href="/profile/settings/notifications"
          icon="🔔"
          title="Notifications"
          subtitle={notificationStatus}
        />

        <SettingsLink
          href="/profile/settings/account"
          icon="👤"
          title="Compte"
          subtitle="Profil et connexion"
        />

        {state.isUnlocked && (
          <SettingsButton
            icon="🔊"
            title="Soundboard"
            subtitle="Secoue ton tel ou tape ici !"
            onClick={open}
          />
        )}

        <SettingsVersionTap
          icon="ℹ️"
          title="À propos"
          value={`v1.0.0 · ${process.env.NODE_ENV === 'production' ? 'Production' : 'Dev'}`}
          onTap={handleVersionTap}
          tapProgress={tapProgress}
          isUnlocked={state.isUnlocked}
        />
      </main>
    </div>
  );
};

export default ProfileSettingsPage;
