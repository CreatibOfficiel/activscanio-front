import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The profile overview.
 *
 * It shipped a panel titled "Mes paris cette saison" showing bets placed,
 * bets won, points and a betting rank — all of them permanent zeroes since
 * the betting system was removed. Nothing errored; the screen simply told
 * every user they had done nothing, in a section about a feature that no
 * longer exists.
 *
 * Read at source level: the component pulls Clerk, motion and a lazy tree,
 * and the assertions here are about which fields are referenced at all.
 */
describe('OverviewTab', () => {
  const source = readFileSync(
    join(__dirname, '..', 'OverviewTab.tsx'),
    'utf8',
  );

  it('no longer renders the betting panel', () => {
    expect(source).not.toMatch(/Mes paris cette saison/);
  });

  it.each([
    'monthlyBetsPlaced',
    'monthlyBetsWon',
    'monthlyPoints',
    'monthlyRank',
  ])('no longer reads %s', (field) => {
    // These come back as zero from an API that no longer computes them.
    expect(source).not.toMatch(new RegExp(`stats\\.${field}`));
  });

  it('shows the play streak the page already fetches', () => {
    // playStreak and bestPlayStreak were loaded by profile/page.tsx and
    // dropped on the floor: the local interface simply omitted them.
    expect(source).toMatch(/playStreak/);
    expect(source).toMatch(/bestPlayStreak/);
  });

  it('gives ping-pong a block of its own', () => {
    // The tab held two Mario Kart panels and nothing else, so someone who
    // plays both sports saw half their profile.
    expect(source).toMatch(/Mon ping-pong/);
  });

  it.each(['wins', 'matchCount', 'conservativeScore', 'bestStreak'])(
    'reads %s off the ping-pong player',
    (field) => {
      expect(source).toMatch(new RegExp(`pingpongPlayer\\.${field}`));
    },
  );

  it('does not invent a rank while the player is calibrating', () => {
    // The API withholds the rank until calibration ends (`rank: null`).
    // Deriving one from the rating here would contradict every other
    // ping-pong surface, which all show the absence instead.
    expect(source).toMatch(/pingpongPlayer\.rank === null/);
  });

  it('imports the shared CompetitorStats rather than redeclaring it', () => {
    // Two interfaces of the same name, one file apart, silently disagreeing
    // about which fields exist. The narrower copy is why the streaks were
    // invisible.
    expect(source).not.toMatch(/interface CompetitorStats \{/);
    expect(source).toMatch(/import type \{[\s\S]*?CompetitorStats/);
  });
});
