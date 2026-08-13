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
  const mariokart = {
    winner: { name: 'Don Joran', rating: 1729 },
    mostActive: { names: ['Reb Lopez'], value: 51 },
    biggestClimb: { names: ['Charles Bourgeois'], value: 415 },
    biggestDrop: { names: ['Marie Filleau'], value: -565 },
    ...overrides,
  };

  return {
    ...mariokart,
    // Mario Kart only unless a test asks for ping-pong, which mirrors
    // production: no closed season has ping-pong standings yet.
    sports: { mariokart, pingpong: null },
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
    // Null by default: production has no closed season with matches yet.
    busiestPingpongSeason: null,
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
    expect(within(card).getByText('Non classé')).toBeInTheDocument();
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
    // Both ELO rows say it — climb and drop are equally unmeasurable
    // mid-season.
    expect(within(card).getAllByText('En fin de saison')).toHaveLength(2);
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
    expect(within(card).getByText('Pas de leader')).toBeInTheDocument();
  });
});

describe('ArchivedSeasonsView — the two-sport table', () => {
  const pingpongStats = {
    winner: { name: 'Théo Maitrot', rating: 1480 },
    mostActive: { names: ['Lisa Santoro'], value: 12 },
    biggestClimb: { names: ['Karen Garet'], value: 80 },
    biggestDrop: { names: ['Yann Ó hAnnaidh'], value: -45 },
  };

  it('omits the ping-pong column on seasons that have none', () => {
    // Every closed season today: the sport started in season 7. A permanent
    // second column would be four dashes tall on all six cards.
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Mario Kart')).toBeInTheDocument();
    expect(within(card).queryByText('Ping-pong')).not.toBeInTheDocument();
  });

  it('adds the column once a season carries ping-pong standings', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 's7' }),
            sports: {
              mariokart: {
                winner: { name: 'Don Joran', rating: 1628 },
                mostActive: { names: ['Reb Lopez'], value: 51 },
                biggestClimb: { names: ['Charles Bourgeois'], value: 415 },
                biggestDrop: { names: ['Marie Filleau'], value: -565 },
              },
              pingpong: pingpongStats,
            },
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Ping-pong')).toBeInTheDocument();
    // Both sports report their own winner, not one shared figure.
    expect(within(card).getByText('Don Joran')).toBeInTheDocument();
    expect(within(card).getByText('Théo Maitrot')).toBeInTheDocument();
  });

  it('counts races on one side and matches on the other', () => {
    // The unit travels with the column: each sport counts a different thing.
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 's7' }),
            sports: {
              mariokart: {
                winner: null,
                mostActive: { names: ['Reb Lopez'], value: 51 },
                biggestClimb: null,
                biggestDrop: null,
              },
              pingpong: pingpongStats,
            },
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('51 courses')).toBeInTheDocument();
    expect(within(card).getByText('12 matchs')).toBeInTheDocument();
  });

  it('names everyone tied in either column', () => {
    render(
      <ArchivedSeasonsView
        seasons={[
          withHighlights({
            season: season({ id: 's7' }),
            sports: {
              mariokart: {
                winner: null,
                mostActive: { names: ['Don Joran', 'Léo Mibord'], value: 34 },
                biggestClimb: null,
                biggestDrop: null,
              },
              pingpong: {
                ...pingpongStats,
                mostActive: { names: ['Lisa Santoro', 'Karen Garet'], value: 12 },
              },
            },
          }),
        ]}
        overview={overview()}
      />,
    );
    const card = cardFor('Saison 3');
    expect(within(card).getByText('Don Joran & Léo Mibord')).toBeInTheDocument();
    expect(
      within(card).getByText('Lisa Santoro & Karen Garet'),
    ).toBeInTheDocument();
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
    expect(screen.getByText('Courses / saison')).toBeInTheDocument();
    // Every figure carries its unit — a bare "75" on a wall screen is a
    // number without a noun.
    expect(screen.getByText('75 courses')).toBeInTheDocument();
    expect(screen.getByText('111 courses')).toBeInTheDocument();
    expect(screen.getByText('+415 ELO')).toBeInTheDocument();
  });

  it('names the sport on the superlatives that belong to one', () => {
    // The archive holds two sports. Titles and ELO climbs are Mario Kart
    // only, and an unqualified label leaves the reader to guess which.
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview()}
      />,
    );
    expect(screen.getByText('Pilote le plus titré')).toBeInTheDocument();
    expect(screen.getByText('5 saisons gagnées')).toBeInTheDocument();
    expect(
      screen.getByText('Plus grosse progression pilote'),
    ).toBeInTheDocument();
  });

  it('totals both sports once ping-pong has been played', () => {
    render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview({ totalRaces: 449, totalPingpongMatches: 26 })}
      />,
    );
    expect(screen.getByText('449 courses · 26 matchs')).toBeInTheDocument();
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
    expect(screen.getByText('Matchs / saison')).toBeInTheDocument();
    expect(screen.getByText('26 matchs')).toBeInTheDocument();
    expect(screen.getByText('ping-pong, en moyenne')).toBeInTheDocument();
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
    expect(screen.getByText('ping-pong pas encore joué')).toBeInTheDocument();
    // The totals line drops its ping-pong half too, rather than saying 0.
    expect(screen.getByText('449 courses')).toBeInTheDocument();
  });

  it('shows the busiest ping-pong season only once one has matches', () => {
    const { rerender } = render(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview({ busiestPingpongSeason: null })}
      />,
    );
    expect(
      screen.queryByText('Saison ping-pong la plus dense'),
    ).not.toBeInTheDocument();

    rerender(
      <ArchivedSeasonsView
        seasons={[withHighlights({ season: season({ id: 's1' }) })]}
        overview={overview({
          busiestPingpongSeason: {
            seasonName: 'Saison 7 - 2026',
            totalMatches: 26,
          },
        })}
      />,
    );
    const tile = screen
      .getByText('Saison ping-pong la plus dense')
      .closest('div');
    expect(tile).not.toBeNull();
    // Scoped to the tile: "26 matchs" also appears on the average above.
    expect(within(tile as HTMLElement).getByText('26 matchs')).toBeInTheDocument();
    expect(
      within(tile as HTMLElement).getByText('Saison 7 - 2026'),
    ).toBeInTheDocument();
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
