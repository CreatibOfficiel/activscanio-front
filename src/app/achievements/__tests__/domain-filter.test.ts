import { readFileSync } from 'fs';
import { join } from 'path';
import { AchievementDomain } from '../../models/Achievement';

/**
 * The achievement domain filter.
 *
 * The page defaulted a domain-less achievement to BETTING, so anything the
 * API sent without a domain was only reachable by tapping a tab for a
 * feature that no longer exists. Nothing errored — the achievements were
 * simply invisible on every other tab.
 *
 * Read at source level rather than rendered: the page pulls Radix Tabs,
 * motion and Clerk, and mounting all three to assert on two constants would
 * be a disproportionate amount of machinery for what is a constant check.
 */
describe('achievements domain filter', () => {
  const source = readFileSync(
    join(__dirname, '..', 'page.tsx'),
    'utf8',
  );

  it('no longer knows about the betting domain', () => {
    expect(source).not.toMatch(/AchievementDomain\.BETTING/);
  });

  it('defaults a domain-less achievement to racing', () => {
    // The fallback decides which tab an achievement appears under. Pointing
    // it at a removed domain hides those achievements everywhere.
    expect(source).toMatch(/a\.domain \|\| AchievementDomain\.RACING/);
  });

  it('offers a ping-pong tab', () => {
    expect(source).toMatch(/AchievementDomain\.PINGPONG/);
    expect(source).toMatch(/label: 'Ping-Pong'/);
  });

  it('offers no Paris tab', () => {
    expect(source).not.toMatch(/label: 'Paris'/);
  });
});

describe('AchievementDomain', () => {
  it('holds exactly the two live domains', () => {
    // Mirrors the API enum. A third value here that the backend does not
    // send would render an empty tab.
    expect(Object.values(AchievementDomain).sort()).toEqual([
      'PINGPONG',
      'RACING',
    ]);
  });
});
