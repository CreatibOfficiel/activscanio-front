'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useResultModals } from '@/app/context/ResultModalsContext';
import { StreaksRepository } from '@/app/repositories/StreaksRepository';
import { StreakLossPayload } from '@/app/types/streak-loss';

export default function StreakLossInitializer() {
  const { getToken } = useAuth();
  const { enqueueStreakLoss } = useResultModals();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUnseen = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const streakLosses = await StreaksRepository.getUnseenStreakLosses(token);
        if (!streakLosses) return;

        const losses: StreakLossPayload[] = [];
        if (streakLosses.participationStreakLoss) {
          losses.push({
            type: 'participation',
            lostValue: streakLosses.participationStreakLoss.lostValue,
            lostAt: streakLosses.participationStreakLoss.lostAt,
          });
        }
        if (streakLosses.playStreakLoss) {
          losses.push({
            type: 'play',
            lostValue: streakLosses.playStreakLoss.lostValue,
            lostAt: streakLosses.playStreakLoss.lostAt,
            missedDays: streakLosses.playStreakLoss.missedDays,
          });
        }
        if (losses.length > 0) {
          enqueueStreakLoss(losses);
        }
      } catch (error) {
        console.error('Failed to fetch unseen streak losses:', error);
      }
    };

    fetchUnseen();
  }, [getToken, enqueueStreakLoss]);

  return null;
}
