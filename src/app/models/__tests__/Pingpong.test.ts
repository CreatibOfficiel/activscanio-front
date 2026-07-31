import {
  isValidSetScore,
  validateMatchSets,
  needsDecidingSet,
} from '../Pingpong';

/**
 * Table tennis scoring, client side.
 *
 * These rules drive the entry form, so a mistake here either accepts an
 * impossible score — which the API then rejects, after the user has filled
 * everything in — or refuses a legal one, which is worse because there is no
 * way around it.
 *
 * Deliberately duplicated from the API rather than shared: the server must
 * validate untrusted input whatever the client does, and a shared package
 * would tie a deploy of one to a deploy of the other. The duplication is the
 * point; these tests are what keeps the two honest.
 */
describe('isValidSetScore', () => {
  describe('a set won at 11', () => {
    it.each([
      [11, 0],
      [11, 5],
      [11, 9],
    ])('accepts %i-%i', (a, b) => {
      expect(isValidSetScore(a, b)).toBe(true);
    });

    it('accepts the same scores the other way round', () => {
      expect(isValidSetScore(0, 11)).toBe(true);
      expect(isValidSetScore(9, 11)).toBe(true);
    });

    it('refuses 11-10, which cannot happen', () => {
      // At 10-10 the set runs on until someone leads by two, so nobody ever
      // wins 11-10.
      expect(isValidSetScore(11, 10)).toBe(false);
    });
  });

  describe('past 10-10, two clear points', () => {
    it.each([
      [12, 10],
      [13, 11],
      [15, 13],
      [21, 19],
    ])('accepts %i-%i', (a, b) => {
      expect(isValidSetScore(a, b)).toBe(true);
    });

    it.each([
      [12, 9],
      [13, 10],
      [15, 12],
      [14, 9],
    ])('refuses %i-%i, where the gap is not exactly two', (a, b) => {
      expect(isValidSetScore(a, b)).toBe(false);
    });
  });

  describe('scores that are not scores', () => {
    it('refuses a tie', () => {
      expect(isValidSetScore(11, 11)).toBe(false);
      expect(isValidSetScore(0, 0)).toBe(false);
    });

    it('refuses a set that never reached 11', () => {
      expect(isValidSetScore(10, 8)).toBe(false);
      expect(isValidSetScore(5, 3)).toBe(false);
    });

    it('refuses negative numbers', () => {
      expect(isValidSetScore(11, -1)).toBe(false);
      expect(isValidSetScore(-11, 0)).toBe(false);
    });

    it('refuses decimals', () => {
      expect(isValidSetScore(11.5, 9)).toBe(false);
      expect(isValidSetScore(11, 9.5)).toBe(false);
    });

    it('refuses NaN', () => {
      // Which is what an empty number input parses to.
      expect(isValidSetScore(NaN, 9)).toBe(false);
      expect(isValidSetScore(11, NaN)).toBe(false);
    });
  });
});

describe('validateMatchSets', () => {
  it('accepts a straight two-nil', () => {
    const result = validateMatchSets([
      { a: 11, b: 5 },
      { a: 11, b: 8 },
    ]);

    expect(result.valid).toBe(true);
    expect(result.winner).toBe('A');
    expect(result.setsA).toBe(2);
    expect(result.setsB).toBe(0);
    expect(result.error).toBeNull();
  });

  it('accepts a match decided in the third set', () => {
    const result = validateMatchSets([
      { a: 11, b: 5 },
      { a: 8, b: 11 },
      { a: 12, b: 10 },
    ]);

    expect(result.valid).toBe(true);
    expect(result.winner).toBe('A');
    expect(result.setsA).toBe(2);
    expect(result.setsB).toBe(1);
  });

  it('names B as the winner when B took two sets', () => {
    const result = validateMatchSets([
      { a: 5, b: 11 },
      { a: 9, b: 11 },
    ]);

    expect(result.winner).toBe('B');
  });

  it('refuses a single set', () => {
    const result = validateMatchSets([{ a: 11, b: 5 }]);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/au moins 2 sets/);
  });

  it('refuses four sets', () => {
    const result = validateMatchSets([
      { a: 11, b: 5 },
      { a: 11, b: 5 },
      { a: 11, b: 5 },
      { a: 11, b: 5 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/3 sets/);
  });

  it('refuses a third set played after a two-nil', () => {
    // The match was over. A third set means someone mistyped.
    const result = validateMatchSets([
      { a: 11, b: 5 },
      { a: 11, b: 8 },
      { a: 11, b: 6 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/déjà terminé/);
  });

  it('reports which set is impossible', () => {
    const result = validateMatchSets([
      { a: 11, b: 5 },
      { a: 12, b: 9 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.invalidSetIndices).toEqual([1]);
  });

  it('reports every impossible set, not just the first', () => {
    const result = validateMatchSets([
      { a: 12, b: 9 },
      { a: 7, b: 4 },
    ]);

    expect(result.invalidSetIndices).toEqual([0, 1]);
  });

  it('refuses a one-all that stopped there', () => {
    const result = validateMatchSets([
      { a: 11, b: 5 },
      { a: 5, b: 11 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/2 sets/);
  });

  it('refuses an empty match', () => {
    const result = validateMatchSets([]);

    expect(result.valid).toBe(false);
    expect(result.winner).toBeNull();
  });
});

describe('needsDecidingSet', () => {
  it('asks for a third set when the first two were split', () => {
    expect(
      needsDecidingSet([
        { a: 11, b: 5 },
        { a: 8, b: 11 },
      ]),
    ).toBe(true);
  });

  it('does not ask after a two-nil', () => {
    expect(
      needsDecidingSet([
        { a: 11, b: 5 },
        { a: 11, b: 8 },
      ]),
    ).toBe(false);
  });

  it('does not ask while the second set is still being typed', () => {
    // A half-filled score must not make the third set appear and vanish.
    expect(
      needsDecidingSet([
        { a: 11, b: 5 },
        { a: 3, b: 0 },
      ]),
    ).toBe(false);
  });

  it('does not ask on a single set', () => {
    expect(needsDecidingSet([{ a: 11, b: 5 }])).toBe(false);
  });

  it('does not ask once three sets are in', () => {
    expect(
      needsDecidingSet([
        { a: 11, b: 5 },
        { a: 8, b: 11 },
        { a: 11, b: 9 },
      ]),
    ).toBe(false);
  });
});

describe('client and API agree', () => {
  // Same cases as the API's own spec. If these two ever diverge, the form
  // accepts something the server refuses — which the user sees as a failed
  // submit with no explanation.
  const legal: [number, number][] = [
    [11, 0],
    [11, 9],
    [12, 10],
    [13, 11],
    [0, 11],
    [9, 11],
  ];
  const illegal: [number, number][] = [
    [11, 10],
    [12, 9],
    [10, 8],
    [11, 11],
    [-1, 11],
  ];

  it.each(legal)('accepts %i-%i, as the API does', (a, b) => {
    expect(isValidSetScore(a, b)).toBe(true);
  });

  it.each(illegal)('refuses %i-%i, as the API does', (a, b) => {
    expect(isValidSetScore(a, b)).toBe(false);
  });
});
