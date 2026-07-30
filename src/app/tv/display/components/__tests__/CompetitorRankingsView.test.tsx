import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Competitor } from '@/app/models/Competitor';
import { CompetitorRankingsView } from '../CompetitorRankingsView';

// TVHeroCountdown ticks on a 1s interval and shows the season deadline, which
// has nothing to do with the rankings wiring. Stub it so the DOM stays stable
// and no timer leaks between tests.
jest.mock('../TVHeroCountdown', () => ({
  __esModule: true,
  default: () => <div data-testid="tv-hero-countdown" />,
}));

/**
 * Build a competitor with only the fields the leaderboard cares about.
 * `profilePictureUrl` is left empty on purpose: the row then renders an
 * initial-letter fallback instead of an <img>, keeping name lookups simple.
 */
function competitor(
  overrides: Partial<Competitor> & { id: string },
): Competitor {
  return {
    firstName: 'Test',
    lastName: 'Player',
    profilePictureUrl: '',
    rating: 1500,
    rd: 50,
    vol: 0.06,
    raceCount: 10,
    ...overrides,
  } as Competitor;
}

/**
 * Main fixture. Confirmed scores yield ranks 1,2,2,4,5,6,7,8,9,10,11,12
 * (Bob and Carla tie on 1800), mapping onto the leagues as:
 *   Champions (1-3)       -> a, b, c  (podium, excluded from the peloton)
 *   Formule 1 (4-7)       -> d, e, f, g
 *   Karting (8-11)        -> h, i, j, k
 *   Vélo à roulettes (12+)-> l
 *
 * Input order is shuffled so a test passing on insertion order would fail.
 */
const RANKINGS: Competitor[] = [
  competitor({ id: 'f', firstName: 'Fay', lastName: 'Fox', conservativeScore: 1600, previousDayRank: 8 }),
  competitor({ id: 'm', firstName: 'Mia', lastName: 'Moon', conservativeScore: 1750, inactive: true }),
  competitor({ id: 'a', firstName: 'Alice', lastName: 'Adams', conservativeScore: 1900, previousDayRank: 3 }),
  competitor({ id: 'l', firstName: 'Liam', lastName: 'Lake', conservativeScore: 1300 }),
  competitor({ id: 'o', firstName: 'Olga', lastName: 'Ortiz', conservativeScore: 1950, provisional: true, raceCount: 2 }),
  competitor({ id: 'c', firstName: 'Carla', lastName: 'Cruz', conservativeScore: 1800, previousDayRank: 2 }),
  competitor({ id: 'h', firstName: 'Hana', lastName: 'Hill', conservativeScore: 1500, previousDayRank: 8 }),
  competitor({ id: 'd', firstName: 'Dan', lastName: 'Doe', conservativeScore: 1700, previousDayRank: null }),
  competitor({ id: 'q', firstName: 'Quinn', lastName: 'Quill', conservativeScore: 2000, raceCount: 0 }),
  competitor({ id: 'j', firstName: 'Jade', lastName: 'Jones', conservativeScore: 1400 }),
  competitor({ id: 'b', firstName: 'Bob', lastName: 'Blake', conservativeScore: 1800, previousDayRank: 2 }),
  competitor({ id: 'n', firstName: 'Noah', lastName: 'Nash', conservativeScore: 1600, inactive: true }),
  competitor({ id: 'g', firstName: 'Gil', lastName: 'Gray', conservativeScore: 1550, previousDayRank: 4 }),
  competitor({ id: 'e', firstName: 'Eve', lastName: 'Evans', conservativeScore: 1650 }),
  competitor({ id: 'k', firstName: 'Kim', lastName: 'Knox', conservativeScore: 1350 }),
  competitor({ id: 'p', firstName: 'Paul', lastName: 'Price', conservativeScore: 1200, provisional: true, raceCount: 1 }),
  competitor({ id: 'i', firstName: 'Iris', lastName: 'Ives', conservativeScore: 1450 }),
];

/* ---------------------------------------------------------------- */
/*  DOM helpers, anchored on data-testid rather than styling         */
/* ---------------------------------------------------------------- */

function rowFor(name: string): HTMLElement {
  const nameNode = screen
    .getAllByTestId('tv-row-name')
    .find((n) => n.textContent?.trim() === name);
  if (!nameNode) throw new Error(`No leaderboard row found for "${name}"`);
  const row = nameNode.closest('[data-testid="tv-row"]');
  if (!row) throw new Error(`Row wrapper missing for "${name}"`);
  return row as HTMLElement;
}

function rankOf(name: string): string {
  return (
    within(rowFor(name)).getByTestId('tv-row-rank').textContent ?? ''
  ).trim();
}

function trendOf(name: string): string {
  return (
    within(rowFor(name)).getByTestId('tv-row-trend').getAttribute('data-trend') ??
    'none'
  );
}

function trendValueOf(name: string): string {
  return (
    within(rowFor(name)).getByTestId('tv-row-trend').textContent ?? ''
  ).trim();
}

function progressWidthOf(name: string): string | null {
  const bar = within(rowFor(name)).queryByTestId('tv-row-progress');
  return bar ? (bar as HTMLElement).style.width : null;
}

/** Every row name currently rendered, in DOM order. */
function allRowNames(): string[] {
  return screen
    .queryAllByTestId('tv-row-name')
    .map((n) => (n.textContent ?? '').trim());
}

function sectionAfterHeading(headingText: string): HTMLElement {
  const heading = screen.getByRole('heading', {
    name: new RegExp(headingText, 'i'),
  });
  const section = heading.closest('div.space-y-4');
  if (!section) throw new Error(`No section for heading "${headingText}"`);
  return section as HTMLElement;
}

function rowNamesIn(container: HTMLElement): string[] {
  return within(container)
    .queryAllByTestId('tv-row-name')
    .map((n) => (n.textContent ?? '').trim());
}

function leagueLabels(): string[] {
  return screen
    .queryAllByRole('heading')
    .map((h) => (h.textContent ?? '').trim())
    .filter((label) =>
      ['Formule 1', 'Karting', 'Vélo à roulettes', 'Ligue des Champions'].includes(
        label,
      ),
    );
}

function rowsUnderLeague(label: string): string[] {
  const heading = screen
    .getAllByRole('heading')
    .find((h) => (h.textContent ?? '').trim() === label);
  if (!heading) throw new Error(`No league divider for "${label}"`);
  const group = heading.closest('div.space-y-3');
  if (!group) throw new Error(`No league group for "${label}"`);
  return rowNamesIn(group as HTMLElement);
}

/* ---------------------------------------------------------------- */

describe('CompetitorRankingsView — podium', () => {
  it('puts the top three confirmed competitors on the podium', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // The podium renders its own markup, so the three leaders must not appear
    // as ordinary rows.
    expect(allRowNames()).not.toContain('Alice A.');
    expect(screen.getByText('Alice A.')).toBeInTheDocument();
    expect(screen.getByText('Bob B.')).toBeInTheDocument();
    expect(screen.getByText('Carla C.')).toBeInTheDocument();
  });

  it('keeps the podium three out of the league groups', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // A dropped excludePodiumFromLeagues would render them a second time.
    expect(screen.getAllByText('Alice A.')).toHaveLength(1);
    expect(leagueLabels()).not.toContain('Ligue des Champions');
  });

  it('falls back to stacked rows when fewer than three are confirmed', () => {
    render(
      <CompetitorRankingsView
        rankings={[
          competitor({ id: 'a', firstName: 'Alice', lastName: 'Adams', conservativeScore: 1900 }),
          competitor({ id: 'b', firstName: 'Bob', lastName: 'Blake', conservativeScore: 1800 }),
        ]}
      />,
    );
    expect(rankOf('Alice A.')).toBe('1');
    expect(rankOf('Bob B.')).toBe('2');
  });

  it('renders no hero rows when nobody is confirmed', () => {
    render(
      <CompetitorRankingsView
        rankings={[
          competitor({ id: 'o', firstName: 'Olga', lastName: 'Ortiz', conservativeScore: 1850, provisional: true, raceCount: 2 }),
        ]}
      />,
    );
    // Olga is calibrating: she shows in her own section, never on the podium.
    expect(screen.getByText('Aucun pilote confirmé pour le moment')).toBeInTheDocument();
    expect(rankOf('Olga O.')).toBe('1');
  });
});

describe('CompetitorRankingsView — sections', () => {
  it('lists confirmed competitors outside the podium in the leagues', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(leagueLabels().flatMap(rowsUnderLeague)).toEqual([
      'Dan D.', 'Eve E.', 'Fay F.', 'Gil G.',
      'Hana H.', 'Iris I.', 'Jade J.', 'Kim K.',
      'Liam L.',
    ]);
  });

  it('lists inactive competitors in the Inactifs section only', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(rowNamesIn(sectionAfterHeading('Inactifs'))).toEqual([
      'Mia M.',
      'Noah N.',
    ]);
  });

  it('lists calibrating competitors in the En calibrage section only', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(rowNamesIn(sectionAfterHeading('En calibrage'))).toEqual([
      'Olga O.',
      'Paul P.',
    ]);
  });

  it('excludes competitors with no races from every section', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // Quinn tops the fixture on score but has raced zero times.
    expect(screen.queryByText('Quinn Q.')).not.toBeInTheDocument();
  });

  it('drops leagues that hold no competitor', () => {
    render(
      <CompetitorRankingsView
        rankings={[
          competitor({ id: 'a', firstName: 'Alice', lastName: 'Adams', conservativeScore: 1900 }),
          competitor({ id: 'b', firstName: 'Bob', lastName: 'Blake', conservativeScore: 1800 }),
          competitor({ id: 'c', firstName: 'Carla', lastName: 'Cruz', conservativeScore: 1700 }),
          competitor({ id: 'd', firstName: 'Dan', lastName: 'Doe', conservativeScore: 1600 }),
          competitor({ id: 'e', firstName: 'Eve', lastName: 'Evans', conservativeScore: 1500 }),
        ]}
      />,
    );
    expect(leagueLabels()).toEqual(['Formule 1']);
  });

  it('groups confirmed competitors into the right leagues', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(rowsUnderLeague('Formule 1')).toEqual([
      'Dan D.', 'Eve E.', 'Fay F.', 'Gil G.',
    ]);
    expect(rowsUnderLeague('Karting')).toEqual([
      'Hana H.', 'Iris I.', 'Jade J.', 'Kim K.',
    ]);
    expect(rowsUnderLeague('Vélo à roulettes')).toEqual(['Liam L.']);
  });
});

describe('CompetitorRankingsView — ranks', () => {
  it('numbers confirmed competitors from 1', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(rankOf('Dan D.')).toBe('4');
    expect(rankOf('Eve E.')).toBe('5');
    expect(rankOf('Liam L.')).toBe('12');
  });

  it('gives tied competitors the same rank and skips the next', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // Bob and Carla tie on 1800 at rank 2, so Dan lands on 4, not 3.
    expect(rankOf('Dan D.')).toBe('4');
  });

  it('offsets inactive ranks past the confirmed block', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // 12 confirmed, so the inactive block starts at 13.
    expect(rankOf('Mia M.')).toBe('13');
    expect(rankOf('Noah N.')).toBe('14');
  });

  it('offsets calibrating ranks past confirmed and inactive', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // 12 confirmed + 2 inactive, so calibrating starts at 15.
    expect(rankOf('Olga O.')).toBe('15');
    expect(rankOf('Paul P.')).toBe('16');
  });
});

describe('CompetitorRankingsView — trends', () => {
  it('shows an up arrow with the gap when a competitor climbed', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // Fay was 8th, is 6th now.
    expect(rankOf('Fay F.')).toBe('6');
    expect(trendOf('Fay F.')).toBe('up');
    expect(trendValueOf('Fay F.')).toBe('2');
  });

  it('shows a down arrow with the gap when a competitor dropped', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // Gil was 4th, is 7th now.
    expect(rankOf('Gil G.')).toBe('7');
    expect(trendOf('Gil G.')).toBe('down');
    expect(trendValueOf('Gil G.')).toBe('3');
  });

  it('shows a neutral indicator when the rank did not move', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(rankOf('Hana H.')).toBe('8');
    expect(trendOf('Hana H.')).toBe('stable');
  });

  it('omits the indicator when previousDayRank is absent', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // The TV renders no arrow at all here, unlike the shared trends map which
    // would report "stable". Keeping getTrend local preserves this.
    expect(trendOf('Eve E.')).toBe('none');
  });

  it('omits the indicator when previousDayRank is null', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(trendOf('Dan D.')).toBe('none');
  });
});

describe('CompetitorRankingsView — progress bars', () => {
  it('scales bars against the best score of any competitor with races', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    // Olga is calibrating yet holds the top score, so she sets the ceiling.
    // Using confirmed[0] instead would wrongly fill Dan's bar further.
    expect(progressWidthOf('Dan D.')).toBe(`${(1700 / 1950) * 100}%`);
  });

  it('fills the bar completely for the top scorer', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(progressWidthOf('Olga O.')).toBe('100%');
  });

  it('scales inactive competitors against the same ceiling', () => {
    render(<CompetitorRankingsView rankings={RANKINGS} />);
    expect(progressWidthOf('Mia M.')).toBe(`${(1750 / 1950) * 100}%`);
  });
});

describe('CompetitorRankingsView — empty states', () => {
  it('renders the empty state when there are no rankings', () => {
    render(<CompetitorRankingsView rankings={[]} />);
    expect(screen.getByText('Aucun pilote trouvé')).toBeInTheDocument();
  });

  it('reports no confirmed driver when nobody has raced', () => {
    render(
      <CompetitorRankingsView
        rankings={[
          competitor({ id: 'a', firstName: 'Alice', lastName: 'Adams', conservativeScore: 1900, raceCount: 0 }),
        ]}
      />,
    );
    expect(
      screen.getByText('Aucun pilote confirmé pour le moment'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Alice A.')).not.toBeInTheDocument();
  });
});
