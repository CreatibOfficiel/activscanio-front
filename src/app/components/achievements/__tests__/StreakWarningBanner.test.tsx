import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import StreakWarningBanner from '../StreakWarningBanner';
import { StreakWarningStatus } from '../../../models/Achievement';

/**
 * Streak warnings on the home page.
 *
 * This component shipped a live 404. It rendered a red banner reading
 * "DERNIER JOUR pour parier !" linking to /betting — a route deleted with
 * the betting system. The condition is reachable today: the API still sets
 * bettingStreak.atRisk for anyone with a running participation streak who
 * has not played this week, so the banner appears on the home page and the
 * link goes nowhere.
 *
 * The betting half is removed. The play-streak half stays, because it links
 * to /races, which exists.
 */
describe('StreakWarningBanner', () => {
  function warnings(
    overrides: Partial<StreakWarningStatus> = {},
  ): StreakWarningStatus {
    return {
      bettingStreak: { atRisk: false, currentStreak: 0, weekClosesAt: null },
      playStreak: { atRisk: false, currentStreak: 0, missedBusinessDays: 0 },
      ...overrides,
    } as StreakWarningStatus;
  }

  it('renders nothing when a betting streak is at risk', () => {
    // The API still sends this. It must produce no UI at all now.
    const { container } = render(
      <StreakWarningBanner
        warnings={warnings({
          bettingStreak: {
            atRisk: true,
            currentStreak: 5,
            weekClosesAt: new Date(Date.now() + 3600_000).toISOString(),
          },
        })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('never links to the removed betting route', () => {
    render(
      <StreakWarningBanner
        warnings={warnings({
          bettingStreak: {
            atRisk: true,
            currentStreak: 9,
            weekClosesAt: new Date(Date.now() + 3600_000).toISOString(),
          },
          playStreak: { atRisk: true, currentStreak: 3, missedBusinessDays: 2 },
        })}
      />,
    );

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('href', '/betting');
    }
  });

  it('still warns about a play streak', () => {
    // The regression this change could plausibly cause.
    render(
      <StreakWarningBanner
        warnings={warnings({
          playStreak: { atRisk: true, currentStreak: 4, missedBusinessDays: 2 },
        })}
      />,
    );

    expect(screen.getByText(/4j en danger/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/races');
  });

  it('renders nothing when nothing is at risk', () => {
    const { container } = render(<StreakWarningBanner warnings={warnings()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('holds no reference to the betting route in its source', () => {
    // A render test only covers the states it thinks to construct. Reading
    // the file catches a betting link reintroduced behind some other
    // condition.
    const source = readFileSync(
      join(__dirname, '..', 'StreakWarningBanner.tsx'),
      'utf8',
    );

    expect(source).not.toMatch(/["'`]\/betting/);
  });
});
