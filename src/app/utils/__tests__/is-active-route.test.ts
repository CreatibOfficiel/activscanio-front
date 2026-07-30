import { isActiveRoute } from '../is-active-route';

describe('isActiveRoute', () => {
  it('is active on an exact match', () => {
    expect(isActiveRoute('/races', '/races')).toBe(true);
  });

  it('is inactive on a different route', () => {
    expect(isActiveRoute('/profile', '/races')).toBe(false);
  });

  it('is inactive on a sub-route when no activePaths are given', () => {
    // The home entry has no activePaths, so it must not light up elsewhere.
    expect(isActiveRoute('/races', '/')).toBe(false);
  });

  it('is active on a sub-route listed in activePaths', () => {
    expect(isActiveRoute('/races/add', '/races', ['/races'])).toBe(true);
  });

  it('is active on any of several activePaths', () => {
    // Profile lights up for /achievements too.
    expect(
      isActiveRoute('/achievements', '/profile', ['/profile', '/achievements']),
    ).toBe(true);
  });

  it('is inactive when no activePath matches', () => {
    expect(isActiveRoute('/seasons', '/profile', ['/profile'])).toBe(false);
  });

  it('does not light up on a longer sibling segment', () => {
    // Regression guard: startsWith would have matched '/racesomething'.
    expect(isActiveRoute('/racesomething', '/races', ['/races'])).toBe(false);
  });
});
