import { historicalCompetitor } from '../race-participant';
import type { Competitor } from '@/app/models/Competitor';
import type { RaceResult } from '@/app/models/RaceResult';

/**
 * The race list showed initials instead of photos for every player: the
 * backend snapshots a result's name and character but has no column for the
 * profile picture, so `historicalCompetitor` returned an empty one and won
 * over the live profile that did have it. These tests pin the split — snapshot
 * for name and character, live profile for the picture.
 */
const result = (over: Partial<RaceResult> = {}): RaceResult => ({
  competitorId: 'c1',
  rank12: 1,
  score: 60,
  competitorFirstName: 'Nils',
  competitorLastName: 'Petit',
  ...over,
});

const live = (over: Partial<Competitor> = {}): Competitor =>
  ({
    id: 'c1',
    firstName: 'Nils',
    lastName: 'Petit',
    profilePictureUrl: 'https://azule.ascan.io/images/profiles/nils.jpeg',
    ...over,
  }) as Competitor;

describe('historicalCompetitor', () => {
  it('takes the picture from the live profile', () => {
    expect(historicalCompetitor(result(), live())?.profilePictureUrl).toBe(
      'https://azule.ascan.io/images/profiles/nils.jpeg',
    );
  });

  it('keeps the snapshot name even when the live profile was renamed', () => {
    const renamed = live({ firstName: 'Nicolas', lastName: 'Grand' });
    const comp = historicalCompetitor(result(), renamed);
    expect(comp?.firstName).toBe('Nils');
    expect(comp?.lastName).toBe('Petit');
  });

  it('keeps the snapshot character, not the reassigned one', () => {
    const res = result({
      characterVariantIdAtRace: 'v-yoshi',
      characterNameAtRace: 'Yoshi',
      characterVariantLabelAtRace: 'Yoshi vert',
      characterImageUrlAtRace: 'https://cdn/yoshi.webp',
    });
    const reassigned = live({
      characterVariant: {
        id: 'v-mario',
        label: 'Mario',
        imageUrl: 'https://cdn/mario.webp',
        baseCharacter: { id: 'b-mario', name: 'Mario' },
      },
    } as Partial<Competitor>);
    expect(historicalCompetitor(res, reassigned)?.characterVariant?.id).toBe('v-yoshi');
  });

  it('falls back to an empty picture for an alumni with no live profile', () => {
    expect(historicalCompetitor(result())?.profilePictureUrl).toBe('');
  });

  it('returns null when the result carries no snapshot', () => {
    expect(historicalCompetitor(result({ competitorFirstName: null }), live())).toBeNull();
  });
});
