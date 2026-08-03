'use client';

import { useCallback, useEffect, useState } from 'react';
import { PingpongMatch } from '../models/Pingpong';
import { pingpongRepository } from '../repositories/PingpongRepository';

/**
 * How many matches the history shows.
 *
 * Carried over from the deleted `/pingpong/matches` page, which used the same
 * figure. It is not a preview limit: there is no second page to send anyone
 * to, so this section is the entire match history and a smaller cap would
 * hide records rather than defer them.
 */
export const MATCH_LIMIT = 50;

/**
 * Loads the recent ping-pong matches.
 *
 * Separate from `usePingpongLeaderboard` on purpose. The two answer different
 * questions from different endpoints, and the leaderboard must survive a
 * matches failure — a screen that drops its ranking because the history
 * 500'd has turned one broken panel into two.
 *
 * One request. `GET /pingpong/matches` eager-loads the player relations and
 * embeds both sides on every match, so a consumer reads names straight off
 * the rows it already has, with no leaderboard join and no lookup per row.
 */
export function usePingpongMatches() {
  const [matches, setMatches] = useState<PingpongMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await pingpongRepository.fetchRecentMatches(MATCH_LIMIT);
      setMatches(loaded);
      // Clear a previous failure, or a successful retry would render fresh
      // matches underneath a stale error.
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      setMatches([]);
    } finally {
      // Always, so a failure stops the skeletons. A permanent loading state
      // gives nobody anything to act on.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { matches, loading, error, refresh: load };
}
