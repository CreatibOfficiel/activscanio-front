import { AchievementCategory, AchievementRarity } from './Achievement';

export enum BetPosition {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
}

export enum BetStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export interface BetPickCompetitor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface BetPick {
  id: string;
  betId: string;
  competitorId: string;
  competitor?: BetPickCompetitor;
  position: BetPosition;
  oddAtBet: number;
  hasBoost: boolean;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface Bet {
  id: string;
  userId: string;
  bettingWeekId: string;
  placedAt: string;
  isFinalized: boolean;
  status: BetStatus;
  pointsEarned?: number;
  picks: BetPick[];
  achievementsUnlocked?: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    icon: string;
    xpReward: number;
    unlocksTitle: string | null;
    unlockedAt: Date;
  }>;
}

export interface CreateBetDto {
  picks: {
    competitorId: string;
    position: BetPosition;
    hasBoost: boolean;
  }[];
}
