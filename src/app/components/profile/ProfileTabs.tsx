'use client';

import { FC, KeyboardEvent, useMemo } from 'react';

export type ProfileTab = 'overview' | 'stats' | 'races' | 'achievements';

interface Tab {
  id: ProfileTab;
  label: string;
  icon: string;
}

const ALL_TABS: Tab[] = [
  { id: 'overview', label: 'Aperçu', icon: '📋' },
  { id: 'stats', label: 'Paris', icon: '🎰' },
  { id: 'races', label: 'Courses', icon: '🏎️' },
  { id: 'achievements', label: 'Succès', icon: '🏆' },
];

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  showRacesTab?: boolean;
  className?: string;
}

/**
 * ProfileTabs Component
 *
 * Tab navigation for the profile page with keyboard accessibility
 * Supports conditional display of the Races tab for players
 */
const ProfileTabs: FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  showRacesTab = false,
  className = '',
}) => {
  // Filter tabs based on showRacesTab prop
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => tab.id !== 'races' || showRacesTab);
  }, [showRacesTab]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;

    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % visibleTabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + visibleTabs.length) % visibleTabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = visibleTabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    onTabChange(visibleTabs[newIndex].id);

    // Focus the new tab button
    const tabButtons = document.querySelectorAll('[role="tab"]');
    (tabButtons[newIndex] as HTMLElement)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Sections du profil"
      className={`flex gap-1 p-1 rounded-xl bg-neutral-800/50 border border-neutral-700 overflow-x-auto ${className}`}
    >
      {visibleTabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        // Determine tab color for stats (green) and races (blue)
        const getTabColors = () => {
          if (!isActive) return 'text-neutral-400 hover:text-white hover:bg-neutral-700/50';
          if (tab.id === 'stats') return 'bg-emerald-500 text-neutral-900 shadow-lg';
          if (tab.id === 'races') return 'bg-blue-500 text-neutral-900 shadow-lg';
          return 'bg-primary-500 text-neutral-900 shadow-lg';
        };

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
              font-medium text-sm transition-all duration-200 min-w-fit
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-800
              ${getTabColors()}
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
