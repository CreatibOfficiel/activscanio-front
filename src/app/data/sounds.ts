import { SoundItem, PlayerInfo } from '../types/soundboard';

export const PLAYERS: PlayerInfo[] = [
  { id: 'player1', name: 'Pierre', color: '#e74c3c' },
  { id: 'player2', name: 'Marie', color: '#9b59b6' },
  { id: 'player3', name: 'Jean', color: '#3498db' },
  { id: 'player4', name: 'Thibaud', color: '#2ecc71' },
];

export const SOUNDS: SoundItem[] = [
  // Pierre
  {
    id: 's1',
    label: 'Yahoo!',
    emoji: '🎉',
    playerId: 'player1',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'celebration',
  },
  {
    id: 's2',
    label: 'Noooo!',
    emoji: '😱',
    playerId: 'player1',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'rage',
  },
  {
    id: 's3',
    label: 'GG EZ',
    emoji: '😎',
    playerId: 'player1',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'funny',
  },

  // Marie
  {
    id: 's4',
    label: 'Victoire!',
    emoji: '🏆',
    playerId: 'player2',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'celebration',
  },
  {
    id: 's5',
    label: 'Mais non!',
    emoji: '😤',
    playerId: 'player2',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'rage',
  },
  {
    id: 's6',
    label: 'Héhé',
    emoji: '😏',
    playerId: 'player2',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'funny',
  },

  // Jean
  {
    id: 's7',
    label: 'Let\'s go!',
    emoji: '🚀',
    playerId: 'player3',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'celebration',
  },
  {
    id: 's8',
    label: 'Rageux',
    emoji: '💀',
    playerId: 'player3',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'rage',
  },
  {
    id: 's9',
    label: 'EZ Clap',
    emoji: '👏',
    playerId: 'player3',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'funny',
  },

  // Thibaud
  {
    id: 's10',
    label: 'Boom!',
    emoji: '💥',
    playerId: 'player4',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'celebration',
  },
  {
    id: 's11',
    label: 'Argh!',
    emoji: '🤬',
    playerId: 'player4',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'rage',
  },
  {
    id: 's12',
    label: 'LOL',
    emoji: '🤣',
    playerId: 'player4',
    audioUrl: '/sounds/placeholder.mp3',
    category: 'funny',
  },
];
