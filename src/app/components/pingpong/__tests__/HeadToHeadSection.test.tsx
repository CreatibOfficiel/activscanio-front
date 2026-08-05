import { render, screen, within } from '@testing-library/react';
import HeadToHeadSection from '../HeadToHeadSection';
import { PingpongMatch, PingpongPlayer } from '../../../models/Pingpong';

/**
 * The rivalry view.
 *
 * This is the part of a ping-pong profile that almost everyone can read
 * something good in. A rank is zero-sum — being 20th of 25 is a fact about
 * you that never improves unless someone else gets worse — but "you lead
 * Marc 7-4" is true, specific, and available to most players regardless of
 * where they sit on the board.
 *
 * The component is pure. It is handed the matches the tab already fetched
 * rather than calling `fetchHeadToHead` per opponent, which would fire one
 * request per rival on a screen that is already loading a player and a
 * match list.
 *
 * Records are derived from `PingpongMatch.winnerId`, never from a set
 * tally: the API names a winner, and a walkover recorded server-side has no
 * sets to count.
 */
describe('HeadToHeadSection', () => {
  function player(overrides: Partial<PingpongPlayer> = {}): PingpongPlayer {
    return {
      id: 'me',
      competitorId: 'c-me',
      firstName: 'Thibaud',
      lastName: 'Carron',
      profilePictureUrl: '',
      rating: 1600,
      rd: 60,
      vol: 0.06,
      conservativeScore: 1480,
      matchCount: 20,
      weightedMatchCount: 20,
      wins: 12,
      losses: 8,
      setsWon: 30,
      setsLost: 25,
      currentStreak: 1,
      bestStreak: 4,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 5,
      diversityScore21d: 0.9,
      rank: 3,
      ...overrides,
    };
  }

  const me = player();
  const marc = player({ id: 'marc', competitorId: 'c-marc', firstName: 'Marc', lastName: 'Dupont' });
  const lea = player({ id: 'lea', competitorId: 'c-lea', firstName: 'Léa', lastName: 'Martin' });

  /**
   * A match between two ids. `winnerId` decides the record; the sets are
   * filler, and are deliberately NOT consistent with the winner in some
   * fixtures to prove the component reads the field the API guarantees.
   */
  function match(
    id: string,
    aId: string,
    bId: string,
    winnerId: string,
    overrides: Partial<PingpongMatch> = {},
  ): PingpongMatch {
    return {
      id,
      playerAId: aId,
      playerBId: bId,
      // Embedded by the API. This view derives its records from the ids and
      // the leaderboard, so the names here are only along for the ride.
      playerA: { id: aId, competitorId: `c-${aId}`, firstName: aId, lastName: '', profilePictureUrl: '' },
      playerB: { id: bId, competitorId: `c-${bId}`, firstName: bId, lastName: '', profilePictureUrl: '' },
      winnerId,
      sets: [
        { a: 11, b: 9 },
        { a: 11, b: 7 },
      ],
      playedAt: '2026-03-10T12:00:00Z',
      appliedWeight: 1,
      ratingFrozen: false,
      ratingABefore: 1500,
      ratingAAfter: 1510,
      ratingBBefore: 1500,
      ratingBAfter: 1490,
      ...overrides,
    };
  }

  it('shows both directions of a record against one opponent', () => {
    // The whole point of the view: wins AND losses. A card showing only
    // wins is a trophy cabinet, not a record, and the loser of a 2-7
    // would never trust the screen again.
    const matches = [
      match('m1', 'me', 'marc', 'me'),
      match('m2', 'me', 'marc', 'me'),
      match('m3', 'marc', 'me', 'marc'),
    ];

    render(
      <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
    );

    const row = screen.getByTestId('h2h-row-marc');
    expect(within(row).getByTestId('h2h-wins')).toHaveTextContent('2');
    expect(within(row).getByTestId('h2h-losses')).toHaveTextContent('1');
  });

  it('counts a win recorded from either side of the table', () => {
    // `playerAId` is the side as recorded, not "me". A player who happened
    // to be entered as B in every match would otherwise show 0 wins.
    const matches = [
      match('m1', 'me', 'marc', 'me'),
      match('m2', 'marc', 'me', 'me'),
    ];

    render(
      <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
    );

    const row = screen.getByTestId('h2h-row-marc');
    expect(within(row).getByTestId('h2h-wins')).toHaveTextContent('2');
    expect(within(row).getByTestId('h2h-losses')).toHaveTextContent('0');
  });

  it('reads the winner the API named, not the set tally', () => {
    // A walkover has sets that do not add up. Re-deriving the winner would
    // display the opposite of what the server recorded.
    const walkover = match('m1', 'me', 'marc', 'me', {
      sets: [
        { a: 0, b: 11 },
        { a: 0, b: 11 },
      ],
    });

    render(
      <HeadToHeadSection player={me} opponents={[marc]} matches={[walkover]} />,
    );

    const row = screen.getByTestId('h2h-row-marc');
    expect(within(row).getByTestId('h2h-wins')).toHaveTextContent('1');
    expect(within(row).getByTestId('h2h-losses')).toHaveTextContent('0');
  });

  it('leaves out an opponent never played', () => {
    // A list of every colleague at 0-0 is noise that buries the two
    // rivalries the player actually has.
    const matches = [match('m1', 'me', 'marc', 'me')];

    render(
      <HeadToHeadSection player={me} opponents={[marc, lea]} matches={matches} />,
    );

    expect(screen.getByTestId('h2h-row-marc')).toBeInTheDocument();
    expect(screen.queryByTestId('h2h-row-lea')).not.toBeInTheDocument();
  });

  it('ignores matches the player was not part of', () => {
    // `fetchPlayerMatches` is scoped to one player, but the same component
    // is safe to hand a wider list.
    const matches = [
      match('m1', 'me', 'marc', 'me'),
      match('m2', 'marc', 'lea', 'lea'),
    ];

    render(
      <HeadToHeadSection player={me} opponents={[marc, lea]} matches={matches} />,
    );

    expect(screen.queryByTestId('h2h-row-lea')).not.toBeInTheDocument();
    const row = screen.getByTestId('h2h-row-marc');
    expect(within(row).getByTestId('h2h-wins')).toHaveTextContent('1');
  });

  it('names the opponent', () => {
    const matches = [match('m1', 'me', 'marc', 'me')];

    render(
      <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
    );

    expect(within(screen.getByTestId('h2h-row-marc')).getByText(/Marc/)).toBeInTheDocument();
  });

  it('skips an opponent the leaderboard did not return', () => {
    // A match against someone missing from `opponents` would otherwise
    // render a row of placeholders with a real-looking record.
    const matches = [match('m1', 'me', 'ghost', 'me')];

    render(
      <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
    );

    expect(screen.queryByTestId('h2h-row-ghost')).not.toBeInTheDocument();
    expect(screen.getByTestId('h2h-empty')).toBeInTheDocument();
  });

  describe('ordering', () => {
    it('puts the most-played rivalry first', () => {
      // The rivalry with the most history is the one worth reading, and on
      // a phone the first row is most of what gets seen.
      const matches = [
        match('m1', 'me', 'lea', 'me'),
        match('m2', 'me', 'marc', 'me'),
        match('m3', 'me', 'marc', 'marc'),
        match('m4', 'me', 'marc', 'me'),
      ];

      render(
        <HeadToHeadSection player={me} opponents={[lea, marc]} matches={matches} />,
      );

      const rows = screen.getAllByTestId(/^h2h-row-/);
      expect(rows[0]).toHaveAttribute('data-testid', 'h2h-row-marc');
      expect(rows[1]).toHaveAttribute('data-testid', 'h2h-row-lea');
    });
  });

  describe('empty state', () => {
    it('invites a first match when nothing has been played', () => {
      // Not an error and not a blank panel: a player with no matches needs
      // to be told what to do next, not shown an empty box.
      render(<HeadToHeadSection player={me} opponents={[marc]} matches={[]} />);

      expect(screen.getByTestId('h2h-empty')).toBeInTheDocument();
      expect(screen.queryAllByTestId(/^h2h-row-/)).toHaveLength(0);
    });
  });

  describe('leading and trailing', () => {
    it('marks a rivalry the player leads', () => {
      const matches = [
        match('m1', 'me', 'marc', 'me'),
        match('m2', 'me', 'marc', 'me'),
        match('m3', 'me', 'marc', 'marc'),
      ];

      render(
        <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
      );

      expect(screen.getByTestId('h2h-row-marc')).toHaveAttribute(
        'data-standing',
        'leading',
      );
    });

    it('marks a rivalry the player trails', () => {
      // Shown plainly rather than hidden. A record that only ever reads as
      // a lead is a record nobody believes.
      const matches = [
        match('m1', 'me', 'marc', 'marc'),
        match('m2', 'me', 'marc', 'me'),
        match('m3', 'me', 'marc', 'marc'),
      ];

      render(
        <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
      );

      expect(screen.getByTestId('h2h-row-marc')).toHaveAttribute(
        'data-standing',
        'trailing',
      );
    });

    it('marks a level rivalry', () => {
      const matches = [
        match('m1', 'me', 'marc', 'me'),
        match('m2', 'me', 'marc', 'marc'),
      ];

      render(
        <HeadToHeadSection player={me} opponents={[marc]} matches={matches} />,
      );

      expect(screen.getByTestId('h2h-row-marc')).toHaveAttribute(
        'data-standing',
        'level',
      );
    });
  });

  /**
   * The section now appears in two places: a player's own profile, and the
   * sheet the leaderboard opens on whoever was tapped. Only the empty state
   * speaks to the reader, and there it tells a viewer to go and play
   * somebody else's matches.
   */
  describe('viewed on someone else', () => {
    it('tells the player themselves what to do next', () => {
      render(<HeadToHeadSection player={me} opponents={[marc]} matches={[]} />);

      expect(screen.getByTestId('h2h-empty')).toHaveTextContent(/ton bilan/i);
    });

    it('does not tell the viewer to play someone else’s matches', () => {
      render(
        <HeadToHeadSection
          player={me}
          opponents={[marc]}
          matches={[]}
          perspective="other"
        />,
      );

      const empty = screen.getByTestId('h2h-empty');
      expect(empty).not.toHaveTextContent(/ton bilan/i);
      expect(empty).not.toHaveTextContent(/enregistre/i);
    });
  });
});
