import {
  BOTTOM_NAV_HIDDEN_PATHS,
  SIDEBAR_HIDDEN_PATHS,
  FULLSCREEN_PATHS,
  AUTH_CHROME_PATHS,
  ONBOARDING_EXEMPT_PATHS,
  PUBLIC_ROUTE_MATCHERS,
} from '../routes';
import { matchesAnyPath } from '@/app/utils/path-matching';

/**
 * These lists replace hardcoded arrays that lived in six components. The tests
 * below pin the exact contents that shipped, so the extraction cannot silently
 * change which routes hide the chrome.
 */

describe('BOTTOM_NAV_HIDDEN_PATHS', () => {
  it('matches the list that shipped in BottomNav', () => {
    expect([...BOTTOM_NAV_HIDDEN_PATHS]).toEqual([
      '/onboarding',
      '/races/add',
      '/pingpong/add',
      '/races/score-setup',
      '/races/summary',
      '/competitors/add',
      '/competitors/edit',
      '/tv',
    ]);
  });

  it('hides the nav on every task flow', () => {
    expect(matchesAnyPath('/races/add', BOTTOM_NAV_HIDDEN_PATHS)).toBe(true);
    expect(matchesAnyPath('/competitors/edit/abc', BOTTOM_NAV_HIDDEN_PATHS)).toBe(
      true,
    );
    expect(matchesAnyPath('/tv/display', BOTTOM_NAV_HIDDEN_PATHS)).toBe(true);
  });

  it('leaves the nav visible on browsing routes', () => {
    expect(matchesAnyPath('/', BOTTOM_NAV_HIDDEN_PATHS)).toBe(false);
    expect(matchesAnyPath('/races', BOTTOM_NAV_HIDDEN_PATHS)).toBe(false);
    expect(matchesAnyPath('/profile', BOTTOM_NAV_HIDDEN_PATHS)).toBe(false);
  });
});

describe('SIDEBAR_HIDDEN_PATHS', () => {
  it('matches the shorter list that shipped in Sidebar', () => {
    // Deliberately kept as-is for now: aligning it with the bottom nav is a
    // behaviour change, handled in its own commit.
    expect([...SIDEBAR_HIDDEN_PATHS]).toEqual([
      '/onboarding',
      '/races/add',
      '/pingpong/add',
      '/races/score-setup',
      '/races/summary',
      '/tv',
    ]);
  });

  it('still shows the sidebar on the flows the bottom nav hides', () => {
    // Documents the current divergence rather than endorsing it.
    for (const path of ['/competitors/add', '/competitors/edit']) {
      expect(matchesAnyPath(path, SIDEBAR_HIDDEN_PATHS)).toBe(false);
      expect(matchesAnyPath(path, BOTTOM_NAV_HIDDEN_PATHS)).toBe(true);
    }
  });
});

describe('FULLSCREEN_PATHS', () => {
  it('matches the list that shipped in MainContent', () => {
    expect([...FULLSCREEN_PATHS]).toEqual([
      '/onboarding',
      '/races/add',
      '/pingpong/add',
      '/races/score-setup',
      '/races/summary',
      '/tv',
    ]);
  });

  it('stays in sync with the sidebar, which shares its layout concern', () => {
    expect([...FULLSCREEN_PATHS]).toEqual([...SIDEBAR_HIDDEN_PATHS]);
  });
});

describe('AUTH_CHROME_PATHS', () => {
  it('covers only the Clerk pages', () => {
    expect([...AUTH_CHROME_PATHS]).toEqual(['/sign-in', '/sign-up']);
  });

  it('does not include /tv/display, which keeps its own chrome handling', () => {
    expect(matchesAnyPath('/tv/display', AUTH_CHROME_PATHS)).toBe(false);
  });
});

describe('ONBOARDING_EXEMPT_PATHS', () => {
  it('matches the list that shipped in OnboardingGuard', () => {
    expect([...ONBOARDING_EXEMPT_PATHS]).toEqual([
      '/tv/display',
      '/sign-in',
      '/sign-up',
    ]);
  });
});

describe('PUBLIC_ROUTE_MATCHERS', () => {
  it('matches the Clerk matchers that shipped in middleware', () => {
    expect([...PUBLIC_ROUTE_MATCHERS]).toEqual([
      '/tv/display',
      '/api/webhooks/clerk',
      '/sign-in(.*)',
      '/sign-up(.*)',
    ]);
  });
});

describe('routes module', () => {
  it('has no imports, so middleware can use it on the Edge runtime', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'routes.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/^\s*import\s/m);
  });
});
