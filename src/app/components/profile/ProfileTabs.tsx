'use client';

import { FC, KeyboardEvent } from 'react';

export type ProfileTab = 'overview' | 'stats' | 'achievements';

interface Tab {
  id: ProfileTab;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Aperçu', icon: '📋' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'achievements', label: 'Succès', icon: '🏆' },
];

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  className?: string;
}

/**
 * ProfileTabs Component
 *
 * Tab navigation for the profile page with keyboard accessibility
 */
const ProfileTabs: FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;

    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    onTabChange(TABS[newIndex].id);

    // Focus the new tab button
    const tabButtons = document.querySelectorAll('[role="tab"]');
    (tabButtons[newIndex] as HTMLElement)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Sections du profil"
      className={`flex gap-1 p-1 rounded-xl bg-neutral-800/50 border border-neutral-700 ${className}`}
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              font-medium text-sm transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-800
              ${
                isActive
                  ? 'bg-primary-500 text-neutral-900 shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }
            `}
          >
            <span className="text-base" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProfileTabs;
