import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Source-level guard for the homepage leaderboard wiring.
 *
 * The homepage cannot be rendered in jsdom at a reasonable cost: it pulls in
 * the ranking animation state machine (localStorage, matchMedia, a four-phase
 * setTimeout sequence), motion/react, Clerk-gated fetching and one
 * CompetitorDetailModal per row. Worse, mocking `useRankingAnimation` would
 * stub out `showUniformCards`, which is itself part of the wiring a render
 * test would claim to protect.
 *
 * So this file checks the one failure mode TypeScript cannot catch: every rank
 * map is a `Map<string, number>` and every tier is a `Competitor[]`, so
 * handing `calibratingRanks` to the inactive rows compiles cleanly and ships a
 * wrong leaderboard.
 *
 * These assertions are deliberately narrow. Behavioural coverage of the same
 * segmentation values lives in
 * `src/app/tv/display/components/__tests__/CompetitorRankingsView.test.tsx`,
 * which renders a real DOM.
 */

const SOURCE = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8');

/**
 * Slice the source between two structural anchors — `.map()` calls and JSX
 * tags, never comments, so the guard survives comment edits.
 */
function blockBetween(startAnchor: string, endAnchor?: string): string {
  const start = SOURCE.indexOf(startAnchor);
  if (start === -1) {
    throw new Error(`Anchor not found in page.tsx: "${startAnchor}"`);
  }
  if (!endAnchor) return SOURCE.slice(start);

  const end = SOURCE.indexOf(endAnchor, start + startAnchor.length);
  return SOURCE.slice(start, end === -1 ? SOURCE.length : end);
}

describe('Home — leaderboard wiring', () => {
  it('feeds the podium with the top three and the shared trends map', () => {
    const block = blockBetween('<ElevatedPodium', '/>');
    expect(block).toMatch(/topThree=\{topThree\}/);
    expect(block).toMatch(/trends=\{trends\}/);
    // Handing it the full confirmed list would render twelve podium cards.
    expect(block).not.toMatch(/topThree=\{confirmed\}/);
  });

  it('ranks the league rows with the confirmed rank map', () => {
    const block = blockBetween('leagueGroups.map', 'inactive.map');
    expect(block).toMatch(/group\.items\.map/);
    expect(block).toMatch(/rank=\{confirmedRanks\.get\(competitor\.id\)/);
    expect(block).toMatch(/trend=\{trends\.get\(competitor\.id\)\}/);
    expect(block).not.toMatch(/inactiveRanks/);
    expect(block).not.toMatch(/calibratingRanks/);
  });

  it('ranks the inactive rows with the inactive rank map', () => {
    const block = blockBetween('inactive.map', 'calibrating.map');
    expect(block).toMatch(/rank=\{inactiveRanks\.get\(competitor\.id\)/);
    expect(block).not.toMatch(/confirmedRanks/);
    expect(block).not.toMatch(/calibratingRanks/);
  });

  it('ranks the calibrating rows with the calibrating rank map', () => {
    const block = blockBetween('calibrating.map');
    expect(block).toMatch(/rank=\{calibratingRanks\.get\(competitor\.id\)/);
    expect(block).not.toMatch(/confirmedRanks/);
    expect(block).not.toMatch(/inactiveRanks/);
  });

  it('offsets the inactive and calibrating rank fallbacks past the confirmed block', () => {
    const inactiveBlock = blockBetween('inactive.map', 'calibrating.map');
    expect(inactiveBlock).toMatch(/\?\? confirmed\.length \+ index \+ 1/);

    const calibratingBlock = blockBetween('calibrating.map');
    expect(calibratingBlock).toMatch(/\?\? confirmed\.length \+ index \+ 1/);
  });

  it('excludes the podium league from the league groups', () => {
    // Either the legacy inline groupByLeague call or the migrated hook option
    // must drop the Champions league, otherwise the top three render twice.
    expect(SOURCE).toMatch(
      /excludePodiumFromLeagues:\s*true|groupByLeague\([\s\S]{0,200}?true/,
    );
  });

  it('drives the ranking animation from the confirmed list', () => {
    const block = blockBetween('useRankingAnimation({', '})');
    expect(block).toMatch(/competitors:\s*confirmed/);
  });

  it('counts the three tiers separately in the header', () => {
    expect(SOURCE).toMatch(/\{confirmed\.length\}/);
    expect(SOURCE).toMatch(/inactive\.length/);
    expect(SOURCE).toMatch(/calibrating\.length/);
  });
});
