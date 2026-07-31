'use client';

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useResultModals } from '@/app/context/ResultModalsContext';
import { StreaksRepository } from '@/app/repositories/StreaksRepository';
import StreakLostModal from './StreakLostModal';

export default function StreakLostModalRenderer() {
  const { currentItem, advanceQueue } = useResultModals();
  const { getToken } = useAuth();

  const handleStreakLossClose = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        await StreaksRepository.markStreakLossesSeen(token);
      }
    } catch (error) {
      console.error('Failed to mark streak losses seen:', error);
    }
    advanceQueue();
  }, [advanceQueue, getToken]);

  if (!currentItem) return null;

  return (
    <StreakLostModal
      losses={currentItem.data}
      onClose={handleStreakLossClose}
    />
  );
}
