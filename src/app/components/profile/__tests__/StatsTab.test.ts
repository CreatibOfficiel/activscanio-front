import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * The statistics tab.
 *
 * Four panels here were built entirely on betting data — bets placed, win
 * rate on bets, average odds played, favourite competitors ranked by how
 * often you bet on them. They called three endpoints that no longer exist
 * (`/achievements/stats/:id/history`, `/comparison`, `/advanced`), each
 * caught its own failure locally, and so showed "Impossible de charger…"
 * forever rather than crashing.
 *
 * They are gone rather than reimplemented: the numbers they display cannot
 * be computed from anything the app still records. Implementing the
 * endpoints would mean inventing data.
 *
 * Read at source level: StatsTab lazy-loads its children through Suspense
 * and pulls Clerk, so a render test would need the whole tree mounted to
 * assert on which panels exist.
 */
describe('StatsTab', () => {
  const source = readFileSync(
    join(__dirname, '..', 'StatsTab.tsx'),
    'utf8',
  );

  const REMOVED_PANELS = [
    'XPProgressChart',
    'WinRateChart',
    'ComparisonCard',
    'AdvancedStatsPanel',
  ];

  it.each(REMOVED_PANELS)('no longer mounts %s', (panel) => {
    expect(source).not.toMatch(new RegExp(panel));
  });

  it.each(REMOVED_PANELS)('no longer ships %s', (panel) => {
    // The component files themselves are gone, not just unmounted — an
    // orphaned component is a landmine for whoever wires it back up.
    expect(
      existsSync(join(__dirname, '..', '..', 'stats', `${panel}.tsx`)),
    ).toBe(false);
  });

  const DEAD_BETTING_CARDS = [
    'Paris Placés',
    'Boosts',
    'Cotes Élevées',
  ];

  it.each(DEAD_BETTING_CARDS)('no longer shows the "%s" card', (label) => {
    // Permanent zeroes: the API stopped computing these when betting went.
    // A card reading 0 is worse than no card — it says you did nothing.
    expect(source).not.toMatch(new RegExp(`label="${label}"`));
  });

  it.each([
    'betsPlaced',
    'boostsUsed',
    'highOddsWins',
    // Outlived the original clean-up. `/achievements/stats/:userId` does not
    // send it — verified against the live API, which returns 24 fields and
    // none of them this one — so the "Saisons Consécutives" card read
    // `undefined` and rendered its label above an empty space.
    'consecutiveMonthlyWins',
  ])('no longer reads %s', (field) => {
    expect(source).not.toMatch(new RegExp(`\\b${field}\\b`));
  });

  it('shows race data in their place', () => {
    // The tab is labelled "Statistiques"; it should hold statistics that
    // are true rather than statistics about a removed feature.
    expect(source).toMatch(/competitorStats/);
  });

  it('keeps the stats that still have data behind them', () => {
    // XP and level are still computed by the API and still land on this tab.
    for (const label of ['XP Total', 'Niveau']) {
      expect(source).toMatch(new RegExp(`label="${label}"`));
    }
  });

  it('no longer shows the blank "Saisons Consécutives" card', () => {
    // Not deleted outright: the figure people wanted was seasons PLAYED in a
    // row, which is derivable from the season archives. It moved to
    // ConsecutiveSeasonsSection, split per sport — Mario Kart has run since
    // season 1 and ping-pong only since season 7, so one combined number
    // would mean "seasons of whichever sport existed at the time".
    expect(source).not.toMatch(/label="Saisons Consécutives"/);
  });

  it('still renders the stats it can actually compute', () => {
    // The regression this change could cause: deleting one block too many.
    expect(source).toMatch(/StatCard/);
  });
});

describe('StatsRepository', () => {
  const source = readFileSync(
    join(__dirname, '..', '..', '..', 'repositories', 'StatsRepository.ts'),
    'utf8',
  );

  it.each([
    ['history', /stats\/\$\{userId\}\/history/],
    ['comparison', /stats\/\$\{userId\}\/comparison/],
    ['advanced', /stats\/\$\{userId\}\/advanced/],
  ])('no longer calls the missing %s endpoint', (_name, pattern) => {
    // Nest matches on exact segment count, so these 404 against the live
    // API. A URL is a string, so nothing else can catch this.
    expect(source).not.toMatch(pattern);
  });

  it('keeps the level-rewards calls, which do exist', () => {
    // These are still wired to LevelRewardsPanel and still work.
    expect(source).toMatch(/getUserLevelRewards/);
    expect(source).toMatch(/getAllLevelRewards/);
  });
});
