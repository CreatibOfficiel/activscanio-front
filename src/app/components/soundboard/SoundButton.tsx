'use client';

import { FC, useState, useRef, useCallback } from 'react';
import { SoundItem } from '../../types/soundboard';
import { useSoundboard } from '../../context/SoundboardContext';

interface SoundButtonProps {
  sound: SoundItem;
  isPlaying: boolean;
  playerColor: string;
}

const SoundButton: FC<SoundButtonProps> = ({ sound, isPlaying, playerColor }) => {
  const { playSound, stopSound, toggleFavorite, isFavorite } = useSoundboard();
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handlePress = useCallback(() => {
    if (isPlaying) {
      stopSound();
    } else {
      playSound(sound.id);
    }
  }, [isPlaying, playSound, stopSound, sound.id]);

  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
    isLongPressRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      toggleFavorite(sound.id);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, [sound.id, toggleFavorite]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isLongPressRef.current) {
      handlePress();
    }
  }, [handlePress]);

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const favorite = isFavorite(sound.id);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className={`
        relative flex flex-col items-center justify-center
        w-20 h-20 sm:w-24 sm:h-24
        rounded-xl border-2 transition-all duration-150
        select-none touch-manipulation
        ${isPressed ? 'animate-sound-press' : ''}
        ${isPlaying ? 'animate-sound-playing border-primary-500' : 'border-neutral-700'}
        ${isPlaying ? 'bg-primary-500/20' : 'bg-neutral-800 hover:bg-neutral-750'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
      `}
      style={{
        boxShadow: isPlaying
          ? `0 0 20px ${playerColor}40`
          : undefined,
      }}
      aria-label={`${sound.label} - ${isPlaying ? 'En lecture' : 'Jouer'}`}
      aria-pressed={isPlaying}
    >
      {/* Favorite indicator */}
      {favorite && (
        <span className="absolute top-1 right-1 text-xs">❤️</span>
      )}

      {/* Emoji */}
      <span className="text-2xl sm:text-3xl mb-1" aria-hidden="true">
        {sound.emoji}
      </span>

      {/* Label */}
      <span className="text-sub text-neutral-300 truncate max-w-full px-1">
        {sound.label}
      </span>

      {/* Playing indicator */}
      {isPlaying && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full" />
      )}
    </button>
  );
};

export default SoundButton;
