import { render, screen } from '@testing-library/react';
import ProfileTabs from '../ProfileTabs';

/**
 * The profile tab bar.
 *
 * Two rules are worth locking down.
 *
 * The ping-pong tab is conditional on BOTH following the sport and having a
 * linked competitor. Without a competitor there is nothing to look up — the
 * ping-pong API is keyed on `competitorId` — so the tab would open onto a
 * screen that can only apologise.
 *
 * The 'stats' tab was labelled "Paris" with a 🎲 icon, left over from the
 * betting system that was removed. The tab renders `StatsTab`, which shows
 * profile statistics and no bets at all, so the label was a one-line lie on
 * a live screen.
 */
describe('ProfileTabs', () => {
  const noop = () => {};

  it('labels the stats tab for what it shows', () => {
    // The betting system is gone. "Paris" pointed at a screen with no bets.
    render(<ProfileTabs activeTab="overview" onTabChange={noop} />);

    expect(screen.getByRole('tab', { name: /statistiques/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /paris/i })).not.toBeInTheDocument();
  });

  it('always shows the four base tabs', () => {
    render(<ProfileTabs activeTab="overview" onTabChange={noop} />);

    expect(screen.getByRole('tab', { name: /aperçu/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /statistiques/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /succès/i })).toBeInTheDocument();
  });

  it('hides the races tab for a non-player', () => {
    render(<ProfileTabs activeTab="overview" onTabChange={noop} />);

    expect(screen.queryByRole('tab', { name: /courses/i })).not.toBeInTheDocument();
  });

  it('shows the races tab for a player', () => {
    render(
      <ProfileTabs activeTab="overview" onTabChange={noop} showRacesTab />,
    );

    expect(screen.getByRole('tab', { name: /courses/i })).toBeInTheDocument();
  });

  describe('ping-pong tab', () => {
    it('is hidden by default', () => {
      render(<ProfileTabs activeTab="overview" onTabChange={noop} />);

      expect(
        screen.queryByRole('tab', { name: /ping-pong/i }),
      ).not.toBeInTheDocument();
    });

    it('is shown when the user follows ping-pong and has a competitor', () => {
      render(
        <ProfileTabs
          activeTab="overview"
          onTabChange={noop}
          showPingpongTab
        />,
      );

      expect(
        screen.getByRole('tab', { name: /ping-pong/i }),
      ).toBeInTheDocument();
    });
  });
});
