export enum DuelStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  RESOLVED = 'resolved',
  AWAITING_SETTLEMENT = 'awaiting_settlement',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
  DECLINED = 'declined',
}

export enum StakeType {
  BEER = 'beer',
  PINT = 'pint',
  MARS = 'mars',
  MEAL = 'meal',
  CUSTOM = 'custom',
}

export enum DuelConditionType {
  RANK_WINS = 'rank_wins',
  MARGIN_GREATER = 'margin_greater',
  EXACT_TIE = 'exact_tie',
  MARGIN_BETWEEN = 'margin_between',
}

export const STAKE_OPTIONS: {
  type: StakeType;
  emoji: string;
  label: string;
}[] = [
  { type: StakeType.BEER, emoji: '🍺', label: 'Une bière' },
  { type: StakeType.MARS, emoji: '🍫', label: 'Un Mars' },
  { type: StakeType.MEAL, emoji: '🍽️', label: 'Un repas' },
  { type: StakeType.CUSTOM, emoji: '🎯', label: 'Autre…' },
];

export interface DuelUser {
  id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
}

export interface Duel {
  id: string;
  challengerUserId: string;
  challengedUserId: string;
  challengerCompetitorId: string;
  challengedCompetitorId: string;
  challengerUser?: DuelUser;
  challengedUser?: DuelUser;
  stake?: number | null;
  stakeType: StakeType;
  stakeLabel?: string | null;
  stakeEmoji?: string | null;
  conditionType?: DuelConditionType | null;
  conditionValue?: number | null;
  status: DuelStatus;
  raceEventId?: string;
  winnerUserId?: string;
  loserUserId?: string;
  targetBettingWeekId?: string | null;
  proofPhotoUrl?: string | null;
  proofUploadedAt?: string | null;
  settledAt?: string | null;
  createdAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
  expiresAt: string;
  resolveDeadline?: string | null;
}

export interface CreateDuelParams {
  stakeType: StakeType;
  stakeLabel?: string;
  conditionType?: DuelConditionType;
  conditionValue?: number;
}

export interface DuelBalanceItem {
  stakeType: StakeType;
  stakeEmoji: string;
  stakeLabel: string | null;
  count: number;
}

export interface DuelBalance {
  counterpart: DuelUser;
  owedToMe: DuelBalanceItem[];
  iOwe: DuelBalanceItem[];
}
