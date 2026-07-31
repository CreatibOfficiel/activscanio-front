'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Connection logging, off in production.
 *
 * Useful locally when the socket will not connect; noise in a shipped
 * console, where nobody reads it and it leaks the user id.
 */
const debug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

interface Achievement {
  icon: string;
  name: string;
  xpReward: number;
}

interface LevelUpData {
  newLevel: number;
  rewards: unknown[];
}


interface StreakLostData {
  type: 'betting' | 'play';
  lostValue: number;
  lostAt: string;
  missedDays?: string[];
}


interface Race {
  title?: string;
  bettingOpen?: boolean;
}

export interface DuelReceivedData {
  duelId: string;
  challenger: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  stakeType: string;
  stakeEmoji?: string;
  stakeLabel?: string;
  conditionType?: string | null;
  conditionValue?: number | null;
  expiresAt: string;
}

let socket: Socket | null = null;

// Reconnection configuration
const RECONNECTION_CONFIG = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
};

export const useSocket = (userId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const hasRegistered = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempt >= RECONNECTION_CONFIG.maxAttempts) {
      debug('❌ Max reconnection attempts reached');
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      RECONNECTION_CONFIG.baseDelay * Math.pow(2, reconnectAttempt) + Math.random() * 1000,
      RECONNECTION_CONFIG.maxDelay
    );

    debug(`🔄 Scheduling reconnection attempt ${reconnectAttempt + 1} in ${Math.round(delay)}ms`);

    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socket && !socket.connected) {
        socket.connect();
        setReconnectAttempt(prev => prev + 1);
      }
    }, delay);
  }, [reconnectAttempt, clearReconnectTimeout]);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

      socket = io(`${socketUrl}/events`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: RECONNECTION_CONFIG.maxAttempts,
        reconnectionDelay: RECONNECTION_CONFIG.baseDelay,
        reconnectionDelayMax: RECONNECTION_CONFIG.maxDelay,
      });

      socket.on('connect', () => {
        debug('✅ Socket connected:', socket?.id);
        setIsConnected(true);
        setReconnectAttempt(0);
        clearReconnectTimeout();
      });

      socket.on('disconnect', (reason) => {
        debug('❌ Socket disconnected:', reason);
        setIsConnected(false);
        hasRegistered.current = false;

        // Schedule manual reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          scheduleReconnect();
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
        scheduleReconnect();
      });

      socket.on('error', (error: unknown) => {
        console.error('Socket error:', error);
      });
    }

    // Register user when socket is connected and userId is available
    if (socket && isConnected && userId && !hasRegistered.current) {
      debug(`📝 Registering user: ${userId}`);
      socket.emit('register', userId);
      hasRegistered.current = true;

      socket.once('registered', (data: unknown) => {
        debug('✅ User registered:', data);
      });
    }

    return () => {
      clearReconnectTimeout();
      // Don't disconnect on unmount - keep socket alive
      // Socket will be closed when window is closed
    };
  }, [userId, isConnected, scheduleReconnect, clearReconnectTimeout]);

  return { socket, isConnected, reconnectAttempt };
};

/**
 * Subscribe to achievement unlocked events
 */
export const subscribeToAchievements = (
  callback: (achievement: Achievement) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('achievement:unlocked', callback);

  return () => {
    socket?.off('achievement:unlocked', callback);
  };
};

/**
 * Subscribe to level up events
 */
export const subscribeToLevelUp = (
  callback: (data: LevelUpData) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('level:up', callback);

  return () => {
    socket?.off('level:up', callback);
  };
};

/**
 * Subscribe to achievement revoked events
 */
export const subscribeToAchievementRevoked = (
  callback: (achievement: Achievement) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('achievement:revoked', callback);

  return () => {
    socket?.off('achievement:revoked', callback);
  };
};



/**
 * Subscribe to race announcement events (broadcast)
 */
export const subscribeToRaceAnnouncements = (
  callback: (race: Race) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('race:announcement', callback);

  return () => {
    socket?.off('race:announcement', callback);
  };
};

/**
 * Subscribe to race results events (broadcast)
 */
export const subscribeToRaceResults = (
  callback: (results: unknown) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('race:results', callback);

  return () => {
    socket?.off('race:results', callback);
  };
};

/**
 * Subscribe to competitor updated events (broadcast)
 */
export const subscribeToCompetitorUpdated = (
  callback: (data: unknown) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('competitor:updated', callback);

  return () => {
    socket?.off('competitor:updated', callback);
  };
};


/**
 * Subscribe to streak lost events (betting or play)
 */
export const subscribeToStreakLost = (
  callback: (data: StreakLostData) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('streak:lost', callback);

  return () => {
    socket?.off('streak:lost', callback);
  };
};








export interface LiveBetResolvedData {
  liveBetId: string;
  status: string;
  pointsEarned: number | null;
  competitorId: string;
  oddAtBet: number;
}

