export enum LiveBetStatus {
  DETECTING = 'detecting',
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export interface DetectedCharacter {
  characterName: string;
  competitorId: string | null;
  confidence: number;
}

export interface LiveBet {
  id: string;
  userId: string;
  competitorId: string;
  oddAtBet: number;
  photoUrl: string;
  detectedCharacters: DetectedCharacter[] | null;
  confirmedCompetitorIds: string[] | null;
  detectionExpiresAt: string | null;
  expiresAt: string;
  raceEventId: string | null;
  status: LiveBetStatus;
  pointsEarned: number | null;
  cancellationReason: string | null;
  createdAt: string;
  resolvedAt: string | null;
  competitor?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}
