import type { Competitor } from '@/app/models/Competitor';
import type { RaceResult } from '@/app/models/RaceResult';

/**
 * The competitor to display for one race result.
 *
 * The race snapshot (name + character, frozen at the time of the race) wins
 * over the mutable profile: reassigning a character after someone leaves must
 * never rewrite an old card.
 *
 * The profile picture is the one exception. It is NOT snapshotted — the
 * backend writes `competitorFirstName` / `characterVariant*AtRace` on every
 * result but has no `profilePictureUrl` column to freeze, so the snapshot
 * carried an empty string and every avatar on the race list fell back to
 * initials. The picture is therefore read from the live profile when one is
 * still known, which is also the behaviour people expect: change your photo
 * and it updates everywhere, unlike your character at a given race.
 *
 * Alumni keep an empty picture — there is no live profile left to read from,
 * and `UserAvatar` renders initials for them as before.
 *
 * @param result - The race result carrying the snapshot
 * @param live - The current profile for this competitor, if still present
 */
export function historicalCompetitor(
  result: RaceResult,
  live?: Competitor,
): Competitor | null {
  if (!result.competitorFirstName) return null;
  return {
    id: result.competitorId,
    firstName: result.competitorFirstName,
    lastName: result.competitorLastName ?? '',
    profilePictureUrl: live?.profilePictureUrl ?? '',
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
