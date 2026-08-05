import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PingpongPlayer } from '@/app/models/Pingpong';
import { PingpongRankingsView, computeMaxScore } from '../PingpongRankingsView';

/**
 * The ping-pong board on the office TV.
 *
 * Sibling of CompetitorRankingsView rather than a generalisation of it: the
 * two sports share row and podium components but not a single field name,
 * and the leagues on the Mario Kart board are motorsport metaphors that
 * would read as a bug over a ping-pong table.
 */

/** Fixed "now" so the activity window in rankMovement is deterministic. */
const NOW = new Date('2026-03-15T12:00:00Z');
/** Inside the two-day window: an arrow is allowed. */
const RECENT = '2026-03-14T18:00:00Z';
/** Outside it: the player did not play, so no arrow belongs to them. */
const STALE = '2026-03-01T09:00:00Z';

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

function player(
  overrides: Partial<PingpongPlayer> & { id: string },
): PingpongPlayer {
  return {
    competitorId: `c-${overrides.id}`,
    firstName: 'Test',
    lastName: 'Player',
    // Left empty on purpose: the row then renders an initial-letter
    // fallback instead of an <img>, keeping name lookups simple.
    profilePictureUrl: '',
    rating: 1500,
    rd: 60,
    vol: 0.06,
    conservativeScore: 1380,
    matchCount: 20,
    weightedMatchCount: 20,
    wins: 12,
    losses: 8,
    setsWon: 28,
    setsLost: 22,
    currentStreak: 2,
    bestStreak: 5,
    lastMatchAt: RECENT,
    previousDayRank: null,
    provisional: false,
    inactive: false,
    archived: false,
    isRankingEligible: true,
    distinctOpponents21d: 4,
    diversityScore21d: 0.8,
    rank: null,
    ...overrides,
  } as PingpongPlayer;
}

/**
 * A dense board: eight ranked players, enough to earn the split-column
 * layout with a podium, plus one player from each of the other tiers.
 * Order is shuffled so a test passing on insertion order would fail.
 */
const PLAYERS: PingpongPlayer[] = [
  player({ id: 'd', firstName: 'Dan', lastName: 'Doe', rank: 4, conservativeScore: 1400 }),
  player({ id: 'z', firstName: 'Zoe', lastName: 'Zane', rank: null, archived: true, conservativeScore: 1700 }),
  player({ id: 'a', firstName: 'Alice', lastName: 'Adams', rank: 1, conservativeScore: 1620, previousDayRank: 3, lastMatchAt: RECENT }),
  player({ id: 'm', firstName: 'Mia', lastName: 'Moon', rank: null, inactive: true, conservativeScore: 1450 }),
  player({ id: 'c', firstName: 'Carla', lastName: 'Cruz', rank: 3, conservativeScore: 1480 }),
  player({ id: 'o', firstName: 'Olga', lastName: 'Ortiz', rank: null, provisional: true, conservativeScore: 1300, weightedMatchCount: 3 }),
  player({ id: 'e', firstName: 'Eve', lastName: 'Evans', rank: 5, conservativeScore: 1350, previousDayRank: 2, lastMatchAt: STALE }),
  player({ id: 'b', firstName: 'Bob', lastName: 'Blake', rank: 2, conservativeScore: 1550, previousDayRank: 1, lastMatchAt: RECENT }),
  player({ id: 'f', firstName: 'Fay', lastName: 'Fox', rank: 6, conservativeScore: 1320 }),
  player({ id: 'g', firstName: 'Gil', lastName: 'Gray', rank: 7, conservativeScore: 1290 }),
  player({ id: 'h', firstName: 'Hana', lastName: 'Hill', rank: 8, conservativeScore: 1260 }),
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

/* ---------------------------------------------------------------- */

describe('PingpongRankingsView — podium', () => {
  it('puts the top three ranked players on the podium, not in the row list', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    // The podium renders its own markup, so the three leaders must not also
    // appear as ordinary rows.
    expect(allRowNames()).not.toContain('Alice A.');
    expect(allRowNames()).not.toContain('Bob B.');
    expect(allRowNames()).not.toContain('Carla C.');
    expect(screen.getByText('Alice A.')).toBeInTheDocument();
    expect(screen.getByText('Bob B.')).toBeInTheDocument();
    expect(screen.getByText('Carla C.')).toBeInTheDocument();
  });

  it('lists the ranked players below the podium as rows', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(rankOf('Dan D.')).toBe('4');
    expect(rankOf('Eve E.')).toBe('5');
  });

  it('drops the podium on a sparse board even above the minPodiumSize', () => {
    // Five ranked players clear segmentPingpongLeaderboard's three-player
    // podium guard, but a podium plus two orphan rows is not a layout. The
    // sparse tier goes single-column instead.
    const sparse = PLAYERS.filter(
      (p) => p.rank !== null && (p.rank as number) <= 5,
    );
    render(<PingpongRankingsView players={sparse} />);
    expect(allRowNames()).toEqual([
      'Alice A.', 'Bob B.', 'Carla C.', 'Dan D.', 'Eve E.',
    ]);
  });

  it('shows no podium and stacks both players as rows when only two are ranked', () => {
    // segmentPingpongLeaderboard's minPodiumSize guard puts everyone in
    // `rest` below three ranked players. Rendering `rest` inherits that —
    // a second length check here would be a second place to get it wrong.
    render(
      <PingpongRankingsView
        players={[
          player({ id: 'a', firstName: 'Alice', lastName: 'Adams', rank: 1, conservativeScore: 1600 }),
          player({ id: 'b', firstName: 'Bob', lastName: 'Blake', rank: 2, conservativeScore: 1500 }),
        ]}
      />,
    );
    expect(allRowNames()).toEqual(['Alice A.', 'Bob B.']);
    expect(rankOf('Alice A.')).toBe('1');
    expect(rankOf('Bob B.')).toBe('2');
    // Exactly one occurrence each: on the podium they would render twice.
    expect(screen.getAllByText('Alice A.')).toHaveLength(1);
  });

  it('renders calibrating-only boards as rows with no podium', () => {
    // Week one: nobody is ranked yet, and the board must still work.
    render(
      <PingpongRankingsView
        players={[
          player({ id: 'o', firstName: 'Olga', lastName: 'Ortiz', rank: null, provisional: true }),
          player({ id: 'p', firstName: 'Paul', lastName: 'Price', rank: null, provisional: true }),
        ]}
      />,
    );
    expect(rowNamesIn(sectionAfterHeading('Calibrage'))).toEqual([
      'Olga O.',
      'Paul P.',
    ]);
    expect(screen.getAllByText('Olga O.')).toHaveLength(1);
  });
});

describe('PingpongRankingsView — sections', () => {
  it('lists inactive players in the inactive section only', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(rowNamesIn(sectionAfterHeading('Inactifs'))).toEqual(['Mia M.']);
    expect(screen.getAllByText('Mia M.')).toHaveLength(1);
  });

  it('lists calibrating players in the calibration section only', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(rowNamesIn(sectionAfterHeading('Calibrage'))).toEqual(['Olga O.']);
    expect(screen.getAllByText('Olga O.')).toHaveLength(1);
  });

  it('excludes archived players from every section', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    // Zoe tops the fixture on score but has not played for six months.
    expect(screen.queryByText('Zoe Z.')).not.toBeInTheDocument();
  });

  it('shows no motorsport league headings', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    // "Formule 1" over a ping-pong table reads as a rendering bug.
    for (const label of ['Formule 1', 'Karting', 'Vélo à roulettes']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});

describe('PingpongRankingsView — calibration', () => {
  it('shows progress toward a rank as a bar, and no rank number', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    // Olga has 3 of the 8 weighted matches a rank needs.
    const row = rowFor('Olga O.');
    const bar = within(row).getByTestId('tv-calibration-progress');
    expect((bar as HTMLElement).style.width).toBe(`${(3 / 8) * 100}%`);
    // A rank number here would claim a position the API withheld.
    expect(within(row).queryByTestId('tv-row-rank')).not.toBeInTheDocument();
  });

  it('caps the bar at full once the match quota is met', () => {
    // A player can pass 8 weighted matches and still be provisional on RD.
    render(
      <PingpongRankingsView
        players={[
          player({ id: 'o', firstName: 'Olga', lastName: 'Ortiz', rank: null, provisional: true, weightedMatchCount: 12 }),
        ]}
      />,
    );
    const bar = within(rowFor('Olga O.')).getByTestId('tv-calibration-progress');
    expect((bar as HTMLElement).style.width).toBe('100%');
  });

  it('orders calibrating players by matches played, not by rating', () => {
    // Progress, not skill: the lower-rated player who has played more is
    // closer to being ranked, and that is what the section reports.
    render(
      <PingpongRankingsView
        players={[
          player({ id: 'o', firstName: 'Olga', lastName: 'Ortiz', rank: null, provisional: true, weightedMatchCount: 2, conservativeScore: 1500 }),
          player({ id: 'p', firstName: 'Paul', lastName: 'Price', rank: null, provisional: true, weightedMatchCount: 6, conservativeScore: 1200 }),
        ]}
      />,
    );
    expect(rowNamesIn(sectionAfterHeading('Calibrage'))).toEqual([
      'Paul P.',
      'Olga O.',
    ]);
  });
});

describe('PingpongRankingsView — trends', () => {
  it('shows an arrow for a player who moved and played recently', () => {
    const players = PLAYERS.map((p) =>
      p.id === 'f' ? { ...p, previousDayRank: 8, lastMatchAt: RECENT } : p,
    );
    render(<PingpongRankingsView players={players} />);
    // Fay was 8th, is 6th, and played yesterday.
    expect(rankOf('Fay F.')).toBe('6');
    expect(trendOf('Fay F.')).toBe('up');
    expect(trendValueOf('Fay F.')).toBe('2');
  });

  it('shows a down arrow when a recently-active player dropped', () => {
    const players = PLAYERS.map((p) =>
      p.id === 'd' ? { ...p, previousDayRank: 1, lastMatchAt: RECENT } : p,
    );
    render(<PingpongRankingsView players={players} />);
    // Dan was 1st, is 4th, and played yesterday.
    expect(trendOf('Dan D.')).toBe('down');
    expect(trendValueOf('Dan D.')).toBe('3');
  });

  it('omits the arrow when the last match is older than the activity window', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    // Eve dropped from 2nd to 5th, but has not played for two weeks — the
    // move was somebody else's doing, so no arrow is put on her row.
    expect(rankOf('Eve E.')).toBe('5');
    expect(trendOf('Eve E.')).toBe('none');
  });

  it('omits the arrow when there is no previous rank to compare', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(trendOf('Dan D.')).toBe('none');
  });
});

describe('PingpongRankingsView — progress bars', () => {
  it('scales bars against the best visible score', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    // Alice's 1620 is the ceiling: Zoe's higher 1700 is archived and hidden,
    // so scaling against her would leave every visible bar short.
    expect(progressWidthOf('Dan D.')).toBe(`${(1400 / 1620) * 100}%`);
  });

  it('scales inactive players against the same ceiling', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(progressWidthOf('Mia M.')).toBe(`${(1450 / 1620) * 100}%`);
  });

  it('fills the bar completely for the top scorer', () => {
    render(
      <PingpongRankingsView
        players={[
          player({ id: 'a', firstName: 'Alice', lastName: 'Adams', rank: 1, conservativeScore: 1500 }),
          player({ id: 'b', firstName: 'Bob', lastName: 'Blake', rank: 2, conservativeScore: 750 }),
        ]}
      />,
    );
    expect(progressWidthOf('Alice A.')).toBe('100%');
    expect(progressWidthOf('Bob B.')).toBe('50%');
  });

});

describe('computeMaxScore', () => {
  it('returns 0 rather than -Infinity for an empty board', () => {
    // Math.max() of nothing is -Infinity, which is truthy — a row handed
    // that draws a permanently-0% bar instead of omitting the bar. The memo
    // that calls this runs on an empty board because a hook cannot sit
    // behind the early return, so the branch is live.
    expect(computeMaxScore([])).toBe(0);
    expect(Number.isFinite(computeMaxScore([]))).toBe(true);
  });

  it('takes the highest conservative score', () => {
    expect(
      computeMaxScore([
        player({ id: 'a', conservativeScore: 1200 }),
        player({ id: 'b', conservativeScore: 1620 }),
        player({ id: 'c', conservativeScore: 1450 }),
      ]),
    ).toBe(1620);
  });
});

describe('PingpongRankingsView — empty states', () => {
  it('renders the empty state without throwing on an empty list', () => {
    // Math.max() of nothing is -Infinity, which would silently produce
    // NaN-width progress bars rather than an error.
    expect(() => render(<PingpongRankingsView players={[]} />)).not.toThrow();
    expect(screen.getByText('Aucun joueur trouvé')).toBeInTheDocument();
  });

  it('renders the empty state when every player is archived', () => {
    render(
      <PingpongRankingsView
        players={[player({ id: 'z', rank: null, archived: true })]}
      />,
    );
    expect(screen.getByText('Aucun joueur trouvé')).toBeInTheDocument();
  });
});

/* ---------------------------------------------------------------- */
/*  Legibility and entry animation                                   */
/* ---------------------------------------------------------------- */

/** The wrapper holding the rows under a section heading. */
function rowContainerUnder(headingText: string): HTMLElement {
  const section = sectionAfterHeading(headingText);
  const container = within(section)
    .getAllByTestId('tv-row')[0]
    .parentElement;
  if (!container) throw new Error(`No row container under "${headingText}"`);
  return container;
}

describe('PingpongRankingsView — inactive row legibility', () => {
  /**
   * Same defect and same fix as the Mario Kart board, deliberately: the
   * two boards rotate on one screen and a viewer reads them as one thing,
   * so "inactive" cannot mean two different greys.
   */
  it('does not dim inactive rows with alpha', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(rowContainerUnder('Inactifs').className).not.toMatch(/opacity-\d/);
  });

  it('still marks the inactive section as visually distinct', () => {
    render(<PingpongRankingsView players={PLAYERS} />);
    expect(rowContainerUnder('Inactifs').className).toMatch(/tv-row-muted/);
  });
});

describe('PingpongRankingsView — entry animation', () => {
  it('animates rows on first render', () => {
    render(<PingpongRankingsView players={PLAYERS} viewEntryKey={0} />);
    expect(
      screen.getAllByTestId('tv-row').some((r) =>
        r.className.includes('animate-row-slide-in'),
      ),
    ).toBe(true);
  });

  it('does not animate rows that remount while the view is still on screen', () => {
    const { rerender } = render(
      <PingpongRankingsView players={PLAYERS} viewEntryKey={0} />,
    );
    // A poll that moves a ranked player into the inactive tier.
    const polled = PLAYERS.map((p) =>
      p.id === 'h' ? { ...p, rank: null, inactive: true } : { ...p },
    );
    rerender(<PingpongRankingsView players={polled} viewEntryKey={0} />);

    expect(
      screen.getAllByTestId('tv-row').filter((r) =>
        r.className.includes('animate-row-slide-in'),
      ),
    ).toHaveLength(0);
  });

  it('animates again when the view is re-entered', () => {
    const { rerender } = render(
      <PingpongRankingsView players={PLAYERS} viewEntryKey={0} />,
    );
    rerender(<PingpongRankingsView players={PLAYERS} viewEntryKey={0} />);
    rerender(<PingpongRankingsView players={PLAYERS} viewEntryKey={1} />);

    expect(
      screen.getAllByTestId('tv-row').some((r) =>
        r.className.includes('animate-row-slide-in'),
      ),
    ).toBe(true);
  });
});
