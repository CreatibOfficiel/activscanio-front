'use client';

import { FC, useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdVolumeUp, MdVolumeOff } from 'react-icons/md';
import { useSoundboard } from '../../context/SoundboardContext';
import { useSoundboardData } from '../../hooks/useSoundboard';
import SoundGrid from './SoundGrid';
import PlayerTab from './PlayerTab';

const SoundboardModal: FC = () => {
  const { state, close, setVolume } = useSoundboard();
  const { sounds, players, soundsByPlayer, favoriteSounds } = useSoundboardData();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (state.isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [state.isOpen]);

  useEffect(() => {
    if (!state.isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.isOpen, close]);

  const filteredSounds = useMemo(() => {
    if (activeTab === 'all') return sounds;
    if (activeTab === 'favorites') return favoriteSounds;
    return soundsByPlayer[activeTab] || [];
  }, [activeTab, sounds, favoriteSounds, soundsByPlayer]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  if (!mounted || !state.isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/98 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="soundboard-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-neutral-700">
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fermer la soundboard"
          >
            <MdClose className="text-2xl" />
          </button>

          <h1
            id="soundboard-title"
            className="text-heading text-white flex items-center gap-2"
          >
            <span>🔊</span>
            SOUNDBOARD
          </h1>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            {state.volume === 0 ? (
              <MdVolumeOff className="text-neutral-400" />
            ) : (
              <MdVolumeUp className="text-neutral-400" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={state.volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary-500
                [&::-webkit-slider-thumb]:cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide border-b border-neutral-800">
          <PlayerTab
            player={{ id: 'all', name: 'Tous' }}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            count={sounds.length}
          />
          <PlayerTab
            player={{ id: 'favorites', name: 'Favoris' }}
            isActive={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
            count={favoriteSounds.length}
          />
          {players.map((player) => (
            <PlayerTab
              key={player.id}
              player={player}
              isActive={activeTab === player.id}
              onClick={() => setActiveTab(player.id)}
              count={soundsByPlayer[player.id]?.length}
            />
          ))}
        </div>

        {/* Sound grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <SoundGrid sounds={filteredSounds} />
        </div>

        {/* Footer hint */}
        <footer className="p-3 border-t border-neutral-800 text-center">
          <p className="text-sub text-neutral-500">
            Appui long sur un son pour l&apos;ajouter aux favoris
          </p>
        </footer>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SoundboardModal;
