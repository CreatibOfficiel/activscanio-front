import { render, screen } from '@testing-library/react';
import BestWinCard from '../BestWinCard';
import { PingpongBestWin } from '../../../models/Pingpong';

/**
 * The strongest opponent beaten.
 *
 * This is the medal to the leaderboard's crown. A rank is zero-sum — half a
 * 25-person office sits in its bottom half by construction — so the board
 * alone tells most people a discouraging story they cannot change. This
 * number can only go up, and nobody else's play can lower it.
 *
 * The tests below pin the two properties that make that true: it reads the
 * opponent's rating from BEFORE the match, and a player with no wins gets
 * an invitation rather than a zero.
 */
describe('BestWinCard', () => {
  function bestWin(overrides: Partial<PingpongBestWin> = {}): PingpongBestWin {
    return {
      matchId: 'm1',
      opponentId: 'p2',
      opponentRating: 1720,
      playerRating: 1480,
      playedAt: '2026-07-20T12:00:00Z',
      opponent: {
        id: 'p2',
        competitorId: 'c2',
        firstName: 'Marc',
        lastName: 'Dupont',
        profilePictureUrl: '',
      },
      ...overrides,
    };
  }

  it('names the opponent beaten', () => {
    render(<BestWinCard bestWin={bestWin()} />);

    expect(screen.getByText(/Marc/)).toBeInTheDocument();
  });

  it('shows the rating they held at the time', () => {
    // Before the match, not after: afterwards they have already lost points
    // to this very defeat, which would understate the feat.
    render(<BestWinCard bestWin={bestWin({ opponentRating: 1720 })} />);

    expect(screen.getByTestId('best-win-rating')).toHaveTextContent('1720');
  });

  it('shows the gap when both ratings are known', () => {
    render(
      <BestWinCard
        bestWin={bestWin({ opponentRating: 1720, playerRating: 1480 })}
      />,
    );

    expect(screen.getByTestId('best-win-gap')).toHaveTextContent('240');
  });

  it('shows no gap when the player rating is unknown', () => {
    // Older rows predate the per-match rating columns. A missing value must
    // not render as a 1720-point gap.
    render(<BestWinCard bestWin={bestWin({ playerRating: null })} />);

    expect(screen.queryByTestId('best-win-gap')).not.toBeInTheDocument();
  });

  it('shows no gap when the opponent was rated lower', () => {
    // Beating someone below you is a win, not an upset. A negative gap
    // would read as a boast about nothing.
    render(
      <BestWinCard
        bestWin={bestWin({ opponentRating: 1400, playerRating: 1600 })}
      />,
    );

    expect(screen.queryByTestId('best-win-gap')).not.toBeInTheDocument();
  });

  it('invites a first win when there is none', () => {
    // Null, never zero: "you beat someone rated 0" did not happen.
    render(<BestWinCard bestWin={null} />);

    expect(screen.getByTestId('best-win-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('best-win-rating')).not.toBeInTheDocument();
  });

  it('degrades to an unnamed record when the opponent is gone', () => {
    // Someone who left the company still counts: the feat happened.
    render(<BestWinCard bestWin={bestWin({ opponent: null })} />);

    expect(screen.getByTestId('best-win-rating')).toHaveTextContent('1720');
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('says when it happened', () => {
    render(<BestWinCard bestWin={bestWin()} />);

    expect(screen.getByTestId('best-win-date')).toBeInTheDocument();
  });

  /**
   * The card was written for one reader — the player themselves — and now
   * has two: the leaderboard opens it for whoever you tapped. "au-dessus de
   * toi" addressed to someone reading a colleague's card is not a wording
   * nit, it misattributes the rating gap to the wrong person and makes the
   * number wrong.
   */
  describe('viewed on someone else', () => {
    it('speaks to the player by default', () => {
      // The profile page passes nothing, and must keep the copy it had.
      render(<BestWinCard bestWin={bestWin()} />);

      expect(screen.getByTestId('best-win-gap')).toHaveTextContent(/toi/);
    });

    it('drops the second person when viewing another player', () => {
      render(<BestWinCard bestWin={bestWin()} perspective="other" />);

      expect(screen.getByTestId('best-win-gap')).not.toHaveTextContent(/toi/);
    });

    it('still states the gap when viewing another player', () => {
      // Rewording must not quietly drop the number the card exists for.
      render(<BestWinCard bestWin={bestWin()} perspective="other" />);

      expect(screen.getByTestId('best-win-gap')).toHaveTextContent('240');
    });

    it('rewords the empty state too', () => {
      // "Ta première victoire s'affichera ici" on a colleague's card
      // promises the reader something that will never appear for them.
      render(<BestWinCard bestWin={null} perspective="other" />);

      const empty = screen.getByTestId('best-win-empty');
      expect(empty).not.toHaveTextContent(/\bTa\b/);
      expect(empty).not.toHaveTextContent(/t'être/);
    });
  });
});
