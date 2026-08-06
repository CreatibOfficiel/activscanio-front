import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongRow from '../PingpongRow';
import { PingpongPlayer } from '../../../models/Pingpong';

/**
 * One row of the ping-pong leaderboard.
 *
 * ONE list, not three sections. Unchanged, and the one finding that survived:
 * no platform surveyed renders three separately-headed groups; they either
 * exclude the uncertain (Lichess, UTR, FIDE) or keep everyone inline with a
 * short marker (FICS). Three headers on a phone list turns a third of the
 * screen into chrome and reifies "the bottom group" as a place people live.
 *
 * THE ABSENCE OF A NUMBER IS NO LONGER THE BADGE. That was this file's central
 * claim and it is reversed below. It held while the unranked were a minority —
 * a gap in a numbered column reads as an exception. Measured in production it
 * was 6 rows of 8, so the "exception" was the rule and the column was mostly
 * empty: a ranking where most rows have no position is not a ranking with
 * some players pending, it is a list that failed to load. The row now carries
 * a position always, and says separately how sure that position is.
 *
 * WHICH ROWS CARRY THE MARK IS ALSO REVERSED. A badge on 6 of 8 rows
 * communicates nothing — it becomes the background, and the two rows without
 * it read as the ones missing something. So the mark is on the CONFIDENT rows:
 * a settled rating is stated plainly, an unsettled one is rendered in a muted
 * weight with a `?` after it, the way Lichess does. The visual weight goes to
 * what we are sure of, and the minority case stays the marked one whichever
 * way the league tips.
 *
 * Calibrating and inactive still get DIFFERENT treatment, for FICS's original
 * reason: "we don't know yet" and "was settled, then drifted" are different
 * states. What changed is which one loses its number — neither does now. The
 * inactive keep a settled rating we trust and are dimmed; the calibrating keep
 * a position we are unsure of and are marked.
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

  /**
   * DELIBERATELY REVERSED. This asserted the opposite: no rank badge at all
   * for a calibrating player, on the reasoning that the absence IS the badge.
   *
   * That reasoning was sound while the unranked were a minority. In production
   * it was 6 of 8 — the API's gate (5 weighted matches AND rd ≤ 200) admitted
   * Charles and Thibaud and nobody else, with Don Joran and Maxime missing by
   * one match and two rd points. A column that is empty on three quarters of
   * its rows has stopped being a signal.
   *
   * The position comes from the board, not from the API's `rank`, which is
   * still null here and still null on the wire. Nothing about the API changed.
   */
  it('shows a position for a calibrating player', () => {
    render(
      <PingpongRow
        player={player({ rank: null, provisional: true })}
        position={4}
      />,
    );

    expect(screen.getByTestId('pingpong-rank')).toHaveTextContent('4');
  });

  it('numbers a calibrating player from the board, not from the API rank', () => {
    // The API sends rank: null for everyone it gated out. If the row read
    // that field it would render nothing whatever position it was handed.
    render(
      <PingpongRow
        player={player({ rank: null, provisional: true })}
        position={7}
      />,
    );

    expect(screen.getByTestId('pingpong-rank')).toHaveTextContent('7');
  });

  it('prefers the position it is given over a stale API rank', () => {
    // Both present and disagreeing. The board's number is the one on screen,
    // or a settled player would be numbered by a rank computed over the gated
    // subset — Thibaud is the API's rank 2 and the board's position 6.
    render(
      <PingpongRow player={player({ rank: 2 })} position={6} />,
    );

    expect(screen.getByTestId('pingpong-rank')).toHaveTextContent('6');
  });

  it('shows the rating with a word beside it', () => {
    // "1510" alone means nothing to a casual player, and NN/g is explicit
    // that information vital to the task must not live in a tooltip.
    render(<PingpongRow player={player({ conservativeScore: 1510 })} />);

    expect(screen.getByText('1510')).toBeInTheDocument();
    expect(screen.getByTestId('pingpong-rating')).toHaveTextContent(/elo/i);
  });

  /**
   * The uncertainty marker, and which rows carry it.
   *
   * On the CONFIDENT rows, inverted from the obvious design. Marking the
   * uncertain ones was the first instinct and it fails on the real data: 6 of
   * 8 rows carrying a "provisional" pill is not a signal, it is wallpaper, and
   * it makes the two unmarked rows look like the ones missing something.
   *
   * So the rating is the marker. A settled rating is stated plainly in the
   * row's normal weight; an unsettled one is muted and takes a `?`, which is
   * exactly Lichess's convention and reads at a glance on a phone without
   * adding a row of chrome. Nothing is added to the layout — one glyph and a
   * colour on a number that was already there.
   */
  describe('the uncertainty marker', () => {
    it('marks an uncertain rating with a question mark', () => {
      render(
        <PingpongRow
          player={player({ rank: null, provisional: true, conservativeScore: 1611 })}
          position={3}
        />,
      );

      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent('1611?');
    });

    it('leaves a settled rating unmarked', () => {
      render(
        <PingpongRow
          player={player({ provisional: false, conservativeScore: 1808 })}
          position={1}
        />,
      );

      const rating = screen.getByTestId('pingpong-rating');
      expect(rating).toHaveTextContent('1808');
      expect(rating).not.toHaveTextContent('?');
    });

    it('says in words what the question mark means', () => {
      // A "?" is a glyph. A screen reader gets nothing from it, and neither
      // does someone who has not been told the convention.
      render(
        <PingpongRow
          player={player({ rank: null, provisional: true })}
          position={3}
        />,
      );

      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent(
        /estimation/i,
      );
    });

    it('flags the row so the marker is not the only trace', () => {
      render(
        <PingpongRow
          player={player({ rank: null, provisional: true })}
          position={3}
        />,
      );

      expect(screen.getByTestId('pingpong-row')).toHaveAttribute(
        'data-uncertain',
        'true',
      );
    });

    it('does not mark an inactive player whose rating settled', () => {
      // The distinction FICS draws and this row keeps: a settled rating that
      // is stale is not an unknown one. They are dimmed, not questioned.
      render(
        <PingpongRow
          player={player({ rank: null, inactive: true, provisional: false })}
          position={5}
        />,
      );

      expect(screen.getByTestId('pingpong-rating')).not.toHaveTextContent('?');
      expect(screen.getByTestId('pingpong-row')).toHaveAttribute(
        'data-uncertain',
        'false',
      );
    });
  });

  describe('status labels', () => {
    it('labels a calibrating player with their progress', () => {
      // The bar is 5, not 8. The API lowered `PROVISIONAL_MIN_MATCHES` from 8
      // to 5 and this copy was left behind, so the row told players they owed
      // five more matches than they did. The figure now comes from the shared
      // `MATCHES_TO_CALIBRATE` constant rather than a local redeclaration.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 3,
          })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-status')).toHaveTextContent('3');
      expect(screen.getByTestId('pingpong-status')).toHaveTextContent('5');
      expect(screen.getByTestId('pingpong-status')).not.toHaveTextContent('8');
    });

    it('writes "1 match" without an s', () => {
      // Reported by the owner: the label read "1 matchs". French takes the s
      // only past one, and this sentence is the first thing a new player reads
      // written about themselves — Valentin and Florian are both on exactly one
      // match in the real league, so it is the common case, not the edge one.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 1,
          })}
          position={2}
        />,
      );

      const status = screen.getByTestId('pingpong-status');
      expect(status).toHaveTextContent(/\b1 match\b/);
      expect(status).not.toHaveTextContent(/1 matchs/);
    });

    it('keeps the s past one', () => {
      // The other half. A blanket removal of the s would pass the test above
      // and read as "3 match".
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 3,
          })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-status')).toHaveTextContent(
        /3 matchs/,
      );
    });

    it('writes "0 match" without an s', () => {
      // French keeps the singular at zero, unlike English. Someone enrolled
      // but not yet played sits here.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 0,
          })}
          position={8}
        />,
      );

      const status = screen.getByTestId('pingpong-status');
      expect(status).toHaveTextContent(/\b0 match\b/);
      expect(status).not.toHaveTextContent(/0 matchs/);
    });

    it('says what the calibration count leads to', () => {
      // "3/5 matchs" states a ratio without naming its purpose. The row no
      // longer withholds a number, so the sentence changed with it: the count
      // now leads to a CONFIRMED rating rather than to a rank that was being
      // held back.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            weightedMatchCount: 3,
          })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-status')).toHaveTextContent(
        /confirm/i,
      );
    });

    it('no longer tells a calibrating player they are unranked', () => {
      // The old label ended "avant d'être classé", which was the honest
      // description of a row with no number. They have a number now, and
      // repeating the old sentence under it would contradict the row.
      render(
        <PingpongRow
          player={player({ rank: null, provisional: true, weightedMatchCount: 3 })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-row')).not.toHaveTextContent(
        /non class/i,
      );
    });

    it('labels an inactive player differently', () => {
      render(
        <PingpongRow
          player={player({ rank: null, inactive: true })}
          position={5}
        />,
      );

      const status = screen.getByTestId('pingpong-status');
      expect(status).toHaveTextContent(/inactif/i);
      expect(status).not.toHaveTextContent(/\d\/5/);
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

    /**
     * The rate used to be gated on being ranked, which needs 8 weighted
     * matches. With nobody ranked yet that emptied the column for the whole
     * board — the screen lost a real number to protect against a fake one.
     * Three matches is where a percentage stops being noise: 2/3 is a
     * reading, 1/1 is an accident.
     */
    it('shows a win rate for a calibrating player past three matches', () => {
      render(
        <PingpongRow
          player={player({ wins: 5, losses: 2, rank: null, provisional: true })}
        />,
      );

      expect(screen.getByTestId('pingpong-winrate')).toHaveTextContent('71');
    });

    it('withholds it below three matches', () => {
      // 100% off one match says nothing about anyone.
      render(
        <PingpongRow
          player={player({ wins: 1, losses: 0, rank: null, provisional: true })}
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

    /**
     * Still nothing for a calibrating player, and the reasoning is now the
     * only reason left rather than a side effect of having no rank.
     *
     * `previousDayRank` is written by the API's nightly snapshot cron, which
     * records the API's own gated rank — null for anyone it excluded. So for a
     * calibrating player there is no yesterday to compare today's position
     * against, and an arrow drawn from a null baseline would invent a movement.
     * `rankMovement` reads `player.rank` (still null) rather than the board
     * position for exactly that reason: the two ends of the comparison have to
     * come from the same ruler.
     */
    it('shows nothing for a calibrating player, whose baseline is null', () => {
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            previousDayRank: 2,
            lastMatchAt: TODAY,
          })}
          position={4}
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

  describe('an uncertain row', () => {
    /**
     * Reversed deliberately. This used to assert the opposite: no rate for a
     * calibrating player, whatever they had played. The reasoning was that a
     * rate off a few matches is noise — true of one match, not of three — and
     * the cost went unnoticed until the board filled with calibrating players
     * and the column was empty for everyone. The gate is now three played
     * matches rather than being ranked; 2W-1L is exactly the boundary and
     * shows.
     */
    it('shows a win rate for a calibrating player at the threshold', () => {
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            wins: 2,
            losses: 1,
          })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-winrate')).toHaveTextContent('67');
    });

    it('still shows the rating', () => {
      // The rating exists and is real; the `?` says how far to trust it.
      render(
        <PingpongRow
          player={player({
            rank: null,
            provisional: true,
            conservativeScore: 1042,
          })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent('1042');
    });

    /**
     * DELIBERATELY REVERSED, and this is the sharpest edge of the reversal.
     *
     * This used to assert the row announced "Non classé" to a screen reader,
     * standing in for the empty rank column that sighted readers saw. There is
     * no empty column any more — the row is numbered — so announcing "unranked"
     * would now contradict the number sitting next to it, and it would say the
     * one thing this change exists to stop saying to 6 people out of 8.
     *
     * What replaces it is the marker's own words: the rating carries
     * "estimation" in an sr-only span, which is the same fact stated as
     * uncertainty rather than as exclusion.
     */
    it('does not announce itself as unranked', () => {
      render(
        <PingpongRow
          player={player({ rank: null, provisional: true })}
          position={4}
        />,
      );

      expect(screen.getByTestId('pingpong-row')).not.toHaveTextContent(
        /non classé/i,
      );
      expect(screen.getByTestId('pingpong-rating')).toHaveTextContent(
        /estimation/i,
      );
    });
  });
});
