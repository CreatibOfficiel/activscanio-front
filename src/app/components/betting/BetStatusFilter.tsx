'use client';

import { FC } from 'react';
import { BetStatus } from '@/app/models/Bet';

type TabValue = 'all' | 'mine';

interface BetStatusFilterProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  activeStatus: BetStatus | null;
  onStatusChange: (status: BetStatus | null) => void;
}

const statusFilters: { label: string; value: BetStatus | null; color: string; activeColor: string }[] = [
  { label: 'Tous', value: null, color: 'text-neutral-400 border-neutral-600', activeColor: 'text-white bg-neutral-700 border-neutral-500' },
  { label: 'Gagnés', value: BetStatus.WON, color: 'text-green-400/70 border-green-500/30', activeColor: 'text-green-400 bg-green-500/20 border-green-500/50' },
  { label: 'Perdus', value: BetStatus.LOST, color: 'text-red-400/70 border-red-500/30', activeColor: 'text-red-400 bg-red-500/20 border-red-500/50' },
  { label: 'En attente', value: BetStatus.PENDING, color: 'text-amber-400/70 border-amber-500/30', activeColor: 'text-amber-400 bg-amber-500/20 border-amber-500/50' },
];

const BetStatusFilter: FC<BetStatusFilterProps> = ({
  activeTab,
  onTabChange,
  activeStatus,
  onStatusChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex rounded-xl bg-neutral-800 p-1">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => onTabChange('mine')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'mine'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Mes paris
        </button>
      </div>

      {/* Status pills — only on "Tous" tab */}
      {activeTab === 'all' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => onStatusChange(filter.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeStatus === filter.value ? filter.activeColor : filter.color
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BetStatusFilter;
