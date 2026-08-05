import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeasonsList from '../SeasonsList';
import type { SeasonArchive } from '../../repositories/SeasonsRepository';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

/**
 * The season card's link.
 *
 * `/seasons/[year]/[month]` parses its second segment as a calendar month and
 * hands it to the API as one. The list used to build that segment from
 * `seasonNumber`, which is a different counter: season 1 was January 2026, so
 * the two agree for the whole of 2026 and diverge the moment the counter
 * passes 12. Season 13 is January 2027 — the old code produced
 * `/seasons/2027/13`, asking the API for a thirteenth month.
 *
 * Every fixture below therefore keeps `month` and `seasonNumber` distinct, so
 * a regression to `seasonNumber` cannot pass by coincidence.
 */
const makeSeason = (
  overrides: Partial<SeasonArchive> & Pick<SeasonArchive, 'id'>
): SeasonArchive => ({
  month: 1,
  seasonNumber: 13,
  year: 2027,
  seasonName: null,
  totalCompetitors: 8,
  totalRaces: 40,
  totalBettors: 0,
  totalBets: 0,
  avgCompetitorRating: 1500,
  createdAt: '2027-02-01T00:00:00Z',
  ...overrides,
});

describe('SeasonsList navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates using the calendar month, not the season number', async () => {
    const user = userEvent.setup();
    render(<SeasonsList seasons={[makeSeason({ id: 's13' })]} />);

    await user.click(screen.getByText('Saison 13 - 2027'));

    expect(push).toHaveBeenCalledWith('/seasons/2027/1');
    expect(push).not.toHaveBeenCalledWith('/seasons/2027/13');
  });

  it('never builds a segment above 12, whatever the season counter reads', async () => {
    const user = userEvent.setup();
    const seasons = [
      makeSeason({ id: 'a', year: 2027, month: 3, seasonNumber: 15 }),
      makeSeason({ id: 'b', year: 2028, month: 11, seasonNumber: 35 }),
    ];
    render(<SeasonsList seasons={seasons} />);

    await user.click(screen.getByText('Saison 15 - 2027'));
    await user.click(screen.getByText('Saison 35 - 2028'));

    expect(push).toHaveBeenNthCalledWith(1, '/seasons/2027/3');
    expect(push).toHaveBeenNthCalledWith(2, '/seasons/2028/11');

    for (const call of push.mock.calls) {
      const month = Number(String(call[0]).split('/').pop());
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    }
  });

  it('still labels the card with the season number', () => {
    render(
      <SeasonsList seasons={[makeSeason({ id: 's13', month: 1, seasonNumber: 13 })]} />
    );

    // The counter is what a player recognises; only the URL had to change.
    expect(screen.getByText('Saison 13 - 2027')).toBeInTheDocument();
    expect(screen.getByText('S13')).toBeInTheDocument();
  });
});
