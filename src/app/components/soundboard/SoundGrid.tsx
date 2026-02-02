'use client';

import { FC } from 'react';
import SoundButton from './SoundButton';
import { SoundItem } from '../../types/soundboard';
import { useSoundboard } from '../../context/SoundboardContext';
import { useSoundboardData } from '../../hooks/useSoundboard';

interface SoundGridProps {
  sounds: SoundItem[];
}

const SoundGrid: FC<SoundGridProps> = ({ sounds }) => {
  const { state } = useSoundboard();
  const { getPlayerColor } = useSoundboardData();

  if (sounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-500">
        <p className="text-regular">Aucun son dans cette catégorie</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 p-4">
      {sounds.map((sound) => (
        <SoundButton
          key={sound.id}
          sound={sound}
          isPlaying={state.currentlyPlaying === sound.id}
          playerColor={getPlayerColor(sound.playerId)}
        />
      ))}
    </div>
  );
};

export default SoundGrid;
