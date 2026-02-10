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
        const token = await getToken();
        if (!token || cancelled) return;

        const data = await UsersRepository.getMe(token);
        if (cancelled) return;

        cachedUserData = data;
        setUserData(data);
      } catch {
        // Silently fail — caller will see userData as null
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
