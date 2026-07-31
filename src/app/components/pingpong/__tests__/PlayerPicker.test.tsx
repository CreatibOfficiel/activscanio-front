import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerPicker from '../PlayerPicker';
import { SelectablePlayer } from '../../../models/Pingpong';

function makePlayer(
  id: string,
  firstName: string,
  lastName: string,
  overrides: Partial<SelectablePlayer> = {},
): SelectablePlayer {
  return {
    // The picker keys on competitorId: that is what a match is recorded
    // against, and someone who has never played has no player id yet.
    competitorId: id,
    firstName,
    lastName,
    profilePictureUrl: '',
    playerId: null,
    ...overrides,
  };
}

const PLAYERS = [
  makePlayer('p1', 'Marc', 'Dupont'),
  makePlayer('p2', 'Sophie', 'Bernard'),
  makePlayer('p3', 'Élodie', 'Martin'),
];

/**
 * Choosing one of the two sides of the table.
 *
 * The picker is deliberately single-select: the two sides are separate
 * fields, so the "who is on the left" question is asked once per side rather
 * than as a multi-select the user has to mentally split.
 *
 * The one rule it enforces itself is that a player cannot face themselves.
 * The API has a CHECK constraint on it, so a form that lets you pick it is a
 * form that produces a 500-shaped rejection for something the UI could have
 * made unclickable.
 */
describe('PlayerPicker', () => {
  const noop = () => {};

  it('lists the players it was given', () => {
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={noop}
      />,
    );

    expect(screen.getByRole('option', { name: /Marc/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Sophie/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Élodie/ })).toBeInTheDocument();
  });

  it('shows an avatar beside each name', () => {
    // A list of bare names is slow to scan for a colleague whose surname you
    // half-remember; the face is what people actually recognise.
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={noop}
      />,
    );

    const marc = screen.getByRole('option', { name: /Marc/ });
    expect(marc.querySelector('img, [aria-hidden="true"], div')).toBeTruthy();
    // The initials avatar renders the two initials when there is no picture.
    expect(marc).toHaveTextContent('MD');
  });

  it('filters the list by name as you type', async () => {
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={noop}
      />,
    );

    await userEvent.type(screen.getByLabelText('Rechercher Joueur A'), 'soph');

    expect(screen.getByRole('option', { name: /Sophie/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Marc/ })).toBeNull();
  });

  it('ignores accents when searching', async () => {
    // "elodie" typed on a phone keyboard must still find Élodie.
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={noop}
      />,
    );

    await userEvent.type(screen.getByLabelText('Rechercher Joueur A'), 'elodie');

    expect(screen.getByRole('option', { name: /Élodie/ })).toBeInTheDocument();
  });

  it('reports the chosen player', async () => {
    const onSelect = jest.fn();
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole('option', { name: /Marc/ }));

    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('marks the chosen player as selected', () => {
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId="p2"
        excludedId={null}
        onSelect={noop}
      />,
    );

    expect(screen.getByRole('option', { name: /Sophie/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: /Marc/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  describe('the player on the other side', () => {
    it('is left out of the list entirely', () => {
      // The API rejects a self-match with a CHECK constraint. Offering the
      // option and then refusing it is a round trip that teaches nothing.
      render(
        <PlayerPicker
          label="Joueur B"
          players={PLAYERS}
          selectedId={null}
          excludedId="p1"
          onSelect={noop}
        />,
      );

      expect(screen.queryByRole('option', { name: /Marc/ })).toBeNull();
      expect(screen.getByRole('option', { name: /Sophie/ })).toBeInTheDocument();
    });

    it('cannot be selected even by searching for them', async () => {
      const onSelect = jest.fn();
      render(
        <PlayerPicker
          label="Joueur B"
          players={PLAYERS}
          selectedId={null}
          excludedId="p1"
          onSelect={onSelect}
        />,
      );

      await userEvent.type(screen.getByLabelText('Rechercher Joueur B'), 'marc');

      expect(screen.queryByRole('option', { name: /Marc/ })).toBeNull();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  it('says so when a search matches nobody', async () => {
    // An empty box with no words reads as a broken list.
    render(
      <PlayerPicker
        label="Joueur A"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={noop}
      />,
    );

    await userEvent.type(screen.getByLabelText('Rechercher Joueur A'), 'zzzz');

    await waitFor(() =>
      expect(screen.getByText(/aucun joueur/i)).toBeInTheDocument(),
    );
  });

  it('labels the list with the side it fills', () => {
    // Two identical pickers stacked vertically are indistinguishable to a
    // screen reader without this.
    render(
      <PlayerPicker
        label="Joueur B"
        players={PLAYERS}
        selectedId={null}
        excludedId={null}
        onSelect={noop}
      />,
    );

    expect(screen.getByRole('listbox', { name: 'Joueur B' })).toBeInTheDocument();
  });
});
