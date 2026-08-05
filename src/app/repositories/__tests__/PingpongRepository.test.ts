import { PingpongRepository } from '../PingpongRepository';
import { apiFetch } from '../../utils/api-fetch';

jest.mock('../../utils/api-fetch');

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

/**
 * Ping-pong API client.
 *
 * The cases worth pinning are the ones a happy-path test would miss: a
 * competitor who has never played is a normal state, not an error, and a
 * rejected match must surface the server's reason rather than a generic
 * failure — that reason names which scoring rule was broken.
 */
describe('PingpongRepository', () => {
  const BASE = 'https://api.test';
  let repository: PingpongRepository;

  function respondWith(body: unknown, init: { status?: number } = {}) {
    const status = init.status ?? 200;
    mockedFetch.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    } as Response);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PingpongRepository(BASE);
  });

  /** The URL passed to the last apiFetch call. */
  function lastUrl(): string {
    return String(mockedFetch.mock.calls[0][0]);
  }

  /** The init object passed to the last apiFetch call. */
  function lastInit(): RequestInit {
    return mockedFetch.mock.calls[0][1] as RequestInit;
  }

  describe('fetchLeaderboard', () => {
    it('returns every player, including the unranked', async () => {
      respondWith([
        { id: 'p1', rank: 1 },
        { id: 'p2', rank: null, provisional: true },
      ]);

      const players = await repository.fetchLeaderboard();

      expect(players).toHaveLength(2);
      expect(players[1].rank).toBeNull();
    });

    it('calls the leaderboard endpoint', async () => {
      respondWith([]);
      await repository.fetchLeaderboard();

      expect(lastUrl()).toBe(`${BASE}/pingpong/leaderboard`);
    });

    it('throws with the server message on failure', async () => {
      respondWith('database unavailable', { status: 500 });

      await expect(repository.fetchLeaderboard()).rejects.toThrow(
        /database unavailable/,
      );
    });
  });

  describe('fetchPlayer', () => {
    it('returns null for a competitor who has never played', async () => {
      // Not an error: the profile shows an invitation to record a first
      // match. Throwing here would break the whole page for that person.
      respondWith('Ping-pong player not found', { status: 404 });

      await expect(repository.fetchPlayer('comp-1')).resolves.toBeNull();
    });

    it('still throws on a real failure', async () => {
      respondWith('boom', { status: 500 });

      await expect(repository.fetchPlayer('comp-1')).rejects.toThrow(/boom/);
    });

    it('returns the player when one exists', async () => {
      respondWith({ id: 'p1', competitorId: 'comp-1', rating: 1500 });

      const player = await repository.fetchPlayer('comp-1');

      expect(player?.competitorId).toBe('comp-1');
    });
  });

  describe('fetchPlayerHistory', () => {
    it('omits the day range when none is given', async () => {
      respondWith([]);
      await repository.fetchPlayerHistory('comp-1');

      expect(lastUrl()).toBe(`${BASE}/pingpong/players/comp-1/history`);
    });

    it('passes the day range when one is given', async () => {
      respondWith([]);
      await repository.fetchPlayerHistory('comp-1', 30);

      expect(lastUrl()).toContain('?days=30');
    });
  });

  describe('recordMatch', () => {
    const payload = {
      playerAId: 'p1',
      playerBId: 'p2',
      sets: [
        { a: 11, b: 5 },
        { a: 11, b: 8 },
      ],
    };

    it('posts the match with the auth token', async () => {
      respondWith({ id: 'm1' });

      await repository.recordMatch(payload, 'tok-123');

      const init = lastInit();
      expect(init.method).toBe('POST');
      expect(
        (init.headers as Record<string, string>).Authorization,
      ).toBe('Bearer tok-123');
      expect(JSON.parse(init.body as string)).toEqual(payload);
    });

    it('surfaces the reason a match was rejected', async () => {
      // The server names the broken rule; swallowing it would leave the user
      // staring at a form that failed for no stated reason.
      respondWith('Un score de set est impossible', { status: 400 });

      await expect(repository.recordMatch(payload, 'tok')).rejects.toThrow(
        /score de set est impossible/,
      );
    });

    it('does not treat a 404 as an empty result here', async () => {
      // Unlike fetchPlayer: failing to record a match is always an error.
      respondWith('not found', { status: 404 });

      await expect(repository.recordMatch(payload, 'tok')).rejects.toThrow();
    });
  });

  describe('fetchHeadToHead', () => {
    it('puts both ids in the path, in the order given', async () => {
      respondWith({ winsA: 3, winsB: 1, matches: [] });

      await repository.fetchHeadToHead('p1', 'p2');

      expect(lastUrl()).toBe(`${BASE}/pingpong/head-to-head/p1/p2`);
    });
  });

  describe('fetchRecentMatches', () => {
    it('defaults to 50', async () => {
      respondWith([]);
      await repository.fetchRecentMatches();

      expect(lastUrl()).toContain('limit=50');
    });

    it('honours an explicit limit', async () => {
      respondWith([]);
      await repository.fetchRecentMatches(10);

      expect(lastUrl()).toContain('limit=10');
    });
  });

  /**
   * The paginated sibling, which the history scrolls.
   *
   * It hits a different path from `fetchRecentMatches` and returns an
   * envelope rather than a bare array — the old method keeps its shape so
   * its callers keep working.
   */
  describe('fetchMatchesPage', () => {
    const page = {
      data: [{ id: 'm1' }],
      meta: { hasMore: true, nextCursor: '2026-03-14T12:00:00.000Z|m1' },
    };

    it('asks the paginated endpoint, not the flat one', async () => {
      respondWith(page);
      await repository.fetchMatchesPage();

      expect(lastUrl()).toContain('/pingpong/matches/paginated');
    });

    it('omits the cursor on the first page', async () => {
      respondWith(page);
      await repository.fetchMatchesPage();

      expect(lastUrl()).not.toContain('cursor=');
    });

    /**
     * The mutation this guards: drop the cursor and every page repeats
     * page one, which reads as a list that will not advance.
     */
    it('sends the cursor when asking for a later page', async () => {
      respondWith(page);
      await repository.fetchMatchesPage('2026-03-14T12:00:00.000Z|m1');

      expect(lastUrl()).toContain(
        `cursor=${encodeURIComponent('2026-03-14T12:00:00.000Z|m1')}`,
      );
    });

    it('returns the envelope intact, meta included', async () => {
      respondWith(page);

      const result = await repository.fetchMatchesPage();

      expect(result.data).toHaveLength(1);
      expect(result.meta.hasMore).toBe(true);
      expect(result.meta.nextCursor).toBe('2026-03-14T12:00:00.000Z|m1');
    });

    it('throws with the server reason when the page fails', async () => {
      respondWith('boom', { status: 500 });

      await expect(repository.fetchMatchesPage()).rejects.toThrow(/boom/);
    });
  });

  describe('enrolPlayer', () => {
    it('posts the competitor id with the token', async () => {
      respondWith({ id: 'p1' });

      await repository.enrolPlayer('comp-1', 'tok');

      const init = lastInit();
      expect(JSON.parse(init.body as string)).toEqual({
        competitorId: 'comp-1',
      });
      expect(
        (init.headers as Record<string, string>).Authorization,
      ).toBe('Bearer tok');
    });

    it('surfaces the conflict when already enrolled', async () => {
      respondWith('Competitor already plays ping-pong', { status: 409 });

      await expect(repository.enrolPlayer('comp-1', 'tok')).rejects.toThrow(
        /already plays/,
      );
    });
  });
});
