import { rankMovement } from '../rank-movement';

/**
 * Whether to show a movement arrow, and which way.
 *
 * The rule is not "did your rank change" but "did YOU do something". In a
 * 25-person office, roughly half of all rank changes happen to people who
 * did not play — A wins, overtakes B, and B's row would sprout a red arrow
 * for a day they were not even there. A simulation of a season with fixed
 * true skill put passive movements at 46% of the total, split almost evenly
 * between passive climbs and passive falls.
 *
 * So the arrow is a property of the player, not of the table: it appears
 * only for someone who played in the window. That costs the passive climber
 * their arrow too — deliberately. Their rank number still changes on screen,
 * which is the information; the arrow only claims a reason, and in their
 * case the reason was not them.
 *
 * No app surveyed shows a persistent "you fell" arrow driven by someone
 * else's activity. Strava notifies a lost KOM as a private event, and
 * Duolingo says "someone passed you" without ever naming them.
 */
describe('rankMovement', () => {
  const NOW = new Date('2026-03-15T18:00:00Z');
  const TODAY = '2026-03-15T12:00:00Z';
  const YESTERDAY = '2026-03-14T12:00:00Z';
  const LAST_WEEK = '2026-03-08T12:00:00Z';

  it('shows a climb for someone who played and gained', () => {
    expect(
      rankMovement({
        rank: 2,
        previousRank: 5,
        lastActiveAt: TODAY,
        now: NOW,
      }),
    ).toEqual({ direction: 'up', places: 3 });
  });

  it('shows a fall for someone who played and lost ground', () => {
    // Honest: they were there, they lost.
    expect(
      rankMovement({
        rank: 6,
        previousRank: 3,
        lastActiveAt: TODAY,
        now: NOW,
      }),
    ).toEqual({ direction: 'down', places: 3 });
  });

  it('shows nothing for someone who did not play', () => {
    // The case that drove the design: B lost a place because A won. B was
    // not there. A red arrow would blame them for someone else's match.
    expect(
      rankMovement({
        rank: 6,
        previousRank: 5,
        lastActiveAt: LAST_WEEK,
        now: NOW,
      }),
    ).toBeNull();
  });

  it('shows nothing for a passive climb either', () => {
    // Symmetric, and the honest cost of the rule. Someone who gained a
    // place while away gets no arrow — their rank number still moved, which
    // is the fact; the arrow would claim a reason that was not theirs.
    expect(
      rankMovement({
        rank: 4,
        previousRank: 5,
        lastActiveAt: LAST_WEEK,
        now: NOW,
      }),
    ).toBeNull();
  });

  it('shows nothing when the rank held, even after playing', () => {
    // An arrow on every row every day says nothing.
    expect(
      rankMovement({
        rank: 4,
        previousRank: 4,
        lastActiveAt: TODAY,
        now: NOW,
      }),
    ).toBeNull();
  });

  describe('the activity window', () => {
    it('counts a match played earlier today', () => {
      expect(
        rankMovement({
          rank: 2,
          previousRank: 3,
          lastActiveAt: TODAY,
          now: NOW,
        }),
      ).not.toBeNull();
    });

    it('counts yesterday, since the snapshot is daily', () => {
      // The comparison rank was captured at the start of the day, so a
      // match played yesterday evening is what moved it.
      expect(
        rankMovement({
          rank: 2,
          previousRank: 3,
          lastActiveAt: YESTERDAY,
          now: NOW,
        }),
      ).not.toBeNull();
    });

    it('does not count a match from last week', () => {
      expect(
        rankMovement({
          rank: 2,
          previousRank: 3,
          lastActiveAt: LAST_WEEK,
          now: NOW,
        }),
      ).toBeNull();
    });
  });

  describe('missing data', () => {
    it('shows nothing without a current rank', () => {
      expect(
        rankMovement({
          rank: null,
          previousRank: 3,
          lastActiveAt: TODAY,
          now: NOW,
        }),
      ).toBeNull();
    });

    it('shows nothing without a previous rank', () => {
      // Null means "held no rank", not "was last". Treating it as a climb
      // from the bottom would invent a movement.
      expect(
        rankMovement({
          rank: 3,
          previousRank: null,
          lastActiveAt: TODAY,
          now: NOW,
        }),
      ).toBeNull();
    });

    it('shows nothing for someone who has never played', () => {
      expect(
        rankMovement({
          rank: 3,
          previousRank: 5,
          lastActiveAt: null,
          now: NOW,
        }),
      ).toBeNull();
    });
  });

  it('accepts a Date as well as a string', () => {
    // The two sports type this field differently.
    expect(
      rankMovement({
        rank: 2,
        previousRank: 4,
        lastActiveAt: new Date(TODAY),
        now: NOW,
      }),
    ).toEqual({ direction: 'up', places: 2 });
  });
});
