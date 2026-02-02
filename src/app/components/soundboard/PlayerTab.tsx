'use client';

import { FC } from 'react';
import { PlayerInfo } from '../../types/soundboard';

interface PlayerTabProps {
  player: PlayerInfo | { id: 'all'; name: string } | { id: 'favorites'; name: string };
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

const PlayerTab: FC<PlayerTabProps> = ({ player, isActive, onClick, count }) => {
  const isSpecial = player.id === 'all' || player.id === 'favorites';
  const color = isSpecial ? '#40e4e4' : (player as PlayerInfo).color;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        whitespace-nowrap transition-all duration-200
        text-bold
        ${isActive
          ? 'text-white'
          : 'text-neutral-400 hover:text-neutral-200 bg-neutral-800/50'
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
      `}
      style={{
        backgroundColor: isActive ? `${color}30` : undefined,
        borderColor: isActive ? color : undefined,
        border: isActive ? `2px solid ${color}` : '2px solid transparent',
      }}
      aria-pressed={isActive}
    >
      {player.id === 'favorites' && <span>❤️</span>}
      {player.id === 'all' && <span>🎵</span>}
      <span>{player.name}</span>
      {count !== undefined && count > 0 && (
        <span
          className="px-1.5 py-0.5 text-sub rounded-full"
          style={{ backgroundColor: `${color}50` }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default PlayerTab;
