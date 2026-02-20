'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useResultModals } from '@/app/context/ResultModalsContext';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { StreakLossPayload } from '@/app/types/bet-result';

export default function ResultModalsInitializer() {
  const { getToken } = useAuth();
  const { enqueueBetResult, enqueueStreakLoss } = useResultModals();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUnseen = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch unseen bet result
        const betResult = await BettingRepository.getUnseenBetResult(token);
        if (betResult) {
          enqueueBetResult(betResult);
        }

        // Fetch unseen streak losses
        const streakLosses = await BettingRepository.getUnseenStreakLosses(token);
        if (streakLosses) {
          const losses: StreakLossPayload[] = [];
          if (streakLosses.bettingStreakLoss) {
            losses.push({
              type: 'betting',
              lostValue: streakLosses.bettingStreakLoss.lostValue,
              lostAt: streakLosses.bettingStreakLoss.lostAt,
            });
          }
          if (streakLosses.playStreakLoss) {
            losses.push({
              type: 'play',
              lostValue: streakLosses.playStreakLoss.lostValue,
              lostAt: streakLosses.playStreakLoss.lostAt,
            });
          }
          if (losses.length > 0) {
            enqueueStreakLoss(losses);
          }
        }
      } catch (error) {
        console.error('Failed to fetch unseen results:', error);
      }
    };

    fetchUnseen();
  }, [getToken, enqueueBetResult, enqueueStreakLoss]);

  return null;
}
