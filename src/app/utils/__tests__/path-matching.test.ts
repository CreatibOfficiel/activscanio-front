import { matchPath, matchesAnyPath } from '../path-matching';

describe('matchPath', () => {
  it('matches an exact path', () => {
    expect(matchPath('/races/add', '/races/add')).toBe(true);
  });

  it('matches a descendant path', () => {
    expect(matchPath('/races/add/step-2', '/races/add')).toBe(true);
  });

  it('does not match a longer sibling segment', () => {
    // This is the regression `startsWith` allowed: '/races/additional'
    // used to be treated as being inside the '/races/add' flow.
    expect(matchPath('/races/additional', '/races/add')).toBe(false);
  });

  it('does not match a shorter path', () => {
    expect(matchPath('/races', '/races/add')).toBe(false);
  });

  it('does not match an unrelated path', () => {
    expect(matchPath('/profile', '/races')).toBe(false);
  });

  it('treats the root prefix as matching everything', () => {
    expect(matchPath('/', '/')).toBe(true);
    expect(matchPath('/races', '/')).toBe(true);
  });

  it('handles a prefix that already ends with a slash', () => {
    expect(matchPath('/tv/display', '/tv/')).toBe(true);
    expect(matchPath('/tv', '/tv/')).toBe(false);
  });

  it('is case sensitive, like the router', () => {
    expect(matchPath('/Races', '/races')).toBe(false);
  });
});

describe('matchesAnyPath', () => {
  it('returns false for an empty prefix list', () => {
    expect(matchesAnyPath('/races', [])).toBe(false);
  });

  it('returns true when a single prefix matches', () => {
    expect(matchesAnyPath('/tv/display', ['/onboarding', '/tv'])).toBe(true);
  });

  it('returns false when no prefix matches', () => {
    expect(matchesAnyPath('/profile', ['/onboarding', '/tv'])).toBe(false);
  });

  it('does not match a longer sibling segment', () => {
    expect(matchesAnyPath('/competitors/added', ['/competitors/add'])).toBe(
      false,
    );
  });
});
