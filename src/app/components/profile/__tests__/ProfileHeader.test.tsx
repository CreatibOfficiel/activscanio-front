import { render, screen } from '@testing-library/react';
import ProfileHeader from '../ProfileHeader';
import type { UserStats } from '../../../models/Achievement';

/**
 * The header's stat pills.
 *
 * The pilot rank had a pill and the ping-pong rank did not, so someone who
 * plays both sports saw only half of where they stand. These tests pin the
 * cases the pill has to get right — chiefly that it does NOT ride on the
 * Mario Kart character, since ping-pong is played by people who never race.
 */
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, jsx-a11y/alt-text
  default: (props: any) => <img {...props} fill={undefined} />,
}));

function stats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    userId: 'u1',
    xp: 1040,
    level: 6,
    xpForNextLevel: 1300,
    xpProgressPercent: 40,
    currentTitle: null,
    totalAchievements: 0,
    unlockedAchievements: 0,
    achievementProgress: 0,
    lastAchievementUnlockedAt: null,
    totalBetsPlaced: 0,
    totalBetsWon: 0,
    totalPerfectBets: 0,
    totalPoints: 0,
    winRate: 0,
    currentMonthlyStreak: 0,
    longestLifetimeStreak: 0,
    currentLifetimeStreak: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    monthlyBetsPlaced: 0,
    monthlyBetsWon: 0,
    monthlyPerfectBets: 0,
    monthlyPoints: 0,
    monthlyRank: null,
    bestMonthlyRank: null,
    consecutiveMonthlyWins: 0,
    totalBoostsUsed: 0,
    highOddsWins: 0,
    boostedHighOddsWins: 0,
    ...overrides,
  };
}

const character = { name: 'Yoshi', variantLabel: 'Vert', imageUrl: '/y.png' };

describe('ProfileHeader ping-pong rank pill', () => {
  it('shows the ping-pong rank next to the pilot rank', () => {
    render(
      <ProfileHeader
        stats={stats()}
        userName="Thibaud C."
        character={character}
        competitorRank={4}
        pingpongRank={2}
      />,
    );
    expect(screen.getByText('pilote')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('pongiste')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('shows the ping-pong rank for someone who has no racing character', () => {
    render(
      <ProfileHeader stats={stats()} userName="Thibaud C." pingpongRank={3} />,
    );
    expect(screen.getByText('pongiste')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.queryByText('pilote')).not.toBeInTheDocument();
  });

  it('hides the pill while calibrating, when the API withholds a rank', () => {
    render(
      <ProfileHeader
        stats={stats()}
        userName="Thibaud C."
        character={character}
        competitorRank={4}
      />,
    );
    expect(screen.queryByText('pongiste')).not.toBeInTheDocument();
    expect(screen.getByText('pilote')).toBeInTheDocument();
  });
});
