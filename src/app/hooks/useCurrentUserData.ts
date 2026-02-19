'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { UsersRepository, UserData } from '../repositories/UsersRepository';

let cachedUserData: UserData | null = null;

export function useCurrentUserData() {
  const { getToken } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(cachedUserData);
  const [loading, setLoading] = useState(!cachedUserData);

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

        cachedUserData = data;
        setUserData(data);
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
