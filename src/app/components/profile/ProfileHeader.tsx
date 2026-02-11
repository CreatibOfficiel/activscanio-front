'use client';

import { FC } from 'react';
import Image from 'next/image';
import { MdEdit } from 'react-icons/md';
import { UserStats } from '../../models/Achievement';
import { CompetitorStats } from '../../profile/page';

// Character color mappings for gradient backgrounds
const CHARACTER_COLORS: Record<string, { from: string; to: string }> = {
  mario: { from: 'from-red-600', to: 'to-orange-500' },
  luigi: { from: 'from-green-600', to: 'to-green-400' },
  peach: { from: 'from-pink-400', to: 'to-pink-300' },
  toad: { from: 'from-blue-500', to: 'to-white' },
  yoshi: { from: 'from-green-500', to: 'to-lime-400' },
  bowser: { from: 'from-orange-600', to: 'to-yellow-500' },
  toadette: { from: 'from-pink-500', to: 'to-fuchsia-500' },
  daisy: { from: 'from-orange-400', to: 'to-yellow-400' },
  rosalina: { from: 'from-cyan-400', to: 'to-blue-300' },
  wario: { from: 'from-yellow-500', to: 'to-purple-600' },
  waluigi: { from: 'from-purple-600', to: 'to-indigo-500' },
  donkeykong: { from: 'from-amber-700', to: 'to-amber-500' },
  diddykong: { from: 'from-red-700', to: 'to-amber-600' },
  koopa: { from: 'from-green-600', to: 'to-yellow-500' },
  shyguy: { from: 'from-red-500', to: 'to-red-400' },
  lakitu: { from: 'from-yellow-400', to: 'to-green-400' },
  boo: { from: 'from-neutral-200', to: 'to-neutral-400' },
  drybones: { from: 'from-neutral-400', to: 'to-neutral-600' },
  kingboo: { from: 'from-purple-400', to: 'to-neutral-300' },
  petey: { from: 'from-green-500', to: 'to-red-500' },
  wiggler: { from: 'from-yellow-500', to: 'to-orange-500' },
  default: { from: 'from-primary-600', to: 'to-blue-600' },
};

// Get character colors from name (lowercase, no spaces)
const getCharacterColors = (characterName?: string): { from: string; to: string } => {
  if (!characterName) return CHARACTER_COLORS.default;
  const key = characterName.toLowerCase().replace(/\s+/g, '');
  return CHARACTER_COLORS[key] || CHARACTER_COLORS.default;
};

// Get level color based on level ranges
const getLevelColor = (level: number): string => {
  if (level >= 50) return 'from-purple-500 to-pink-500'; // Legendary
  if (level >= 30) return 'from-orange-500 to-red-500'; // Epic
  if (level >= 15) return 'from-blue-500 to-cyan-500'; // Rare
  if (level >= 5) return 'from-green-500 to-emerald-500'; // Uncommon
  return 'from-neutral-400 to-neutral-500'; // Common
};

interface CharacterInfo {
  name: string;
  variantLabel?: string;
  imageUrl?: string;
  variantId?: string;
}

interface ProfileHeaderProps {
  stats: UserStats;
  userName: string;
  userImageUrl?: string;
  character?: CharacterInfo | null;
  competitorStats?: CompetitorStats | null;
  className?: string;
  onEditCharacter?: () => void;
  onEditName?: () => void;
}

/**
 * ProfileHeader Component
 *
 * Displays the user's profile header with:
 * - Gradient background based on character colors (or default for bettors)
 * - Character image for players / Clerk avatar for bettors
 * - User name and character info
 * - Level badge + XP progress bar
 * - Monthly rank + current streak
 */
const ProfileHeader: FC<ProfileHeaderProps> = ({
  stats,
  userName,
  userImageUrl,
  character,
  competitorStats,
  className = '',
  onEditCharacter,
  onEditName,
}) => {
  const isPlayer = !!character;
  const colors = getCharacterColors(character?.name);
  const levelColor = getLevelColor(stats.level);

  // Calculate XP progress
  const getXPForCurrentLevel = (lvl: number): number => {
    if (lvl <= 1) return 0;
    return 100 * (lvl - 1) * lvl / 2;
  };

  const xpForCurrentLevel = getXPForCurrentLevel(stats.level);
  const xpInCurrentLevel = stats.xp - xpForCurrentLevel;
  const xpNeededForLevel = stats.xpForNextLevel - xpForCurrentLevel;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} p-6 ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-black/20 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Character/Avatar Image */}
        <div className="relative flex-shrink-0">
          {isPlayer && character?.imageUrl ? (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <Image
                src={character.imageUrl}
                alt={character.name}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
              {/* Edit button */}
              {onEditCharacter && (
                <button
                  type="button"
                  onClick={onEditCharacter}
                  className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-white transition-colors border border-white/20"
                  aria-label="Changer de personnage"
                >
                  <MdEdit className="text-lg sm:text-xl" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl">
              {userImageUrl ? (
                <Image
                  src={userImageUrl}
                  alt={userName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          {/* Character name + variant (for players) */}
          {isPlayer && character && (
            <p className="text-white/80 text-sm font-medium mb-1">
              {character.name}
              {character.variantLabel && ` ${character.variantLabel}`}
            </p>
          )}

          {/* User name */}
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {userName}
            </h2>
            {onEditName && (
              <button
                type="button"
                onClick={onEditName}
                className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Modifier le nom"
              >
                <MdEdit className="text-sm" />
              </button>
            )}
          </div>

          {/* Level Badge + XP */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            {/* Level Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${levelColor} shadow-lg`}
            >
              <span className="text-xs font-medium text-white/90">NIV.</span>
              <span className="text-lg font-bold text-white">{stats.level}</span>
            </div>

            {/* XP Progress */}
            <div className="flex-1 w-full max-w-[200px] sm:max-w-[250px]">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{xpInCurrentLevel.toLocaleString()} XP</span>
                <span>{xpNeededForLevel.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/90 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.xpProgressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {/* Monthly Rank */}
            {stats.monthlyRank && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm">
                <span className="text-sm">🏆</span>
                <span className="text-sm font-semibold text-white">
                  #{stats.monthlyRank}
                </span>
                <span className="text-xs text-white/70">ce mois</span>
              </div>
            )}

            {/* Current Bet Streak */}
            {stats.currentMonthlyStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm">
                <span className="text-sm">🎲</span>
                <span className="text-sm font-semibold text-white">
                  {stats.currentMonthlyStreak}
                </span>
                <span className="text-xs text-white/70">streak paris</span>
              </div>
            )}

            {/* Current Play Streak (players only) */}
            {isPlayer && (competitorStats?.playStreak ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-sm">
                <span className="text-sm">🏎️</span>
                <span className="text-sm font-semibold text-white">
                  {competitorStats!.playStreak}j
                </span>
                <span className="text-xs text-white/70">streak courses</span>
              </div>
            )}

            {/* Win Rate for bettors */}
            {!isPlayer && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm">
                <span className="text-sm">📊</span>
                <span className="text-sm font-semibold text-white">
                  {(stats.winRate ?? 0).toFixed(0)}%
                </span>
                <span className="text-xs text-white/70">win rate</span>
              </div>
            )}
          </div>

          {/* Current Title */}
          {stats.currentTitle && (
            <p className="mt-3 text-sm text-white/80 italic">
              « {stats.currentTitle} »
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
