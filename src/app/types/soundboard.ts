export interface SoundItem {
  id: string;
  label: string;
  emoji: string;
  playerId: string;
  audioUrl: string;
  category?: 'celebration' | 'rage' | 'funny' | 'classic';
}

export interface PlayerInfo {
  id: string;
  name: string;
  color: string;
}

export interface SoundboardState {
  isUnlocked: boolean;
  isOpen: boolean;
  favorites: string[];
  volume: number;
  currentlyPlaying: string | null;
}

export type SoundboardAction =
  | { type: 'UNLOCK' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE_FAVORITE'; soundId: string }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_PLAYING'; soundId: string | null }
  | { type: 'HYDRATE'; state: Partial<SoundboardState> };
