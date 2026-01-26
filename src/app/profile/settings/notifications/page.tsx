'use client';

import { FC } from 'react';
import Link from 'next/link';
import { NotificationSettings } from '@/app/components/settings/NotificationSettings';

const NotificationsSettingsPage: FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile/settings"
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Retour aux paramètres"
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
          <h1 className="text-heading text-white">Notifications</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <NotificationSettings compact />
      </main>
    </div>
  );
};

export default NotificationsSettingsPage;
