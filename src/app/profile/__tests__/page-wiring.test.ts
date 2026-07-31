import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Source-level guard for the profile page's tab wiring.
 *
 * The page cannot be rendered cheaply in jsdom: it fetches stats,
 * achievements, user data and competitor stats through four repositories
 * behind Clerk, opens a character modal, and reads `AppContext` for the
 * whole leaderboard. Mocking all of it would leave a test that asserts on
 * mocks rather than on the wiring.
 *
 * What this checks is the failure TypeScript cannot: `ProfileTab` is a
 * union of string literals read from a URL query param, so widening it
 * touches the guard in `getInitialTab`, the render branches, and the
 * conditions that decide which tabs exist. Every one of those is a place
 * where a correct-compiling change ships a wrong screen.
 *
 * Behavioural coverage of the tab bar itself lives in
 * `src/app/components/profile/__tests__/ProfileTabs.test.tsx`, which renders
 * a real DOM.
 */

const SOURCE = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8');

describe('Profile — tab wiring', () => {
  describe('the four existing tabs are untouched', () => {
    it.each(['overview', 'stats', 'achievements', 'races'])(
      'still accepts and renders the %s tab',
      (tab) => {
        expect(SOURCE).toContain(`activeTab === '${tab}'`);
      },
    );

    it('still guards the query param for the three non-default tabs', () => {
      // 'overview' is the fallback and so is not in the guard.
      expect(SOURCE).toMatch(/tabParam === 'stats'/);
      expect(SOURCE).toMatch(/tabParam === 'achievements'/);
      expect(SOURCE).toMatch(/tabParam === 'races'/);
    });

    it('still falls back to overview for an unknown query param', () => {
      expect(SOURCE).toMatch(/return 'overview'/);
    });

    it('still gates the races tab on the player role', () => {
      expect(SOURCE).toMatch(/showRacesTab=\{userData\?\.role === 'player'\}/);
    });
  });

  describe('the ping-pong tab', () => {
    it('is accepted from the query param', () => {
      // Without this the tab is unreachable by link, and a deep link into
      // it silently lands on the overview instead.
      expect(SOURCE).toMatch(/tabParam === 'ping-pong'/);
    });

    it('is gated on following the sport AND having a competitor', () => {
      // Both halves matter. The ping-pong API is keyed on `competitorId`,
      // so a follower with no competitor opens a tab that can only fail.
      expect(SOURCE).toMatch(/showPingpongTab=\{[^}]*showsPingpong/);
      expect(SOURCE).toMatch(/showPingpongTab=\{[^}]*competitorId/);
    });

    it('renders only with a competitor id in hand', () => {
      expect(SOURCE).toMatch(
        /activeTab === 'ping-pong' && userData\?\.competitorId/,
      );
    });

    it('is passed the competitor id, not the user id', () => {
      // Both are strings, so the wrong one compiles and returns a 404 that
      // the tab would render as "never played".
      const start = SOURCE.indexOf("activeTab === 'ping-pong'");
      expect(start).toBeGreaterThan(-1);
      const block = SOURCE.slice(start, start + 400);
      expect(block).toMatch(/competitorId=\{userData\.competitorId\}/);
    });

    it('reads the sport preference from the shared hook', () => {
      // Not a second copy of the 'both' default, which would drift.
      expect(SOURCE).toMatch(/useSportPreference\(\)/);
    });
  });
});
