'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PingpongPlayer } from '../models/Pingpong';
import { pingpongRepository } from '../repositories/PingpongRepository';
import {
  PingpongBoardOptions,
  PingpongSegmentationOptions,
  buildPingpongBoard,
  segmentPingpongLeaderboard,
} from '../utils/pingpong-leaderboard';

/**
 * Loads the ping-pong leaderboard and groups it for display.
 *
 * Owns its own fetch rather than extending AppContext, which is shaped
 * entirely around Mario Kart (`allCompetitors`, `allRaces`,
 * `analyzeRaceImage`) and would have to grow a second, unrelated half.
 *
 * The grouping is delegated to `segmentPingpongLeaderboard` so the screen
 * and the util cannot disagree about who counts as calibrating.
 */
export function usePingpongLeaderboard(
  options: PingpongSegmentationOptions & PingpongBoardOptions = {},
) {
  const [players, setPlayers] = useState<PingpongPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await pingpongRepository.fetchLeaderboard();
      setPlayers(loaded);
      // Clear a previous failure, or the board would show fresh data under
      // a stale error message.
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      // Leave the board empty rather than half-populated: a partial list
      // silently misreports who is in the office.
      setPlayers([]);
    } finally {
      // Always, so a failed request stops the spinner. A permanent spinner
      // gives the user nothing to act on.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Options come from the caller as an object literal, so a new identity
  // arrives on every render — depend on the values, not the object.
  const { minPodiumSize, podiumSize, includeArchived, minPlayersForPodium } =
    options;
  const segmentation = useMemo(
    () =>
      segmentPingpongLeaderboard(players, {
        minPodiumSize,
        podiumSize,
        includeArchived,
      }),
    [players, minPodiumSize, podiumSize, includeArchived],
  );

  /**
   * The one-list board, which is what the phone leaderboard renders.
   *
   * Returned ALONGSIDE `segmentation` rather than instead of it. The TV board
   * builds its own segmentation from `players` directly, but this hook's
   * `segmentation` is still consumed and still describes what the API decided;
   * dropping it here to force every caller onto the new shape would have meant
   * editing the TV surface blind. The two answer different questions — see the
   * note on `segmentPingpongLeaderboard`.
   */
  const board = useMemo(
    () =>
      buildPingpongBoard(players, {
        podiumSize,
        minPlayersForPodium,
        includeArchived,
      }),
    [players, podiumSize, minPlayersForPodium, includeArchived],
  );

  return { players, segmentation, board, loading, error, refresh: load };
}
