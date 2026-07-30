import { useMemo } from 'react';
import { Competitor } from '@/app/models/Competitor';
import {
  segmentLeaderboard,
  LeaderboardSegmentation,
  LeaderboardSegmentationOptions,
} from '@/app/utils/leaderboard-segmentation';

/**
 * Memoised wrapper around `segmentLeaderboard`.
 *
 * Pass `options` as a module-level constant rather than an inline object,
 * otherwise the memo recomputes on every render.
 */
export function useLeaderboardSegmentation(
  competitors: Competitor[],
  options: LeaderboardSegmentationOptions = {},
): LeaderboardSegmentation {
  const { excludePodiumFromLeagues = false, podiumSize = 3 } = options;

  return useMemo(
    () =>
      segmentLeaderboard(competitors, { excludePodiumFromLeagues, podiumSize }),
    [competitors, excludePodiumFromLeagues, podiumSize],
  );
}
