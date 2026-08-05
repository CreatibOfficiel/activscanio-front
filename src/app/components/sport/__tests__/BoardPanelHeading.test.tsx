import { render, screen } from '@testing-library/react';
import BoardPanelHeading from '../BoardPanelHeading';

/**
 * The heading both sport boards put inside their panels.
 *
 * It exists because the two boards used to title themselves above the tab
 * selector, which meant the ranking's name stayed on screen while the reader
 * was looking at the history. Moving the title into the panel is what fixes
 * that, and doing it once is what stops the two boards drifting apart again.
 */
describe('BoardPanelHeading', () => {
  it('titles the panel with an h1', () => {
    // An h1, not an h2. Nothing above it titles the page any more — the
    // panel IS the page's subject — so a subordinate level would leave the
    // document with no top-level heading at all.
    render(<BoardPanelHeading title="Classement des pilotes" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Classement des pilotes');
  });

  it('renders the subtitle under the title when given one', () => {
    render(
      <BoardPanelHeading
        title="Classement des pilotes"
        subtitle={<span>11 pilotes</span>}
      />,
    );

    expect(screen.getByText('11 pilotes')).toBeInTheDocument();
  });

  it('renders no subtitle element when none is given', () => {
    // The ping-pong board suppresses its counts on a cold start, and the
    // history panel never has counts at all. Both pass nothing, and an empty
    // <p> would still occupy its margin.
    const { container } = render(<BoardPanelHeading title="Courses" />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});
