'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = (userId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

      socket = io(`${socketUrl}/events`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
        hasRegistered.current = false;
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });
    }

    // Register user when socket is connected and userId is available
    if (socket && isConnected && userId && !hasRegistered.current) {
      console.log(`📝 Registering user: ${userId}`);
      socket.emit('register', userId);
      hasRegistered.current = true;

      socket.once('registered', (data: any) => {
        console.log('✅ User registered:', data);
      });
    }

    return () => {
      // Don't disconnect on unmount - keep socket alive
      // Socket will be closed when window is closed
    };
  }, [userId, isConnected]);

  return { socket, isConnected };
};

/**
 * Subscribe to achievement unlocked events
 */
export const subscribeToAchievements = (
  callback: (achievement: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('achievement:unlocked', callback);

  return () => {
    socket.off('achievement:unlocked', callback);
  };
};

/**
 * Subscribe to level up events
 */
export const subscribeToLevelUp = (
  callback: (data: { newLevel: number; rewards: any[] }) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('level:up', callback);

  return () => {
    socket.off('level:up', callback);
  };
};

/**
 * Subscribe to achievement revoked events
 */
export const subscribeToAchievementRevoked = (
  callback: (achievement: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('achievement:revoked', callback);

  return () => {
    socket.off('achievement:revoked', callback);
  };
};

/**
 * Subscribe to bet finalized events
 */
export const subscribeToBetFinalized = (
  callback: (bet: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('bet:finalized', callback);

  return () => {
    socket.off('bet:finalized', callback);
  };
};

/**
 * Subscribe to perfect score events
 */
export const subscribeToPerfectScore = (
  callback: (data: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('perfect:score', callback);

  return () => {
    socket.off('perfect:score', callback);
  };
};

/**
 * Subscribe to race announcement events (broadcast)
 */
export const subscribeToRaceAnnouncements = (
  callback: (race: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('race:announcement', callback);

  return () => {
    socket.off('race:announcement', callback);
  };
};

/**
 * Subscribe to race results events (broadcast)
 */
export const subscribeToRaceResults = (
  callback: (results: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('race:results', callback);

  return () => {
    socket.off('race:results', callback);
  };
};

/**
 * Subscribe to rankings updated events (broadcast)
 */
export const subscribeToRankingsUpdated = (
  callback: (rankings: any) => void,
): (() => void) | undefined => {
  if (!socket) return;

  socket.on('rankings:updated', callback);

  return () => {
    socket.off('rankings:updated', callback);
  };
};
