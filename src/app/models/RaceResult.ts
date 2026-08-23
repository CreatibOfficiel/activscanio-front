export interface RaceResult {
  competitorId: string;
  rank12: number; // rank out of 12
  score: number; // max 60
  ratingDelta?: number | null; // null for legacy races
  competitorFirstName?: string | null;
  competitorLastName?: string | null;
  characterVariantIdAtRace?: string | null;
  characterNameAtRace?: string | null;
  characterVariantLabelAtRace?: string | null;
  characterImageUrlAtRace?: string | null;
}
