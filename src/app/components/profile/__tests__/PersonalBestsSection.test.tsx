import { render, screen } from '@testing-library/react';
import PersonalBestsSection from '../PersonalBestsSection';
import { Competitor } from '../../../models/Competitor';
import { PingpongPlayer } from '../../../models/Pingpong';
import type { CompetitorStats } from '../../../profile/page';

/**
 * The medal channel, rendered.
 *
 * The section exists because the rest of the app celebrates rank, and a rank
 * is zero-sum: in a 25-person office half the players are in the bottom half
 * by construction, and the screen has nothing true and encouraging to say to
 * them. A personal best does. The test that governs every line below is the
 * one named "is untouchable by other players" — if another person's numbers
 * can change this section, the feature has failed its own premise.
 */

function competitor(overrides: Partial<Competitor> = {}): Competitor {
  return {
    id: 'me',
    firstName: 'Thibaud',
    lastName: 'Carron',
    profilePictureUrl: '',
    rating: 1600,
    rd: 60,
    vol: 0.06,
    recentPositions: [1, 3, 2],
    lifetimeAvgRank: 4,
    ...overrides,
  };
}

function stats(overrides: Partial<CompetitorStats> = {}): CompetitorStats {
  return {
    conservativeScore: 1480,
    raceCount: 20,
    avgRank12: 4.5,
    totalWins: 5,
    winStreak: 2,
    bestWinStreak: 6,
    playStreak: 3,
    bestPlayStreak: 9,
    ...overrides,
  };
}

describe('PersonalBestsSection', () => {
  it('shows the best finishing position ever achieved', () => {
    render(
      <PersonalBestsSection
        competitor={competitor({ recentPositions: [4, 1, 3] })}
        stats={stats()}
      />,
    );

    expect(screen.getByTestId('pb-best-position')).toHaveTextContent('1');
  });

  it('shows the best streak', () => {
    render(
      <PersonalBestsSection
        competitor={competitor()}
        stats={stats({ bestPlayStreak: 12 })}
      />,
    );

    expect(screen.getByTestId('pb-streak')).toHaveTextContent('12');
  });

  it('shows the sets-won ratio when the player plays ping-pong', () => {
    render(
      <PersonalBestsSection
        competitor={competitor()}
        stats={stats()}
        pingpongPlayer={{ setsWon: 3, setsLost: 1 } as PingpongPlayer}
      />,
    );

    expect(screen.getByTestId('pb-sets-ratio')).toHaveTextContent('75');
  });

  describe('missing data', () => {
    it('omits the position card rather than printing a zero', () => {
      // "Meilleure position : 0" is nonsense. The card is dropped instead.
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [] })}
          stats={stats()}
        />,
      );

      expect(screen.queryByTestId('pb-best-position')).not.toBeInTheDocument();
    });

    it('omits the sets card for a player who has never played ping-pong', () => {
      // "0 %" reads as having lost every set they ever played.
      render(<PersonalBestsSection competitor={competitor()} stats={stats()} />);

      expect(screen.queryByTestId('pb-sets-ratio')).not.toBeInTheDocument();
    });

    it('omits the streak card when nothing was ever strung together', () => {
      render(
        <PersonalBestsSection
          competitor={competitor()}
          stats={stats({ bestPlayStreak: 0, playStreak: 0 })}
        />,
      );

      expect(screen.queryByTestId('pb-streak')).not.toBeInTheDocument();
    });

    it('renders no zero anywhere for a competitor with no history', () => {
      // A wall of zeroes is the single worst thing this section could show
      // a newcomer: four medals, all reading "nothing".
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [], lifetimeAvgRank: 0 })}
          stats={stats({ raceCount: 0, bestPlayStreak: 0, playStreak: 0 })}
        />,
      );

      const section = screen.getByTestId('pb-section');
      expect(section.textContent).not.toMatch(/\b0\b/);
    });
  });

  describe('empty state', () => {
    it('invites a first race instead of showing an empty box', () => {
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [], lifetimeAvgRank: 0 })}
          stats={stats({ raceCount: 0, bestPlayStreak: 0, playStreak: 0 })}
        />,
      );

      expect(screen.getByTestId('pb-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('pb-best-position')).not.toBeInTheDocument();
    });

    it('invites a first race when handed no competitor at all', () => {
      render(<PersonalBestsSection competitor={null} stats={null} />);

      expect(screen.getByTestId('pb-empty')).toBeInTheDocument();
    });

    it('shows the section, not the invitation, once one best exists', () => {
      // One medal is still a medal.
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [5], lifetimeAvgRank: 0 })}
          stats={stats({ bestPlayStreak: 0, playStreak: 0 })}
        />,
      );

      expect(screen.queryByTestId('pb-empty')).not.toBeInTheDocument();
      expect(screen.getByTestId('pb-best-position')).toHaveTextContent('5');
    });
  });

  describe('form, measured against the player own history', () => {
    it('reads as an improvement when recent races beat the lifetime average', () => {
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [2, 2], lifetimeAvgRank: 5 })}
          stats={stats()}
        />,
      );

      expect(screen.getByTestId('pb-form')).toHaveAttribute(
        'data-direction',
        'better',
      );
    });

    it('reads as a decline when recent races are worse than the lifetime average', () => {
      // A lower average rank is a better result. Rendering this backwards
      // would congratulate a player for sliding down the field.
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [7, 7], lifetimeAvgRank: 4 })}
          stats={stats()}
        />,
      );

      expect(screen.getByTestId('pb-form')).toHaveAttribute(
        'data-direction',
        'worse',
      );
    });

    it('reads as level when recent races match the lifetime average', () => {
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [4, 4], lifetimeAvgRank: 4 })}
          stats={stats()}
        />,
      );

      expect(screen.getByTestId('pb-form')).toHaveAttribute(
        'data-direction',
        'level',
      );
    });

    it('omits the form card without a lifetime baseline to compare against', () => {
      render(
        <PersonalBestsSection
          competitor={competitor({ recentPositions: [1, 2], lifetimeAvgRank: 0 })}
          stats={stats()}
        />,
      );

      expect(screen.queryByTestId('pb-form')).not.toBeInTheDocument();
    });
  });

  /**
   * The load-bearing test for the whole feature.
   *
   * Two fixtures whose ONLY difference is other players' numbers. If the
   * rendered output differs by a single byte, something in this section is
   * reading a comparative figure, and the medal channel has quietly become
   * a second leaderboard.
   */
  describe('isolation from other players', () => {
    it('renders identically whatever everyone else did', () => {
      const mine = competitor({
        id: 'me',
        recentPositions: [2, 3, 1],
        lifetimeAvgRank: 5,
      });
      const myStats = stats();

      // A field of also-rans. Everyone else is slow, and there are two of
      // them. The sizes differ deliberately: an earlier version of this
      // fixture used two players on both sides, and a mutation that
      // rendered `allCompetitors.length` slipped through it unnoticed.
      const weakField: Competitor[] = [
        competitor({ id: 'a', rating: 900, rd: 200, recentPositions: [11, 12], lifetimeAvgRank: 11 }),
        competitor({ id: 'b', rating: 950, rd: 190, recentPositions: [10, 11], lifetimeAvgRank: 10 }),
      ];

      // A different field, full of champions, and a different size. Same
      // "me" in both.
      const strongField: Competitor[] = [
        competitor({ id: 'a', rating: 2400, rd: 20, recentPositions: [1, 1], lifetimeAvgRank: 1.2 }),
        competitor({ id: 'b', rating: 2350, rd: 22, recentPositions: [1, 2], lifetimeAvgRank: 1.4 }),
        competitor({ id: 'c', rating: 2300, rd: 25, recentPositions: [2, 1], lifetimeAvgRank: 1.6 }),
        competitor({ id: 'd', rating: 2280, rd: 28, recentPositions: [1, 3], lifetimeAvgRank: 1.8 }),
      ];

      const weak = render(
        <PersonalBestsSection
          competitor={mine}
          stats={myStats}
          allCompetitors={weakField}
        />,
      );
      const weakHtml = weak.getByTestId('pb-section').innerHTML;
      weak.unmount();

      const strong = render(
        <PersonalBestsSection
          competitor={mine}
          stats={myStats}
          allCompetitors={strongField}
        />,
      );
      const strongHtml = strong.getByTestId('pb-section').innerHTML;

      expect(strongHtml).toBe(weakHtml);
    });

    it('renders identically whether or not a rank is even available', () => {
      // The section is handed a rank on purpose, to prove it ignores one.
      // A rank is the canonical number another player can move.
      const mine = competitor({ recentPositions: [3, 4], lifetimeAvgRank: 6 });

      const first = render(
        <PersonalBestsSection competitor={mine} stats={stats()} competitorRank={1} />,
      );
      const firstHtml = first.getByTestId('pb-section').innerHTML;
      first.unmount();

      const last = render(
        <PersonalBestsSection competitor={mine} stats={stats()} competitorRank={25} />,
      );

      expect(last.getByTestId('pb-section').innerHTML).toBe(firstHtml);
    });
  });
});
