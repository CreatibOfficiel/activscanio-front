import { render, screen, within } from '@testing-library/react';
import MatchCard from '../MatchCard';
import { PingpongMatch, PingpongPlayer } from '../../../models/Pingpong';

/**
 * One recorded ping-pong match.
 *
 * The card exists because `GET /pingpong/matches` returns identifiers and
 * nothing else — no names, no avatars, the controller does a bare find()
 * with no relations. Every name on screen is joined client-side against the
 * leaderboard, so the tests below that assert a name is present are really
 * asserting that the join works.
 *
 * The card is always read from A's side. `sets` come from the API in A's
 * point of view, and the alternative — mirroring them per viewer — makes the
 * same match render two different ways depending on who opens it. So the
 * left column is always player A, the right always player B, and both are
 * labelled, so no reader has to work out whose 11 they are looking at.
 */
describe('MatchCard', () => {
  function player(overrides: Partial<PingpongPlayer> = {}): PingpongPlayer {
    return {
      id: 'p1',
      competitorId: 'c1',
      firstName: 'Marc',
      lastName: 'Dupont',
      profilePictureUrl: '',
      rating: 1620,
      rd: 55,
      vol: 0.06,
      conservativeScore: 1510,
      matchCount: 24,
      weightedMatchCount: 20,
      wins: 15,
      losses: 9,
      setsWon: 38,
      setsLost: 27,
      currentStreak: 3,
      bestStreak: 6,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 5,
      diversityScore21d: 0.9,
      rank: 2,
      ...overrides,
    };
  }

  function match(overrides: Partial<PingpongMatch> = {}): PingpongMatch {
    return {
      id: 'm1',
      playerAId: 'p1',
      playerBId: 'p2',
      winnerId: 'p1',
      sets: [
        { a: 11, b: 7 },
        { a: 9, b: 11 },
        { a: 11, b: 8 },
      ],
      playedAt: '2026-03-14T12:00:00Z',
      appliedWeight: 1,
      ratingFrozen: false,
      ratingABefore: 1608,
      ratingAAfter: 1620,
      ratingBBefore: 1540,
      ratingBAfter: 1532,
      ...overrides,
    };
  }

  /** The leaderboard slice the card joins against. */
  const PLAYERS = new Map<string, PingpongPlayer>([
    ['p1', player({ id: 'p1', firstName: 'Marc', lastName: 'Dupont' })],
    ['p2', player({ id: 'p2', firstName: 'Léa', lastName: 'Bernard' })],
  ]);

  describe('the id → player join', () => {
    it('names both players', () => {
      // The API sends playerAId and playerBId and nothing else. A name on
      // screen can only have come from the leaderboard lookup.
      render(<MatchCard match={match()} players={PLAYERS} />);

      expect(screen.getByTestId('match-player-a')).toHaveTextContent(/Marc/);
      expect(screen.getByTestId('match-player-b')).toHaveTextContent(/Léa/);
    });

    it('joins on PingpongPlayer.id, not competitorId', () => {
      // The two ids differ and the match carries the player id. Keying the
      // map by competitorId would miss every row.
      const byPlayerId = new Map<string, PingpongPlayer>([
        ['pp-a', player({ id: 'pp-a', competitorId: 'comp-a', firstName: 'Marc' })],
        ['pp-b', player({ id: 'pp-b', competitorId: 'comp-b', firstName: 'Léa' })],
      ]);

      render(
        <MatchCard
          match={match({ playerAId: 'pp-a', playerBId: 'pp-b', winnerId: 'pp-a' })}
          players={byPlayerId}
        />,
      );

      expect(screen.getByTestId('match-player-a')).toHaveTextContent(/Marc/);
      expect(screen.getByTestId('match-player-b')).toHaveTextContent(/Léa/);
    });

    it('renders a readable placeholder for a player missing from the leaderboard', () => {
      // An archived or deleted player is absent from the board while their
      // matches remain. The card must degrade, not crash.
      render(
        <MatchCard
          match={match({ playerBId: 'ghost' })}
          players={PLAYERS}
        />,
      );

      const b = screen.getByTestId('match-player-b');
      expect(b).toHaveTextContent(/joueur inconnu/i);
      expect(b).not.toHaveTextContent(/undefined/i);
      expect(b).not.toHaveTextContent('ghost');
    });

    it('renders both sides as placeholders when neither player is known', () => {
      render(<MatchCard match={match()} players={new Map()} />);

      expect(screen.getByTestId('match-player-a')).toHaveTextContent(
        /joueur inconnu/i,
      );
      expect(screen.getByTestId('match-player-b')).toHaveTextContent(
        /joueur inconnu/i,
      );
    });
  });

  describe('sets', () => {
    it('shows every set in the order played', () => {
      render(<MatchCard match={match()} players={PLAYERS} />);

      const sets = screen.getAllByTestId('match-set');
      expect(sets).toHaveLength(3);
      expect(sets[0]).toHaveTextContent('11-7');
      expect(sets[1]).toHaveTextContent('9-11');
      expect(sets[2]).toHaveTextContent('11-8');
    });

    it('keeps a two-set match at two sets', () => {
      render(
        <MatchCard
          match={match({
            sets: [
              { a: 11, b: 4 },
              { a: 11, b: 9 },
            ],
          })}
          players={PLAYERS}
        />,
      );

      expect(screen.getAllByTestId('match-set')).toHaveLength(2);
    });

    it('writes every set from player A on the left', () => {
      // The API sends sets in A's point of view. Mirroring them for a viewer
      // who happens to be B would make one match read two ways, so the card
      // never mirrors — it labels the columns instead.
      render(
        <MatchCard
          match={match({
            sets: [
              { a: 4, b: 11 },
              { a: 6, b: 11 },
            ],
            winnerId: 'p2',
          })}
          players={PLAYERS}
        />,
      );

      const sets = screen.getAllByTestId('match-set');
      expect(sets[0]).toHaveTextContent('4-11');
      expect(sets[1]).toHaveTextContent('6-11');
    });

    it('labels which column belongs to which player', () => {
      // Without this, "11-7" is ambiguous to anyone who did not record it.
      // The names are in the DOM order the columns are in, and the group
      // carries a label naming both sides for a screen reader.
      render(<MatchCard match={match()} players={PLAYERS} />);

      const label = screen.getByTestId('match-sets').getAttribute('aria-label');
      expect(label).toMatch(/Marc/);
      expect(label).toMatch(/Léa/);
      expect(label!.indexOf('Marc')).toBeLessThan(label!.indexOf('Léa'));
    });

    it('shows the set tally', () => {
      // 2-1 in sets is the result; the individual scores are the detail.
      render(<MatchCard match={match()} players={PLAYERS} />);

      expect(screen.getByTestId('match-set-tally')).toHaveTextContent('2');
      expect(screen.getByTestId('match-set-tally')).toHaveTextContent('1');
    });
  });

  describe('the winner', () => {
    it('marks player A when A won', () => {
      render(
        <MatchCard match={match({ winnerId: 'p1' })} players={PLAYERS} />,
      );

      expect(screen.getByTestId('match-player-a')).toHaveAttribute(
        'data-winner',
        'true',
      );
      expect(screen.getByTestId('match-player-b')).toHaveAttribute(
        'data-winner',
        'false',
      );
    });

    it('marks player B when B won', () => {
      render(
        <MatchCard
          match={match({
            winnerId: 'p2',
            sets: [
              { a: 4, b: 11 },
              { a: 6, b: 11 },
            ],
            ratingABefore: 1620,
            ratingAAfter: 1608,
            ratingBBefore: 1532,
            ratingBAfter: 1544,
          })}
          players={PLAYERS}
        />,
      );

      expect(screen.getByTestId('match-player-b')).toHaveAttribute(
        'data-winner',
        'true',
      );
      expect(screen.getByTestId('match-player-a')).toHaveAttribute(
        'data-winner',
        'false',
      );
    });

    it('says who won in words, not only in colour', () => {
      // Colour alone fails WCAG 1.4.1 and fails anyone reading a screenshot.
      render(<MatchCard match={match()} players={PLAYERS} />);

      expect(
        within(screen.getByTestId('match-player-a')).getByTestId(
          'match-winner-mark',
        ),
      ).toHaveTextContent(/vainqueur|gagnant/i);
    });
  });

  describe('rating delta', () => {
    it('computes A from ratingAAfter minus ratingABefore', () => {
      render(
        <MatchCard
          match={match({ ratingABefore: 1608, ratingAAfter: 1620 })}
          players={PLAYERS}
        />,
      );

      // 1620 − 1608 = 12, and the sign is explicit.
      expect(screen.getByTestId('match-delta-a')).toHaveTextContent('+12');
    });

    it('computes B from ratingBAfter minus ratingBBefore', () => {
      render(
        <MatchCard
          match={match({ ratingBBefore: 1540, ratingBAfter: 1532 })}
          players={PLAYERS}
        />,
      );

      // 1532 − 1540 = −8, rendered with a real minus sign.
      expect(screen.getByTestId('match-delta-b')).toHaveTextContent('−8');
    });

    it('rounds a fractional rating move', () => {
      // Glicko ratings are floats; "+11.6" on a card is noise.
      render(
        <MatchCard
          match={match({ ratingABefore: 1608.2, ratingAAfter: 1619.8 })}
          players={PLAYERS}
        />,
      );

      expect(screen.getByTestId('match-delta-a')).toHaveTextContent('+12');
      expect(screen.getByTestId('match-delta-a')).not.toHaveTextContent('.');
    });

    it('signs a positive delta with a plus', () => {
      // "12" could be read as a rating. "+12" cannot.
      render(
        <MatchCard
          match={match({ ratingBBefore: 1500, ratingBAfter: 1503 })}
          players={PLAYERS}
        />,
      );

      expect(screen.getByTestId('match-delta-b')).toHaveTextContent('+3');
    });
  });

  describe('a frozen match', () => {
    const frozen = match({
      ratingFrozen: true,
      ratingABefore: 1620,
      ratingAAfter: 1620,
      ratingBBefore: 1200,
      ratingBAfter: 1200,
    });

    it('says the rating was not counted instead of showing a bare +0', () => {
      // ratingFrozen means the gap was wide enough that the ratings were
      // pinned. "+0" with no explanation reads as a bug in the maths.
      render(<MatchCard match={frozen} players={PLAYERS} />);

      expect(screen.getByTestId('match-frozen')).toBeInTheDocument();
      expect(screen.getByTestId('match-frozen')).toHaveTextContent(
        /non compt/i,
      );
    });

    it('hides the zero deltas it would otherwise show', () => {
      render(<MatchCard match={frozen} players={PLAYERS} />);

      expect(screen.queryByTestId('match-delta-a')).not.toBeInTheDocument();
      expect(screen.queryByTestId('match-delta-b')).not.toBeInTheDocument();
    });

    it('still shows the scores and the winner', () => {
      // The match was played and won; only the rating consequence is absent.
      render(<MatchCard match={frozen} players={PLAYERS} />);

      expect(screen.getAllByTestId('match-set')).toHaveLength(3);
      expect(screen.getByTestId('match-player-a')).toHaveAttribute(
        'data-winner',
        'true',
      );
    });

    it('shows no frozen notice on a normal match', () => {
      render(<MatchCard match={match()} players={PLAYERS} />);

      expect(screen.queryByTestId('match-frozen')).not.toBeInTheDocument();
    });
  });

  describe('reduced weight', () => {
    it('flags a match that counted for less', () => {
      // Repeat matches against the same opponent in one week are damped.
      // Without a note, a 3-point swing next to a 12-point one looks broken.
      render(
        <MatchCard
          match={match({ appliedWeight: 0.4 })}
          players={PLAYERS}
        />,
      );

      expect(screen.getByTestId('match-weight')).toHaveTextContent('40');
    });

    it('says nothing about weight on a full-weight match', () => {
      render(
        <MatchCard match={match({ appliedWeight: 1 })} players={PLAYERS} />,
      );

      expect(screen.queryByTestId('match-weight')).not.toBeInTheDocument();
    });

    it('says nothing about weight on a frozen match', () => {
      // A frozen match already carries the stronger explanation.
      render(
        <MatchCard
          match={match({ ratingFrozen: true, appliedWeight: 0.4 })}
          players={PLAYERS}
        />,
      );

      expect(screen.queryByTestId('match-weight')).not.toBeInTheDocument();
    });
  });

  it('dates the match', () => {
    render(<MatchCard match={match()} players={PLAYERS} />);

    expect(screen.getByTestId('match-date')).not.toBeEmptyDOMElement();
  });
});
