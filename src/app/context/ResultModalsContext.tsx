'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BetResultPayload, StreakLossPayload } from '../types/bet-result';

type QueueItem =
  | { type: 'betResult'; data: BetResultPayload }
  | { type: 'streakLoss'; data: StreakLossPayload[] };

interface ResultModalsContextType {
  currentItem: QueueItem | null;
  enqueueBetResult: (data: BetResultPayload) => void;
  enqueueStreakLoss: (data: StreakLossPayload[]) => void;
  advanceQueue: () => void;
}

const ResultModalsContext = createContext<ResultModalsContextType | null>(null);

export function ResultModalsProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const enqueueBetResult = useCallback((data: BetResultPayload) => {
    setQueue((prev) => {
      // Avoid duplicate bet results
      if (prev.some((item) => item.type === 'betResult' && item.data.betId === data.betId)) {
        return prev;
      }
      return [...prev, { type: 'betResult', data }];
    });
  }, []);

  const enqueueStreakLoss = useCallback((data: StreakLossPayload[]) => {
    if (data.length === 0) return;
    setQueue((prev) => {
      // Avoid duplicate streak losses
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
      value={{ currentItem, enqueueBetResult, enqueueStreakLoss, advanceQueue }}
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
