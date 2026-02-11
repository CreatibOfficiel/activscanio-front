/**
 * Achievement category enum
 */
export enum AchievementCategory {
  PRECISION = 'PRECISION',
  REGULARITY = 'REGULARITY',
  AUDACITY = 'AUDACITY',
  RANKING = 'RANKING',
}

/**
 * Achievement domain enum
 * Distinguishes between betting achievements and racing achievements
 */
export enum AchievementDomain {
  BETTING = 'betting',
  RACING = 'racing',
}

/**
 * Achievement rarity enum
 */
export enum AchievementRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

/**
 * Achievement interface
 */
export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  unlocksTitle: string | null;

  // Domain field to distinguish betting vs racing achievements
  domain?: AchievementDomain;

  // Progressive chain fields
  prerequisiteAchievementKey?: string | null;
  tierLevel?: number; // 0 for standalone, 1-4 for chain tiers
  chainName?: string | null; // e.g., "perfect_podium_chain"

  // Temporary achievement fields
  isTemporary?: boolean;
  canBeLost?: boolean;

  // User-specific fields (when fetched with user context)
  isUnlocked?: boolean;
  unlockedAt?: Date | null;
  progress?: number; // 0-100
}

/**
 * User achievement interface
 */
export interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: Date;
  notificationSent: boolean;
  achievement: {
    key: string;
    name: string;
    description: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    icon: string;
    xpReward: number;
    unlocksTitle: string | null;
  };
}

/**
 * User stats interface
 */
export interface UserStats {
  userId: string;

  // XP and Level
  xp: number;
  level: number;
  xpForNextLevel: number;
  xpProgressPercent: number;
  currentTitle: string | null;

  // Achievement stats
  totalAchievements: number;
  unlockedAchievements: number;
  achievementProgress: number;
  lastAchievementUnlockedAt: Date | null;

  // Betting stats (lifetime)
  totalBetsPlaced: number;
  totalBetsWon: number;
  totalPerfectBets: number;
  totalPoints: number;
  winRate: number;

  // Streaks
  currentMonthlyStreak: number;
  longestLifetimeStreak: number;
  currentLifetimeStreak: number;

  // Monthly stats
  monthlyBetsPlaced: number;
  monthlyBetsWon: number;
  monthlyPerfectBets: number;
  monthlyPoints: number;
  monthlyRank: number | null;

  // Ranking
  bestMonthlyRank: number | null;
  consecutiveMonthlyWins: number;

  // Special
  totalBoostsUsed: number;
  highOddsWins: number;
  boostedHighOddsWins: number;
}

/**
 * Streak warning status from the API
 */
export interface StreakWarningStatus {
  bettingStreak: {
    atRisk: boolean;
    currentStreak: number;
    weekClosesAt: string | null;
  };
  playStreak: {
    atRisk: boolean;
    currentStreak: number;
    missedBusinessDays: number;
  };
}

/**
 * Achievement query parameters
 */
export interface AchievementQueryParams {
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  unlockedOnly?: boolean;
  lockedOnly?: boolean;
}

/**
 * Equip title DTO
 */
export interface EquipTitleDto {
  achievementKey: string;
}

/**
 * Equip title response
 */
export interface EquipTitleResponse {
  userId: string;
  currentTitle: string | null;
  equippedAt: Date;
  message: string;
}
