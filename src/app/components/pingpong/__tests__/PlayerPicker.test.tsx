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

  describe('adding someone who is not in the list', () => {
    // The Mario Kart race form ends its picker with the same row. Without
    // it, a new colleague can only be added from a different screen, and
    // nothing here says so.
    it('offers a way to create a competitor', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={PLAYERS}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getByTestId('picker-add-player')).toBeInTheDocument();
    });

    it('offers it even when the search matches nobody', async () => {
      // This is when it is most needed: you searched for someone, they are
      // not there, and the next thing you want is to add them.
      render(
        <PlayerPicker
          label="Joueur A"
          players={PLAYERS}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      await userEvent.type(
        screen.getByLabelText('Rechercher Joueur A'),
        'personne-de-ce-nom',
      );

      expect(screen.getByTestId('picker-add-player')).toBeInTheDocument();
    });

    it('links to the competitor creation screen', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={PLAYERS}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getByTestId('picker-add-player')).toHaveAttribute(
        'href',
        '/competitors/add',
      );
    });

    it('is not one of the selectable options', () => {
      // It navigates away rather than picking someone, so announcing it as
      // an option would promise the wrong thing.
      render(
        <PlayerPicker
          label="Joueur A"
          players={PLAYERS}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getAllByRole('option')).toHaveLength(PLAYERS.length);
    });
  });

  /**
   * The order the rows come out in.
   *
   * The office plays in a small rotation — the same handful of people, most
   * days — so the person being entered has usually played recently. Ordering
   * by that turns the common case into a tap at the top of the list instead
   * of a search.
   */
  describe('ordering', () => {
    /** Names read off the rendered rows, in the order they appear. */
    const renderedNames = () =>
      screen.getAllByRole('option').map((row) => row.textContent ?? '');

    const played = (id: string, first: string, iso: string | null) =>
      makePlayer(id, first, `Nom${id}`, { lastMatchAt: iso });

    it('puts the most recent player first', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={[
            played('p1', 'Ancien', '2026-07-01T10:00:00.000Z'),
            played('p2', 'Recent', '2026-08-04T10:00:00.000Z'),
            played('p3', 'Moyen', '2026-07-20T10:00:00.000Z'),
          ]}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(renderedNames().map((n) => n.trim())).toEqual([
        expect.stringContaining('Recent'),
        expect.stringContaining('Moyen'),
        expect.stringContaining('Ancien'),
      ]);
    });

    /**
     * Never-played colleagues sort last rather than first. They are the rare
     * pick — the roster is the whole office, but only a fraction of it plays
     * — so putting them on top would push the regulars, who are the reason
     * the form is open, below the fold of a capped list.
     */
    it('puts players who never played after everyone who has', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={[
            played('p1', 'Jamais', null),
            played('p2', 'Joueur', '2026-07-01T10:00:00.000Z'),
          ]}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(renderedNames().map((n) => n.trim())).toEqual([
        expect.stringContaining('Joueur'),
        expect.stringContaining('Jamais'),
      ]);
    });

    /**
     * Alphabetical among themselves, because they have nothing else to be
     * ordered by. Leaving them in API order would shuffle the tail whenever
     * a competitor is added, and a list that reorders between visits cannot
     * be learned.
     */
    it('orders the never-played alphabetically among themselves', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={[
            played('p1', 'Zoe', null),
            played('p2', 'Ana', null),
            played('p3', 'Marc', null),
          ]}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(renderedNames().map((n) => n.trim())).toEqual([
        expect.stringContaining('Ana'),
        expect.stringContaining('Marc'),
        expect.stringContaining('Zoe'),
      ]);
    });

    /**
     * A missing date must not be read as "played at the epoch", which would
     * be a real date sorting them among the regulars rather than after them.
     */
    it('treats an absent lastMatchAt like a null one', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={[
            makePlayer('p1', 'Sansdate', 'Nom'),
            played('p2', 'Ancien', '2020-01-01T10:00:00.000Z'),
          ]}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      expect(renderedNames().map((n) => n.trim())).toEqual([
        expect.stringContaining('Ancien'),
        expect.stringContaining('Sansdate'),
      ]);
    });

    /**
     * Search narrows to a handful of rows, where recency still beats any
     * relevance ranking — and re-ordering mid-type would move a row out from
     * under a finger already reaching for it.
     */
    it('keeps the recency order while searching', async () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={[
            // Two people the query "mar" both match, so the order between
            // them is decided by recency rather than by the filter.
            makePlayer('p1', 'Marc', 'Dupont', {
              lastMatchAt: '2026-07-01T10:00:00.000Z',
            }),
            makePlayer('p2', 'Margot', 'Leroy', {
              lastMatchAt: '2026-08-04T10:00:00.000Z',
            }),
            makePlayer('p3', 'Sophie', 'Bernard', {
              lastMatchAt: '2026-08-05T10:00:00.000Z',
            }),
          ]}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      await userEvent.type(screen.getByLabelText('Rechercher Joueur A'), 'mar');

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toHaveLength(2);
      });
      expect(renderedNames().map((n) => n.trim())).toEqual([
        expect.stringContaining('Margot'),
        expect.stringContaining('Marc'),
      ]);
    });

    it('still leaves the other side out once sorted', () => {
      render(
        <PlayerPicker
          label="Joueur B"
          players={[
            played('p1', 'Exclu', '2026-08-05T10:00:00.000Z'),
            played('p2', 'Reste', '2026-07-01T10:00:00.000Z'),
          ]}
          selectedId={null}
          excludedId="p1"
          onSelect={jest.fn()}
        />,
      );

      const names = renderedNames();
      expect(names).toHaveLength(1);
      expect(names[0]).toContain('Reste');
    });

    it('keeps the add-a-player row last, below the sorted list', () => {
      render(
        <PlayerPicker
          label="Joueur A"
          players={[
            played('p1', 'Jamais', null),
            played('p2', 'Recent', '2026-08-05T10:00:00.000Z'),
          ]}
          selectedId={null}
          excludedId={null}
          onSelect={jest.fn()}
        />,
      );

      // The row sits outside the listbox, so sorting can neither reorder it
      // nor absorb it into the options.
      const addRow = screen.getByTestId('picker-add-player');
      const listbox = screen.getByRole('listbox');
      expect(listbox).not.toContainElement(addRow);
      expect(
        listbox.compareDocumentPosition(addRow) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
});
