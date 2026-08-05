/**
 * Every React Query key in one place.
 *
 * Keys live here rather than next to their hooks because invalidation happens
 * far from fetching: SocketWrapper invalidates competitors on four different
 * socket events without knowing which component reads them. A typo in an
 * inlined key array is silent — the invalidation simply matches nothing — so
 * the shared constants are what make the real-time flow reliable.
 */
export const queryKeys = {
  /** The signed-in user (`/users/me`). One key for every consumer. */
  currentUser: ['currentUser'] as const,

  /** The leaderboard (`/competitors`). Invalidated by race and ranking events. */
  competitors: ['competitors'] as const,

  achievements: {
    all: ['achievements'] as const,
    myStats: ['achievements', 'myStats'] as const,
    mine: ['achievements', 'mine'] as const,
    streakWarnings: ['achievements', 'streakWarnings'] as const,
  },
} as const;
