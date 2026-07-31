import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import AddMatchPage from '../page';
import { pingpongRepository } from '../../../repositories/PingpongRepository';
import { SelectablePlayer } from '../../../models/Pingpong';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, back: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../repositories/PingpongRepository', () => ({
  pingpongRepository: {
    fetchSelectable: jest.fn(),
    recordMatch: jest.fn(),
  },
}));

const fetchSelectable = pingpongRepository.fetchSelectable as jest.Mock;
const recordMatch = pingpongRepository.recordMatch as jest.Mock;

function makePlayer(
  id: string,
  firstName: string,
  lastName: string,
): SelectablePlayer {
  return {
    // A match is recorded against a competitor, not a ping-pong player:
    // most of the office has never played, and the API enrols both sides
    // when the first match is submitted.
    competitorId: id,
    firstName,
    lastName,
    profilePictureUrl: '',
    playerId: null,
  };
}

const PLAYERS = [
  makePlayer('p1', 'Marc', 'Dupont'),
  makePlayer('p2', 'Sophie', 'Bernard'),
  makePlayer('p3', 'Karim', 'Haddad'),
];

/** Type a whole set: both boxes of one row. */
async function enterSet(index: number, a: string, b: string) {
  await userEvent.type(screen.getByLabelText(`Set ${index + 1}, joueur A`), a);
  await userEvent.type(screen.getByLabelText(`Set ${index + 1}, joueur B`), b);
}

async function pick(side: 'A' | 'B', name: RegExp) {
  const list = screen.getByRole('listbox', { name: `Joueur ${side}` });
  await userEvent.click(within(list).getByRole('option', { name }));
}

/** Marc 2-0 Sophie: the shortest complete, submittable match. */
async function completeMatch() {
  await pick('A', /Marc/);
  await pick('B', /Sophie/);
  await enterSet(0, '11', '5');
  await enterSet(1, '11', '8');
}

/**
 * The match entry screen.
 *
 * The state machine behind it is tested in useMatchEntry.test.tsx; what this
 * file covers is everything that only exists once the hook meets a page: the
 * two sides being real named people rather than the letters A and B, the
 * third set appearing in the DOM, and what the user is told when the server
 * rejects the match.
 */
describe('Ping-pong match entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSelectable.mockResolvedValue(PLAYERS);
    recordMatch.mockResolvedValue({ id: 'm1' });
  });

  async function renderPage() {
    render(<AddMatchPage />);
    // The pickers are empty until the leaderboard lands.
    const sideA = await screen.findByRole('listbox', { name: 'Joueur A' });
    await within(sideA).findByRole('option', { name: /Marc/ });
  }

  describe('the set rows', () => {
    it('starts with two sets and no third', async () => {
      await renderPage();

      expect(screen.getByLabelText('Set 1, joueur A')).toBeInTheDocument();
      expect(screen.getByLabelText('Set 2, joueur A')).toBeInTheDocument();
      expect(screen.queryByLabelText('Set 3, joueur A')).toBeNull();
    });

    it('grows a third set once the first two are split', async () => {
      // A best-of-three only needs a decider when it is one-all. Showing the
      // field up front asks for a set that may never be played.
      await renderPage();

      await enterSet(0, '11', '5');
      await enterSet(1, '8', '11');

      expect(await screen.findByLabelText('Set 3, joueur A')).toBeInTheDocument();
    });

    it('drops the third set again when the split becomes a two-nil', async () => {
      await renderPage();

      await enterSet(0, '11', '5');
      await enterSet(1, '8', '11');
      expect(await screen.findByLabelText('Set 3, joueur A')).toBeInTheDocument();

      await userEvent.clear(screen.getByLabelText('Set 2, joueur A'));
      await userEvent.type(screen.getByLabelText('Set 2, joueur A'), '11');
      await userEvent.clear(screen.getByLabelText('Set 2, joueur B'));
      await userEvent.type(screen.getByLabelText('Set 2, joueur B'), '8');

      await waitFor(() =>
        expect(screen.queryByLabelText('Set 3, joueur A')).toBeNull(),
      );
    });
  });

  describe('the winner', () => {
    it('is shown by name, not as a letter', async () => {
      // The hook returns 'A' or 'B'. Showing that back is meaningless to
      // someone confirming they recorded the right result.
      await renderPage();
      await completeMatch();

      const banner = await screen.findByTestId('match-winner');
      expect(banner).toHaveTextContent(/Marc/);
      expect(banner).not.toHaveTextContent(/\bJoueur A\b/);
    });

    it('names the other player when the other player won', async () => {
      await renderPage();
      await pick('A', /Marc/);
      await pick('B', /Sophie/);
      await enterSet(0, '5', '11');
      await enterSet(1, '8', '11');

      const banner = await screen.findByTestId('match-winner');
      expect(banner).toHaveTextContent(/Sophie/);
      expect(banner).not.toHaveTextContent(/Marc/);
    });

    it('stays quiet while the match is undecided', async () => {
      await renderPage();
      await pick('A', /Marc/);
      await pick('B', /Sophie/);
      await enterSet(0, '11', '5');
      await enterSet(1, '8', '11');

      expect(screen.queryByTestId('match-winner')).toBeNull();
    });
  });

  describe('submitting', () => {
    it('is disabled until the match is complete', async () => {
      await renderPage();

      expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();

      await pick('A', /Marc/);
      await pick('B', /Sophie/);
      await enterSet(0, '11', '5');

      // One set is not a match.
      expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
    });

    it('becomes available once someone has taken two sets', async () => {
      await renderPage();
      await completeMatch();

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /enregistrer/i }),
        ).toBeEnabled(),
      );
    });

    it('sends the match as numbers from A’s point of view', async () => {
      await renderPage();
      await completeMatch();

      await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() =>
        expect(recordMatch).toHaveBeenCalledWith(
          {
            playerAId: 'p1',
            playerBId: 'p2',
            sets: [
              { a: 11, b: 5 },
              { a: 11, b: 8 },
            ],
          },
          'mock-token',
        ),
      );
    });

    it('navigates away and confirms on success', async () => {
      await renderPage();
      await completeMatch();

      await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => expect(push).toHaveBeenCalledWith('/pingpong'));
      expect(toast.success).toHaveBeenCalled();
    });

    it('shows the server’s own words when it refuses the match', async () => {
      // The server re-validates the scores and names the rule that broke.
      // Replacing that with "une erreur est survenue" throws away the only
      // part of the response that tells the user what to change.
      recordMatch.mockRejectedValue(
        new Error(
          'Error recording match: Le match était déjà terminé avant le set 3',
        ),
      );
      await renderPage();
      await completeMatch();

      await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(
        /Le match était déjà terminé avant le set 3/,
      );
      expect(alert).not.toHaveTextContent(/^Une erreur est survenue$/);
    });

    it('stays on the page when the server refuses', async () => {
      recordMatch.mockRejectedValue(new Error('Error recording match: nope'));
      await renderPage();
      await completeMatch();

      await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

      await screen.findByRole('alert');
      expect(push).not.toHaveBeenCalled();
    });
  });

  describe('swapping sides', () => {
    it('exchanges the players and both score columns', async () => {
      // Recording from the wrong side is easy to do and tedious to unpick by
      // hand across three sets.
      await renderPage();
      await completeMatch();

      await userEvent.click(screen.getByRole('button', { name: /inverser/i }));

      await waitFor(() =>
        expect(screen.getByLabelText('Set 1, joueur A')).toHaveValue('5'),
      );
      expect(screen.getByLabelText('Set 1, joueur B')).toHaveValue('11');
      expect(
        screen.getByRole('listbox', { name: 'Joueur A' }),
      ).toHaveAttribute('data-selected-id', 'p2');
      expect(
        screen.getByRole('listbox', { name: 'Joueur B' }),
      ).toHaveAttribute('data-selected-id', 'p1');
    });

    it('re-derives the winner from the swapped scores', async () => {
      await renderPage();
      await completeMatch();

      await userEvent.click(screen.getByRole('button', { name: /inverser/i }));

      // Marc still won; he is simply on the right-hand side now.
      const banner = await screen.findByTestId('match-winner');
      await waitFor(() => expect(banner).toHaveTextContent(/Marc/));
    });

    it('returns to the original state when swapped twice', async () => {
      // Two swaps must be a no-op.
      //
      // The clicks are dispatched inside a single `act`, without awaiting in
      // between, so React batches both handlers into one update — a double
      // tap on the control, which on a phone is one thumb bounce away. That
      // is the case that breaks a swapSides reading playerAId/playerBId from
      // render scope: both calls see the pre-swap values, the players end up
      // reversed while the scores (a functional update) correctly swap back,
      // and the match is silently recorded the wrong way round.
      await renderPage();
      await completeMatch();

      const swap = screen.getByRole('button', { name: /inverser/i });
      await act(async () => {
        swap.click();
        swap.click();
      });

      await waitFor(() =>
        expect(screen.getByLabelText('Set 1, joueur A')).toHaveValue('11'),
      );
      expect(screen.getByLabelText('Set 1, joueur B')).toHaveValue('5');
      expect(
        screen.getByRole('listbox', { name: 'Joueur A' }),
      ).toHaveAttribute('data-selected-id', 'p1');
      expect(
        screen.getByRole('listbox', { name: 'Joueur B' }),
      ).toHaveAttribute('data-selected-id', 'p2');
    });
  });

  describe('the two sides', () => {
    it('cannot hold the same person', async () => {
      // The API has a CHECK constraint forbidding it, so the pick must not
      // be offered rather than refused after the fact.
      await renderPage();
      await pick('A', /Marc/);

      const sideB = screen.getByRole('listbox', { name: 'Joueur B' });
      expect(within(sideB).queryByRole('option', { name: /Marc/ })).toBeNull();

      const sideA = screen.getByRole('listbox', { name: 'Joueur A' });
      expect(within(sideA).getByRole('option', { name: /Marc/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('frees the other side again when a pick is changed', async () => {
      await renderPage();
      await pick('A', /Marc/);
      await pick('A', /Karim/);

      const sideB = screen.getByRole('listbox', { name: 'Joueur B' });
      expect(within(sideB).getByRole('option', { name: /Marc/ })).toBeInTheDocument();
      expect(within(sideB).queryByRole('option', { name: /Karim/ })).toBeNull();
    });
  });

  it('reports an impossible set score without asking the server', async () => {
    // 12-9 cannot happen: a set goes to 11, and past 10-10 it must be won by
    // exactly two.
    await renderPage();
    await enterSet(0, '12', '9');

    expect(await screen.findByLabelText('Set 1, joueur A')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
  });
});
