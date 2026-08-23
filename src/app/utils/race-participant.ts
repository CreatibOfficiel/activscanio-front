import type { Competitor } from '@/app/models/Competitor';
import type { RaceResult } from '@/app/models/RaceResult';

export function historicalCompetitor(result: RaceResult): Competitor | null {
  if (!result.competitorFirstName) return null;
  return {
    id: result.competitorId,
    firstName: result.competitorFirstName,
    lastName: result.competitorLastName ?? '',
    profilePictureUrl: '',
    rating: 0,
    rd: 0,
    vol: 0,
    status: 'alumni',
    characterVariant: result.characterVariantIdAtRace ? {
      id: result.characterVariantIdAtRace,
      label: result.characterVariantLabelAtRace ?? '',
      imageUrl: result.characterImageUrlAtRace ?? '',
      baseCharacter: { id: result.characterVariantIdAtRace, name: result.characterNameAtRace ?? '' },
    } : null,
  };
}
