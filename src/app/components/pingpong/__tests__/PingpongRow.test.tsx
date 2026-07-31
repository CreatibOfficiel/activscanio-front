import { render, screen } from '@testing-library/react';
import PingpongRow from '../PingpongRow';
import { PingpongPlayer } from '../../../models/Pingpong';

/**
 * One row of the ping-pong leaderboard.
 *
 * Three research findings shape it.
 *
 * ONE list, not three sections. No platform surveyed renders three
 * separately-headed groups; they either exclude the uncertain (Lichess, UTR,
 * FIDE) or keep everyone inline with a short marker (FICS). Three headers on
 * a 25-row phone list turns a third of the screen into chrome and reifies
 * "the bottom group" as a place people live.
 *
 * The ABSENCE of a rank number is itself the badge — no extra decoration
 * needed to say someone is unranked.
 *
 * Calibrating and inactive get DIFFERENT words. FICS uses P and E precisely
 * because "we don't know yet" and "was settled, drifted" are different
 * states. Collapsing them loses the distinction that matters to whoever is
 * looking for that person.
 */
describe('PingpongRow', () => {
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
      previousWeekRank: null,
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

  it('shows the rank of a ranked player', () => {
    render(<PingpongRow player={player({ rank: 7 })} />);

    expect(screen.getByTestId('pingpong-rank')).toHaveTextContent('7');
  });

  it('shows a medal instead of a number on the podium', () => {
    // RankBadge's existing behaviour, shared with the Mario Kart board.
    render(<PingpongRow player={player({ rank: 2 })} />);

    expect(screen.getByTestId('pingpong-rank')).toHaveTextContent('🥈');
  });

  it('shows no rank for a calibrating player', () => {
    // The absence IS the badge. Nothing stands in for the number.
    render(
      <PingpongRow player={player({ rank: null, provisional: true })} />,
    );

    expect(screen.queryByTestId('pingpong-rank')).not.toBeInTheDocument();
  });

  it('shows the rating with a word beside it', () => {
    // "1510" alone means nothing to a casual player, and NN/g is explicit
    // that information vital to the task must not live in a tooltip.
    render(<PingpongRow player={player({ conservativeScore: 1510 })} />);

    expect(screen.getByText('1510')).toBeInTheDocument();
    expect(screen.getByTestId('pingpong-rating')).toHaveTextContent(/elo/i);
  });

  describe('status labels', () => {
    it('labels a calibrating player with their progress', () => {
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 3,
          })}
        />,
      );

      // Progress, not a bare word: it tells them how far off they are.
      expect(screen.getByTestId('pingpong-status')).toHaveTextContent('3/8');
    });

    it('labels an inactive player differently', () => {
      render(
        <PingpongRow player={player({ rank: null, inactive: true })} />,
      );

      const status = screen.getByTestId('pingpong-status');
      expect(status).toHaveTextContent(/inactif/i);
      expect(status).not.toHaveTextContent(/\d\/8/);
    });

    it('calls an inactive calibrating player inactive', () => {
      // Both flags can be true. "Not seen for two weeks" is the more useful
      // thing to tell someone who is looking for them.
      render(
        <PingpongRow
          player={player({ rank: null, provisional: true, inactive: true })}
        />,
      );

      expect(screen.getByTestId('pingpong-status')).toHaveTextContent(
        /inactif/i,
      );
    });

    it('shows no status label for a settled active player', () => {
      render(<PingpongRow player={player()} />);

      expect(screen.queryByTestId('pingpong-status')).not.toBeInTheDocument();
    });
  });

  describe('record', () => {
    it('shows wins and losses', () => {
      render(<PingpongRow player={player({ wins: 15, losses: 9 })} />);

      expect(screen.getByTestId('pingpong-record')).toHaveTextContent('15');
      expect(screen.getByTestId('pingpong-record')).toHaveTextContent('9');
    });

    it('shows no win rate for someone who has never played', () => {
      // 0% would read as having lost every game.
      render(
        <PingpongRow
          player={player({ wins: 0, losses: 0, rank: null, provisional: true })}
        />,
      );

      expect(screen.queryByTestId('pingpong-winrate')).not.toBeInTheDocument();
    });

    it('shows a win rate once matches have been played', () => {
      render(<PingpongRow player={player({ wins: 3, losses: 1 })} />);

      expect(screen.getByTestId('pingpong-winrate')).toHaveTextContent('75');
    });
  });

  it('marks the current user', () => {
    render(<PingpongRow player={player()} isCurrentUser />);

    expect(screen.getByTestId('pingpong-row')).toHaveAttribute(
      'data-current-user',
      'true',
    );
  });

  it('dims an inactive player without hiding them', () => {
    // Removing them would erase someone from the office; dimming says they
    // are away without pretending they never existed.
    render(<PingpongRow player={player({ rank: null, inactive: true })} />);

    expect(screen.getByTestId('pingpong-row')).toHaveAttribute(
      'data-inactive',
      'true',
    );
  });

  describe('movement', () => {
    // The arrow belongs to the player, not the table: it appears only for
    // someone who played. Roughly half the rank changes in a 25-person pool
    // happen to people who were not there.
    const TODAY = new Date().toISOString();
    const LONG_AGO = '2026-01-01T12:00:00Z';

    it('shows a climb for someone who played and gained', () => {
      render(
        <PingpongRow
          player={player({ rank: 2, previousDayRank: 5, lastMatchAt: TODAY })}
        />,
      );

      expect(screen.getByTestId('pingpong-trend')).toHaveAttribute(
        'data-direction',
        'up',
      );
    });

    it('shows a fall for someone who played and lost ground', () => {
      render(
        <PingpongRow
          player={player({ rank: 6, previousDayRank: 3, lastMatchAt: TODAY })}
        />,
      );

      expect(screen.getByTestId('pingpong-trend')).toHaveAttribute(
        'data-direction',
        'down',
      );
    });

    it('shows nothing for someone overtaken while away', () => {
      // The case the rule exists for: they lost a place because someone
      // else won. Blaming them for it would be a lie.
      render(
        <PingpongRow
          player={player({ rank: 6, previousDayRank: 5, lastMatchAt: LONG_AGO })}
        />,
      );

      expect(screen.queryByTestId('pingpong-trend')).not.toBeInTheDocument();
    });

    it('shows nothing for a passive climb either', () => {
      // Symmetric, and the honest cost. Their rank number still changes on
      // screen; the arrow would claim a reason that was not theirs.
      render(
        <PingpongRow
          player={player({ rank: 4, previousDayRank: 5, lastMatchAt: LONG_AGO })}
        />,
      );

      expect(screen.queryByTestId('pingpong-trend')).not.toBeInTheDocument();
    });

    it('shows nothing when the rank held', () => {
      render(
        <PingpongRow
          player={player({ rank: 4, previousDayRank: 4, lastMatchAt: TODAY })}
        />,
      );

      expect(screen.queryByTestId('pingpong-trend')).not.toBeInTheDocument();
    });

    it('shows nothing for an unranked player', () => {
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            previousDayRank: 2,
            lastMatchAt: TODAY,
          })}
        />,
      );

      expect(screen.queryByTestId('pingpong-trend')).not.toBeInTheDocument();
    });
  });

  it('names the player', () => {
    render(<PingpongRow player={player()} />);

    expect(screen.getByText(/Marc/)).toBeInTheDocument();
  });
});
