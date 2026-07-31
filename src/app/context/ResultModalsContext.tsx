'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StreakLossPayload } from '../types/streak-loss';

type QueueItem = { type: 'streakLoss'; data: StreakLossPayload[] };

interface ResultModalsContextType {
  currentItem: QueueItem | null;
  enqueueStreakLoss: (data: StreakLossPayload[]) => void;
  advanceQueue: () => void;
}

const ResultModalsContext = createContext<ResultModalsContextType | null>(null);

export function ResultModalsProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const enqueueStreakLoss = useCallback((data: StreakLossPayload[]) => {
    if (data.length === 0) return;
    setQueue((prev) => {
      if (prev.some((item) => item.type === 'streakLoss')) {
        return prev;
      }
      return [...prev, { type: 'streakLoss', data }];
    });
  }, []);

  const advanceQueue = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const currentItem = queue[0] || null;

  return (
    <ResultModalsContext.Provider
      value={{ currentItem, enqueueStreakLoss, advanceQueue }}
    >
      {children}
    </ResultModalsContext.Provider>
  );
}

export function useResultModals() {
  const context = useContext(ResultModalsContext);
  if (!context) {
    throw new Error('useResultModals must be used within ResultModalsProvider');
  }
  return context;
}
