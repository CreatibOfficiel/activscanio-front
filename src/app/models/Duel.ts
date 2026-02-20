export enum DuelStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  DECLINED = 'declined',
}

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
  stake: number;
  status: DuelStatus;
  raceEventId?: string;
  winnerUserId?: string;
  loserUserId?: string;
  createdAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
  expiresAt: string;
}
