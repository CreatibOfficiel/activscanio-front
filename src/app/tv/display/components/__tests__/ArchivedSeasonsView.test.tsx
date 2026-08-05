import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonArchive } from '@/app/repositories/SeasonsRepository';
import { ArchivedSeasonsView } from '../ArchivedSeasonsView';

/**
 * The archived-seasons tiles.
 *
 * They used to report bettors and bets. The betting system was deleted
 * months ago, so those two counters read 0 on every archive written since —
 * two of the four tiles on the card were permanently, confidently wrong.
 */

function season(overrides: Partial<SeasonArchive> & { id: string }): SeasonArchive {
  return {
    month: 3,
    seasonNumber: 3,
    year: 2026,
    seasonName: 'Saison 3',
    totalCompetitors: 12,
    totalRaces: 40,
    totalBettors: 0,
    totalBets: 0,
    avgCompetitorRating: 1500,
    createdAt: '2026-04-01T00:00:00Z',
    ...overrides,
  } as SeasonArchive;
}

function cardFor(headingText: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: headingText });
  const card = heading.closest('div.p-3');
  if (!card) throw new Error(`No card for "${headingText}"`);
  return card as HTMLElement;
}

describe('ArchivedSeasonsView — ping-pong tiles', () => {
  it('reports ping-pong players and matches', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          season({ id: 's1', totalPingpongPlayers: 7, totalPingpongMatches: 34 }),
        ]}
      />,
    );
    const card = cardFor('Mars 2026');
    expect(within(card).getByText('Joueurs ping-pong')).toBeInTheDocument();
    expect(within(card).getByText('7')).toBeInTheDocument();
    expect(within(card).getByText('Matchs ping-pong')).toBeInTheDocument();
    expect(within(card).getByText('34')).toBeInTheDocument();
  });

  it('singularises the ping-pong labels for a count of one', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          season({ id: 's1', totalPingpongPlayers: 1, totalPingpongMatches: 1 }),
        ]}
      />,
    );
    const card = cardFor('Mars 2026');
    expect(within(card).getByText('Joueur ping-pong')).toBeInTheDocument();
    expect(within(card).getByText('Match ping-pong')).toBeInTheDocument();
  });

  it('omits the ping-pong tiles on archives written before ping-pong existed', () => {
    // The fields are optional, not zero. `?? 0` would print a confident "0
    // joueurs" for a season where the sport did not exist — a wrong fact,
    // where saying nothing is right.
    render(<ArchivedSeasonsView seasons={[season({ id: 'old' })]} />);
    const card = cardFor('Mars 2026');
    expect(within(card).queryByText(/ping-pong/i)).not.toBeInTheDocument();
    // The Mario Kart half still renders.
    expect(within(card).getByText('Pilotes')).toBeInTheDocument();
    expect(within(card).getByText('12')).toBeInTheDocument();
  });

  it('shows a real zero when the season recorded no ping-pong', () => {
    // Present-and-zero is a fact: the sport existed and nobody played.
    render(
      <ArchivedSeasonsView
        seasons={[
          season({ id: 's1', totalPingpongPlayers: 0, totalPingpongMatches: 0 }),
        ]}
      />,
    );
    const card = cardFor('Mars 2026');
    expect(within(card).getByText('Joueurs ping-pong')).toBeInTheDocument();
    expect(within(card).getAllByText('0')).toHaveLength(2);
  });
});

describe('ArchivedSeasonsView — betting leftovers', () => {
  it('never renders the deleted betting counters', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          season({ id: 's1', totalBettors: 9, totalBets: 99, totalPingpongPlayers: 7, totalPingpongMatches: 34 }),
        ]}
      />,
    );
    const card = cardFor('Mars 2026');
    // Even an old archive carrying non-zero betting numbers must not show
    // them: the feature is gone, so the count describes nothing on screen.
    expect(within(card).queryByText(/Parieur/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/^Paris?$/i)).not.toBeInTheDocument();
    expect(within(card).queryByText('9')).not.toBeInTheDocument();
    expect(within(card).queryByText('99')).not.toBeInTheDocument();
  });
});

describe('ArchivedSeasonsView — empty state', () => {
  it('renders the empty state with no seasons', () => {
    render(<ArchivedSeasonsView seasons={[]} />);
    expect(screen.getByText('Aucune saison archivée')).toBeInTheDocument();
  });
});
