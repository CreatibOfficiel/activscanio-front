'use client';

import { useMemo } from 'react';
import { useSoundboard } from '../context/SoundboardContext';
import { SOUNDS, PLAYERS } from '../data/sounds';
import { SoundItem } from '../types/soundboard';

export function useSoundboardData() {
  const { state, isFavorite } = useSoundboard();

  const soundsByPlayer = useMemo(() => {
    const grouped: Record<string, SoundItem[]> = {};
    SOUNDS.forEach((sound) => {
      if (!grouped[sound.playerId]) {
        grouped[sound.playerId] = [];
      }
      grouped[sound.playerId].push(sound);
    });
    return grouped;
  }, []);

  const favoriteSounds = useMemo(() => {
    return SOUNDS.filter((sound) => isFavorite(sound.id));
  }, [isFavorite]);

  const getPlayerName = (playerId: string) => {
    return PLAYERS.find((p) => p.id === playerId)?.name ?? playerId;
  };

  const getPlayerColor = (playerId: string) => {
    return PLAYERS.find((p) => p.id === playerId)?.color ?? '#40e4e4';
  };

  return {
    sounds: SOUNDS,
    players: PLAYERS,
    soundsByPlayer,
    favoriteSounds,
    getPlayerName,
    getPlayerColor,
    currentlyPlaying: state.currentlyPlaying,
    volume: state.volume,
  };
}
