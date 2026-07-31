'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { UsersRepository, UserData } from '../repositories/UsersRepository';

let cachedUserData: UserData | null = null;

/** Everyone currently mounted, so a write can push the new value to all. */
const subscribers = new Set<(data: UserData | null) => void>();

/**
 * Replace the cached user after a write.
 *
 * The cache is module-level and otherwise never invalidated, so without this
 * a preference change would keep showing the old value until a full reload —
 * the setting would appear not to have saved.
 */
export function setCachedUserData(data: UserData | null): void {
  cachedUserData = data;
  for (const notify of subscribers) notify(data);
}

export function useCurrentUserData() {
  const { getToken } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(cachedUserData);
  const [loading, setLoading] = useState(!cachedUserData);

  // Subscribe first, so a write from anywhere reaches every mounted copy.
  useEffect(() => {
    subscribers.add(setUserData);
    return () => {
      subscribers.delete(setUserData);
    };
  }, []);

  useEffect(() => {
    if (cachedUserData) return;

    let cancelled = false;

    (async () => {
      try {
        // Force fresh token when cache is empty to avoid stale tokens
        const token = await getToken({ skipCache: true });
        if (!token || cancelled) return;

        const data = await UsersRepository.getMe(token);
        if (cancelled) return;

        setCachedUserData(data);
      } catch (err: unknown) {
        // On 401, invalidate cache so next mount retries with a fresh token
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : undefined;
        if (status === 401) {
          cachedUserData = null;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return { userData, loading };
}
