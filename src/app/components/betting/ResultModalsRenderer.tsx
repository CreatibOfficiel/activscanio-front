'use client';

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useResultModals } from '@/app/context/ResultModalsContext';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import BetResultModal from './BetResultModal';
import StreakLostModal from './StreakLostModal';

export default function ResultModalsRenderer() {
  const { currentItem, advanceQueue } = useResultModals();
  const { getToken } = useAuth();

  const handleBetResultClose = useCallback(async () => {
    if (currentItem?.type === 'betResult') {
      try {
        const token = await getToken();
        if (token) {
          await BettingRepository.markBetResultSeen(currentItem.data.betId, token);
        }
      } catch (error) {
        console.error('Failed to mark bet result seen:', error);
      }
    }
    advanceQueue();
  }, [currentItem, advanceQueue, getToken]);

  const handleStreakLossClose = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        await BettingRepository.markStreakLossesSeen(token);
      }
    } catch (error) {
      console.error('Failed to mark streak losses seen:', error);
    }
    advanceQueue();
  }, [advanceQueue, getToken]);

  if (!currentItem) return null;

  if (currentItem.type === 'betResult') {
    return <BetResultModal data={currentItem.data} onClose={handleBetResultClose} />;
  }

  if (currentItem.type === 'streakLoss') {
    return <StreakLostModal losses={currentItem.data} onClose={handleStreakLossClose} />;
  }

  return null;
}
