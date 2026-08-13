import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SeasonArchive,
  SeasonWithHighlights,
  SeasonsOverview,
} from '@/app/repositories/SeasonsRepository';
import { ArchivedSeasonsView, formatSeasonRange } from '../ArchivedSeasonsView';

/**
 * The archived-seasons board.
 *
 * Each card now leads with the season's winner and carries three
 * superlatives under it. All four are derived at read time from the archived
 * standings, so they exist for seasons closed long before the feature did —
 * which is the property most of this file is pinning.
 */

function season(overrides: Partial<SeasonArchive> & { id: string }): SeasonArchive {
  return {
    month: 3,
    seasonNumber: 3,
    year: 2026,
    seasonName: 'Saison 3',
    startDate: '2026-04-06T00:00:00.000Z',
    endDate: '2026-05-03T23:59:59.999Z',
    totalCompetitors: 12,
    totalRaces: 40,
    totalBettors: 0,
    totalBets: 0,
    avgCompetitorRating: 1500,
    createdAt: '2026-04-01T00:00:00Z',
    ...overrides,
  } as SeasonArchive;
}

function withHighlights(
  overrides: Partial<SeasonWithHighlights> & { season: SeasonArchive },
): SeasonWithHighlights {
  return {
    winner: { name: 'Don Joran', rating: 1729 },
    mostActive: { names: ['Reb Lopez'], value: 51 },
    biggestClimb: { names: ['Charles Bourgeois'], value: 415 },
    biggestDrop: { names: ['Marie Filleau'], value: -565 },
    ...overrides,
  };
}

function overview(overrides: Partial<SeasonsOverview> = {}): SeasonsOverview {
  return {
    seasonCount: 6,
    totalRaces: 449,
    avgRacesPerSeason: 75,
    totalPingpongMatches: 26,
    avgPingpongMatchesPerSeason: 26,
    pingpongSeasonCount: 1,
    mostTitles: { names: ['Don Joran'], value: 5 },
    busiestSeason: { seasonName: 'Saison 1', totalRaces: 111 },
    mostRacesInOneSeason: { names: ['Don Joran'], value: 62 },
    bestClimbEver: {
      names: ['Charles Bourgeois'],
      value: 415,
      seasonName: 'Saison 6',
    },
    ...overrides,
  };
}

function cardFor(headingText: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: headingText });
  const card = heading.closest('div.p-3');
  if (!card) throw new Error(`No card for "${headingText}"`);
  return card as HTMLElement;
}

describe('ArchivedSeasonsView — season cards', () => {
  it('leads with the season winner and their rating', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Don Joran')).toBeInTheDocument();
    expect(within(card).getByText('1729')).toBeInTheDocument();
  });

  it('shows the three superlatives under the winner', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Reb Lopez')).toBeInTheDocument();
    expect(within(card).getByText('51 courses')).toBeInTheDocument();
    expect(within(card).getByText('Charles Bourgeois')).toBeInTheDocument();
    expect(within(card).getByText('+415')).toBeInTheDocument();
    expect(within(card).getByText('Marie Filleau')).toBeInTheDocument();
    expect(within(card).getByText('-565')).toBeInTheDocument();
  });

  it('names everyone tied rather than picking one', () => {
    // Season 2 in production really does end with two players on 34 races.
    // Showing one of them would report a result the season did not have.
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 's1' }),
            mostActive: { names: ['Don Joran', 'Léo Mibord'], value: 34 },
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Don Joran & Léo Mibord')).toBeInTheDocument();
  });

  it('dashes the ELO rows on the very first archived season', () => {
    // Nothing earlier to subtract, so the movement is unknown — not zero.
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 'first' }),
            biggestClimb: null,
            biggestDrop: null,
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getAllByText('—')).toHaveLength(2);
    // The rest of the card still reports normally.
    expect(within(card).getByText('Reb Lopez')).toBeInTheDocument();
  });

  it('titles the card with the season name, never a month', () => {
    // `month` carries the SEASON NUMBER for backward compat, so the old
    // `monthNames[month - 1]` printed "Juin" on season 6.
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 's6', month: 6, seasonNumber: 6, seasonName: 'Saison 6 - 2026' }),
          }),
        ]}
        overview={overview()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Saison 6 - 2026' })).toBeInTheDocument();
    expect(screen.queryByText(/juin/i)).not.toBeInTheDocument();
  });

  it('renders every season rather than capping the list', () => {
    // The cap used to be 12 with an "et N autres…" line, which withheld the
    // archive on a screen nobody is standing at. The auto-scroll derives its
    // speed from the content height, so a long list scrolls faster instead.
    const many = Array.from({ length: 40 }, (_, i) =>
      withHighlights({
        season: season({
          id: `s${i}`,
          seasonNumber: i + 1,
          seasonName: `Saison ${i + 1}`,
        }),
      }),
    );
    render(<ArchivedSeasonsView seasons={many} overview={overview()} />);
    expect(screen.getAllByRole('heading')).toHaveLength(40);
    expect(screen.queryByText(/autres? saisons?/i)).not.toBeInTheDocument();
  });

  it('says so when no competitor held rank 1', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }), winner: null })]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Pas de vainqueur classé')).toBeInTheDocument();
  });
});

describe('ArchivedSeasonsView — the season in progress', () => {
  it('badges the live season', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({ season: season({ id: 'live' }), inProgress: true }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('En cours')).toBeInTheDocument();
  });

  it('leaves finished seasons unbadged', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 'done' }) })]}
        overview={overview()}
      />,
    );
    expect(screen.queryByText('En cours')).not.toBeInTheDocument();
  });

  it('does not crown the leader of an unfinished season', () => {
    // The trophy and the gold go with having won. A standing that can still
    // change gets neither.
    const { container } = render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({ season: season({ id: 'live' }), inProgress: true }),
        ]}
        overview={overview()}
      />,
    );
    expect(container.textContent).not.toContain('🏆');
    expect(container.textContent).toContain('⏱');
    // The leader is still named — it is the claim about them that changes.
    // Scoped to the card: the overview bar names a champion too.
    expect(within(cardFor('Saison 3')).getByText('Don Joran')).toBeInTheDocument();
  });

  it('says why the ELO movement is absent mid-season', () => {
    // The live rating already carries the season's soft reset, so a delta
    // against last season's final would be noise, not a climb.
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 'live' }),
            inProgress: true,
            biggestClimb: null,
            biggestDrop: null,
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('En fin de saison')).toBeInTheDocument();
  });

  it('still reports the most active player mid-season', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 'live' }),
            inProgress: true,
            mostActive: { names: ['Reb Lopez'], value: 50 },
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Reb Lopez')).toBeInTheDocument();
    expect(within(card).getByText('50 courses')).toBeInTheDocument();
  });

  it('says nobody leads yet when no competitor is ranked', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 'live' }),
            inProgress: true,
            winner: null,
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Pas encore de leader')).toBeInTheDocument();
  });
});

describe('formatSeasonRange', () => {
  it('prints both months when the season crosses one', () => {
    // Season 6 in production: late June into late July. This is the case a
    // single month label could never state.
    expect(
      formatSeasonRange('2026-06-29T00:00:00.000Z', '2026-07-26T23:59:59.999Z'),
    ).toBe('29 juin → 26 juil.');
  });

  it('prints the month once when both ends share it', () => {
    // Repeating "mai" twice is noise on a card this dense.
    expect(
      formatSeasonRange('2026-05-04T00:00:00.000Z', '2026-05-31T23:59:59.999Z'),
    ).toBe('4 → 31 mai');
  });

  it('reads the dates in UTC', () => {
    // The stored start is midnight UTC. Parsed locally, a negative-offset
    // timezone would render the day before — season 5 would open on the
    // 31st of May instead of the 1st of June.
    expect(
      formatSeasonRange('2026-06-01T00:00:00.000Z', '2026-06-28T23:59:59.999Z'),
    ).toBe('1 → 28 juin');
  });

  it('returns null rather than a partial range when a date is missing', () => {
    expect(formatSeasonRange(undefined, '2026-05-03T00:00:00.000Z')).toBeNull();
    expect(formatSeasonRange('2026-04-06T00:00:00.000Z', undefined)).toBeNull();
  });

  it('returns null on an unparseable date', () => {
    // `toLocaleDateString` on an invalid Date yields "Invalid Date", which
    // would otherwise be printed verbatim on the wall screen.
    expect(formatSeasonRange('not-a-date', 'not-a-date')).toBeNull();
  });
});

describe('ArchivedSeasonsView — season dates', () => {
  it('shows the date range under the season name', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    // The name stays the heading — it is the identifier people say — and the
    // dates answer the separate question of when.
    expect(within(card).getByText('6 avr. → 3 mai')).toBeInTheDocument();
  });

  it('renders the card without dates on an archive that has none', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({
              id: 's1',
              startDate: undefined,
              endDate: undefined,
            }),
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('40 courses')).toBeInTheDocument();
    expect(within(card).queryByText(/→/)).not.toBeInTheDocument();
  });
});

describe('ArchivedSeasonsView — overview bar', () => {
  it('reports the headline figures', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview()}
      />,
    );
    expect(screen.getByText('Saisons')).toBeInTheDocument();
    expect(screen.getByText('449 courses')).toBeInTheDocument();
    expect(screen.getByText('Courses / saison')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Plus titré')).toBeInTheDocument();
    expect(screen.getByText('5 saisons')).toBeInTheDocument();
  });

  it('averages ping-pong over the seasons that had it', () => {
    // The sport arrived mid-life. Dividing its matches by every season would
    // fold in a run where it did not exist and understate it.
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview({
          totalPingpongMatches: 26,
          avgPingpongMatchesPerSeason: 26,
          pingpongSeasonCount: 1,
        })}
      />,
    );
    expect(screen.getByText('26 / saison')).toBeInTheDocument();
  });

  it('says ping-pong has not been played when no season recorded it', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview({
          totalPingpongMatches: 0,
          avgPingpongMatchesPerSeason: 0,
          pingpongSeasonCount: 0,
        })}
      />,
    );
    expect(screen.getByText('pas encore joué')).toBeInTheDocument();
  });

  it('renders the cards even when the overview is unavailable', () => {
    // The bar is supplementary; losing it must not take the archive with it.
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={null}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Saison 3' })).toBeInTheDocument();
    expect(screen.queryByText('Courses / saison')).not.toBeInTheDocument();
  });
});

describe('ArchivedSeasonsView — betting leftovers', () => {
  it('never renders the deleted betting counters', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 's1', totalBettors: 9, totalBets: 99 }),
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).queryByText(/Parieur/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/^Paris?$/i)).not.toBeInTheDocument();
    expect(within(card).queryByText('9')).not.toBeInTheDocument();
    expect(within(card).queryByText('99')).not.toBeInTheDocument();
  });
});

describe('ArchivedSeasonsView — empty state', () => {
  it('renders the empty state with no seasons', () => {
    render(<ArchivedSeasonsView seasons={[]} overview={null} />);
    expect(screen.getByText('Aucune saison archivée')).toBeInTheDocument();
  });
});
