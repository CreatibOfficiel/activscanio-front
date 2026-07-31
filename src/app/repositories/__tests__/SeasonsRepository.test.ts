import { SeasonsRepository } from '../SeasonsRepository';
import { apiFetch } from '../../utils/api-fetch';

jest.mock('../../utils/api-fetch');

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

/**
 * Season archive API client.
 *
 * This file called two endpoints that no longer exist — `/bettors` and
 * `/weeks`, both removed with the betting system. Because they sat inside a
 * `Promise.all`, the whole season recap failed, and nothing in the type
 * system could see it: the URLs are strings.
 *
 * These tests pin the endpoints actually called, and the one behaviour that
 * matters most: a season with no ping-pong must still show its races.
 */
describe('SeasonsRepository', () => {
  function respondWith(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const calledUrls = () =>
    mockedFetch.mock.calls.map((call) => String(call[0]));

  describe('getSeasonRecapData', () => {
    function stubRecapCalls(pingpongStatus = 200) {
      mockedFetch.mockImplementation((input) => {
        const url = String(input);
        if (url.endsWith('/pingpong')) {
          return Promise.resolve(
            respondWith(pingpongStatus === 200 ? [] : 'gone', pingpongStatus),
          );
        }
        if (url.endsWith('/highlights')) {
          return Promise.resolve(respondWith({}));
        }
        if (url.endsWith('/competitors')) {
          return Promise.resolve(respondWith([{ id: 'c1' }]));
        }
        // getSeason
        return Promise.resolve(respondWith({ id: 's1', seasonNumber: 1 }));
      });
    }

    it('never calls the removed betting endpoints', async () => {
      stubRecapCalls();

      await SeasonsRepository.getSeasonRecapData(2026, 1);

      for (const url of calledUrls()) {
        expect(url).not.toMatch(/\/bettors$/);
        expect(url).not.toMatch(/\/weeks$/);
      }
    });

    it('asks for the ping-pong standings', async () => {
      stubRecapCalls();

      await SeasonsRepository.getSeasonRecapData(2026, 1);

      expect(calledUrls().some((u) => u.endsWith('/pingpong'))).toBe(true);
    });

    it('still returns the races when ping-pong standings are missing', async () => {
      // Every season archived before ping-pong existed is this case. A
      // rejection here used to take the entire recap down.
      stubRecapCalls(404);

      const data = await SeasonsRepository.getSeasonRecapData(2026, 1);

      expect(data).not.toBeNull();
      expect(data!.competitors).toHaveLength(1);
      expect(data!.pingpong).toEqual([]);
    });

    it('throws when the season itself does not exist', async () => {
      // Note the mismatch: getSeason is declared `Promise<SeasonArchive |
      // null>` but throws on a 404 — the null branch is only reachable on an
      // empty body. Documented here rather than changed, because callers
      // outside this feature rely on the current behaviour.
      mockedFetch.mockResolvedValue(respondWith(null, 404));

      await expect(
        SeasonsRepository.getSeasonRecapData(1999, 1),
      ).rejects.toThrow(/Failed to fetch season/);
    });
  });

  describe('getPingpongRankings', () => {
    it('calls the season ping-pong endpoint', async () => {
      mockedFetch.mockResolvedValue(respondWith([]));

      await SeasonsRepository.getPingpongRankings(2026, 3);

      expect(calledUrls()[0]).toMatch(/\/seasons\/2026\/3\/pingpong$/);
    });

    it('throws on a server error', async () => {
      mockedFetch.mockResolvedValue(respondWith('boom', 500));

      await expect(
        SeasonsRepository.getPingpongRankings(2026, 3),
      ).rejects.toThrow();
    });
  });
});
