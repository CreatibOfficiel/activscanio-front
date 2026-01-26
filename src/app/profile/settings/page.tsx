'use client';

import { FC } from 'react';
import Link from 'next/link';
import { SettingsLink, SettingsInfo } from '../../components/settings/SettingsLink';
import { useNotificationStatus } from '../../components/settings/NotificationSettings';

const ProfileSettingsPage: FC = () => {
  const notificationStatus = useNotificationStatus();

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

        <SettingsInfo
          icon="ℹ️"
          title="À propos"
          value={`v1.0.0 · ${process.env.NODE_ENV === 'production' ? 'Production' : 'Dev'}`}
        />
      </main>
    </div>
  );
};

export default ProfileSettingsPage;
