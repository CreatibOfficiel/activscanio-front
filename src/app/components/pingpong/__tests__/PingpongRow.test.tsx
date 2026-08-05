import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows a digit on the podium, not a medal', () => {
    // Reversed. This test used to assert the opposite — RankBadge's default
    // renders 🥇🥈🥉 in place of the number, and the row inherited it.
    //
    // The medals were the reported bug. Ranks 1-3 were the only three rows
    // on the board carrying no readable rank, in the one place a reader is
    // most likely to be looking for one, and a medal cannot be compared
    // against the "4" below it. The top three now have a podium of their own
    // above the list; the list itself is a ranking, and a ranking numbers
    // every line.
    render(<PingpongRow player={player({ rank: 2 })} />);

    const rank = screen.getByTestId('pingpong-rank');
    expect(rank).toHaveTextContent('2');
    expect(rank).not.toHaveTextContent('🥈');
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
      expect(screen.getByTestId('pingpong-status')).toHaveTextContent('3');
      expect(screen.getByTestId('pingpong-status')).toHaveTextContent('8');
    });

    it('says what the calibration count leads to', () => {
      // "3/8 matchs" states a ratio without naming its purpose. On a board
      // where the first eight matches produce no ranking at all, the missing
      // half is the one that explains why the row carries no rank.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 3,
          })}
        />,
      );

      expect(screen.getByTestId('pingpong-status')).toHaveTextContent(
        /class/i,
      );
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
    it('leaves the win/loss tally to the detail sheet', () => {
      // Reversed. The row used to carry "15V · 9D" under the name. The row
      // is now 54 px with the rating and the win rate down its right edge,
      // and the tally is the same information as the win rate stated twice —
      // one of them in the space the sub-line needs for a calibrating
      // player's reason. Tapping the row opens the full record.
      render(<PingpongRow player={player({ wins: 15, losses: 9 })} />);

      expect(screen.queryByTestId('pingpong-record')).not.toBeInTheDocument();
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

  /**
   * The rows open a detail sheet, so they have to be real buttons.
   *
   * `onClick` has been declared on this component since it was written and
   * no caller ever passed one, which is why the row stayed a div with a
   * handler that never fired. Now that the leaderboard passes one, the
   * element has to match what it does: a div with an onClick is invisible to
   * the keyboard and announces nothing.
   *
   * Only when it is actually clickable. A button that does nothing is a tab
   * stop that wastes a press, and on a 25-row board that is 25 of them.
   */
  describe('opening the detail sheet', () => {
    it('is a button when it can be opened', () => {
      render(<PingpongRow player={player()} onClick={jest.fn()} />);

      expect(screen.getByTestId('pingpong-row').tagName).toBe('BUTTON');
    });

    it('is not a button when it cannot', () => {
      render(<PingpongRow player={player()} />);

      expect(screen.getByTestId('pingpong-row').tagName).not.toBe('BUTTON');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('opens on a click', async () => {
      const onClick = jest.fn();
      render(<PingpongRow player={player()} onClick={onClick} />);

      await userEvent.click(screen.getByTestId('pingpong-row'));

      expect(onClick).toHaveBeenCalled();
    });

    it('opens on Enter', async () => {
      const onClick = jest.fn();
      render(<PingpongRow player={player()} onClick={onClick} />);

      screen.getByTestId('pingpong-row').focus();
      await userEvent.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalled();
    });

    it('opens on Space', async () => {
      const onClick = jest.fn();
      render(<PingpongRow player={player()} onClick={onClick} />);

      screen.getByTestId('pingpong-row').focus();
      await userEvent.keyboard(' ');

      expect(onClick).toHaveBeenCalled();
    });

    it('says whose card it opens', async () => {
      // "Marc D." alone is what the row shows; the button has to say what
      // pressing it does.
      render(<PingpongRow player={player()} onClick={jest.fn()} />);

      expect(
        screen.getByRole('button', { name: /marc/i }),
      ).toHaveAccessibleName(/fiche/i);
    });

    it('declares that it opens a dialog', async () => {
      render(<PingpongRow player={player()} onClick={jest.fn()} />);

      expect(screen.getByTestId('pingpong-row')).toHaveAttribute(
        'aria-haspopup',
        'dialog',
      );
    });
  });

  /**
   * The stat block, and where the trend arrow sits relative to it.
   *
   * The design spec proposed moving the arrow off the row into the detail
   * sheet. The owner rejected that: it is the only thing on the board that
   * says anything changed today, and burying it behind a tap means nobody
   * sees it. It stays, immediately left of the two stat columns, so the
   * numbers still line up down the right edge.
   */
  describe('the right-hand stats', () => {
    it('shows the rating and the win rate as two columns', () => {
      render(
        <PingpongRow player={player({ conservativeScore: 1030, wins: 15, losses: 9 })} />,
      );

      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent('1030');
      expect(screen.getByTestId('pingpong-winrate')).toHaveTextContent('63');
    });

    it('labels each number for a screen reader', () => {
      // Both are icon-over-value on screen. Without the labels a row reads
      // "4 Marc D. 1030 63".
      render(<PingpongRow player={player()} />);

      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent(/elo/i);
      expect(screen.getByTestId('pingpong-winrate')).toHaveTextContent(
        /victoires/i,
      );
    });

    it('puts the trend arrow immediately before the stats', () => {
      // Explicitly kept on the row rather than moved into the sheet, and
      // positioned left of the stat block so the numbers stay aligned.
      render(
        <PingpongRow
          player={player({
            rank: 2,
            previousDayRank: 5,
            lastMatchAt: new Date().toISOString(),
          })}
        />,
      );

      const trend = screen.getByTestId('pingpong-trend');
      const stats = screen.getByTestId('pingpong-stats');
      expect(
        trend.compareDocumentPosition(stats) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(trend.nextElementSibling).toBe(stats);
    });
  });

  describe('an unranked row', () => {
    it('shows no win rate for a calibrating player', () => {
      // A win rate off three matches is noise, and it would sit in the
      // column a ranked row uses for a number that means something.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            wins: 2,
            losses: 1,
          })}
        />,
      );

      expect(screen.queryByTestId('pingpong-winrate')).not.toBeInTheDocument();
    });

    it('still shows the rating', () => {
      // The rating exists and is real; only the rank is withheld.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            conservativeScore: 1042,
          })}
        />,
      );

      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent('1042');
    });

    it('says it is unranked rather than staying silent', () => {
      // The empty rank column is the visual signal. A screen reader gets
      // nothing from an empty box, so the absence is stated.
      render(
        <PingpongRow player={player({ rank: null, provisional: true })} />,
      );

      expect(screen.getByTestId('pingpong-row')).toHaveTextContent(
        /non classé/i,
      );
    });
  });
});
