import { render, screen, waitFor } from '@testing-library/react';
import SeasonHistorySection from '../SeasonHistorySection';
import { SeasonsRepository } from '../../../repositories/SeasonsRepository';

jest.mock('../../../repositories/SeasonsRepository', () => ({
  SeasonsRepository: {
    getAllSeasons: jest.fn(),
    getCompetitorRankings: jest.fn(),
  },
}));

const mockRepo = SeasonsRepository as jest.Mocked<typeof SeasonsRepository>;

/**
 * `/seasons` had no entry point anywhere in the app — no nav item, no link,
 * reachable only by typing the URL. This section is where a player is already
 * looking at season archives, so it carries the way through to the full list.
 *
 * The link has to survive the empty state too: a player with no finished
 * season is exactly the one with nothing else to look at on their own row.
 */
describe('SeasonHistorySection link to /seasons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links to the full archive once the palmarès has loaded', async () => {
    mockRepo.getAllSeasons.mockResolvedValue([
      {
        id: 's1',
        month: 3,
        seasonNumber: 3,
        year: 2026,
        seasonName: null,
        totalCompetitors: 8,
        totalRaces: 40,
        totalBettors: 0,
        totalBets: 0,
        avgCompetitorRating: 1500,
        createdAt: '2026-04-01T00:00:00Z',
      },
    ]);
    mockRepo.getCompetitorRankings.mockResolvedValue([
      {
        id: 'r1',
        competitorId: 'c1',
        competitorName: 'Mario',
        rank: 2,
        provisional: false,
        finalRating: 1600,
        finalRd: 50,
        finalVol: 0.06,
        totalRaces: 12,
        avgRank12: 4.5,
        winStreak: 3,
        profilePictureUrl: null,
        characterImageUrl: null,
      },
    ]);

    render(<SeasonHistorySection competitorId="c1" competitorName="Mario" />);

    const link = await screen.findByRole('link', { name: /toutes les saisons/i });
    expect(link).toHaveAttribute('href', '/seasons');
  });

  it('still links to the archive when the player has no finished season', async () => {
    mockRepo.getAllSeasons.mockResolvedValue([]);

    render(<SeasonHistorySection competitorId="c1" competitorName="Mario" />);

    await waitFor(() => {
      expect(screen.getByText('Première saison en cours')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /toutes les saisons/i })
    ).toHaveAttribute('href', '/seasons');
  });
});
