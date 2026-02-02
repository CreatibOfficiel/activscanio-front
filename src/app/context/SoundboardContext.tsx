'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { SoundboardState, SoundboardAction } from '../types/soundboard';
import { audioManager } from '../utils/audioManager';
import { SOUNDS } from '../data/sounds';

const STORAGE_KEY = 'mushroom_soundboard_state';

const initialState: SoundboardState = {
  isUnlocked: false,
  isOpen: false,
  favorites: [],
  volume: 0.7,
  currentlyPlaying: null,
};

function soundboardReducer(
  state: SoundboardState,
  action: SoundboardAction
): SoundboardState {
  switch (action.type) {
    case 'UNLOCK':
      return { ...state, isUnlocked: true };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'TOGGLE_FAVORITE': {
      const isFav = state.favorites.includes(action.soundId);
      return {
        ...state,
        favorites: isFav
          ? state.favorites.filter((id) => id !== action.soundId)
          : [...state.favorites, action.soundId],
      };
    }
    case 'SET_VOLUME':
      return { ...state, volume: action.volume };
    case 'SET_PLAYING':
      return { ...state, currentlyPlaying: action.soundId };
    case 'HYDRATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

interface SoundboardContextValue {
  state: SoundboardState;
  unlock: () => void;
  open: () => void;
  close: () => void;
  toggleFavorite: (soundId: string) => void;
  setVolume: (volume: number) => void;
  playSound: (soundId: string) => void;
  stopSound: () => void;
  isFavorite: (soundId: string) => boolean;
}

const SoundboardContext = createContext<SoundboardContextValue | null>(null);

export function SoundboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(soundboardReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({
          type: 'HYDRATE',
          state: {
            isUnlocked: parsed.isUnlocked ?? false,
            favorites: parsed.favorites ?? [],
            volume: parsed.volume ?? 0.7,
          },
        });
        audioManager.setVolume(parsed.volume ?? 0.7);
      }
    } catch (e) {
      console.error('Failed to hydrate soundboard state:', e);
    }
  }, []);

  // Persist relevant state to localStorage
  useEffect(() => {
    try {
      const toStore = {
        isUnlocked: state.isUnlocked,
        favorites: state.favorites,
        volume: state.volume,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.error('Failed to persist soundboard state:', e);
    }
  }, [state.isUnlocked, state.favorites, state.volume]);

  // Preload sounds when unlocked
  useEffect(() => {
    if (state.isUnlocked) {
      SOUNDS.forEach((sound) => {
        audioManager.preload(sound.id, sound.audioUrl);
      });
    }
  }, [state.isUnlocked]);

  // Set up playing state callback
  useEffect(() => {
    audioManager.setOnPlayingChange((id) => {
      dispatch({ type: 'SET_PLAYING', soundId: id });
    });

    return () => {
      audioManager.cleanup();
    };
  }, []);

  const unlock = useCallback(() => {
    dispatch({ type: 'UNLOCK' });
  }, []);

  const open = useCallback(() => {
    dispatch({ type: 'OPEN' });
  }, []);

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE' });
    audioManager.stopAll();
  }, []);

  const toggleFavorite = useCallback((soundId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', soundId });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume });
    audioManager.setVolume(volume);
  }, []);

  const playSound = useCallback((soundId: string) => {
    audioManager.play(soundId);
  }, []);

  const stopSound = useCallback(() => {
    audioManager.stopAll();
  }, []);

  const isFavorite = useCallback(
    (soundId: string) => state.favorites.includes(soundId),
    [state.favorites]
  );

  return (
    <SoundboardContext.Provider
      value={{
        state,
        unlock,
        open,
        close,
        toggleFavorite,
        setVolume,
        playSound,
        stopSound,
        isFavorite,
      }}
    >
      {children}
    </SoundboardContext.Provider>
  );
}

export function useSoundboard() {
  const context = useContext(SoundboardContext);
  if (!context) {
    throw new Error('useSoundboard must be used within a SoundboardProvider');
  }
  return context;
}
