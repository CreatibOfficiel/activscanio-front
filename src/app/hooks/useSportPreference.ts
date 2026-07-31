'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  SportPreference,
  UsersRepository,
} from '../repositories/UsersRepository';
import { setCachedUserData, useCurrentUserData } from './useCurrentUserData';

export type Sport = 'mario-kart' | 'ping-pong';

/**
 * The sport a user follows, and which screens that unlocks.
 *
 * Defaults to 'both' whenever the value is missing — a signed-out visitor, a
 * user record written before the column existed, or a request still in
 * flight. Showing someone a sport they can ignore is a smaller wrong than
 * hiding one they play: the opposite default would blank the leaderboard
 * during every page load.
 */
export function useSportPreference() {
  const { getToken } = useAuth();
  const { userData, loading } = useCurrentUserData();
  const [saving, setSaving] = useState(false);

  const preference: SportPreference = userData?.sportPreference ?? 'both';

  const showsMarioKart =
    preference === 'mario-kart' || preference === 'both';
  const showsPingpong = preference === 'ping-pong' || preference === 'both';

  /** Sports this user follows, in display order. */
  const sports: Sport[] = [
    ...(showsMarioKart ? (['mario-kart'] as const) : []),
    ...(showsPingpong ? (['ping-pong'] as const) : []),
  ];

  const change = useCallback(
    async (next: SportPreference) => {
      setSaving(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('Not signed in');

        const updated = await UsersRepository.changeSportPreference(
          next,
          token,
        );
        // Push the new value into the shared cache so every mounted screen
        // updates; without this the setting reads as not having saved.
        setCachedUserData(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [getToken],
  );

  return {
    preference,
    sports,
    showsMarioKart,
    showsPingpong,
    /** True when the user follows both, and so needs a switcher. */
    followsBoth: showsMarioKart && showsPingpong,
    loading,
    saving,
    change,
  };
}
