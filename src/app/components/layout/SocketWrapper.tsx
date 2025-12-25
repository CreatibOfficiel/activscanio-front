'use client';

import { useEffect } from 'react';
import { useSocket, subscribeToAchievements, subscribeToLevelUp, subscribeToAchievementRevoked, subscribeToBetFinalized, subscribeToPerfectScore, subscribeToRaceAnnouncements, subscribeToRaceResults } from '@/app/hooks/useSocket';
import { toast } from 'sonner';

interface SocketWrapperProps {
  userId?: string;
}

export default function SocketWrapper({ userId }: SocketWrapperProps) {
  const { socket, isConnected } = useSocket(userId);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Achievement unlocked
    const unsubscribeAchievements = subscribeToAchievements((achievement) => {
      toast.success(
        `🎉 ${achievement.icon} ${achievement.name} (+${achievement.xpReward} XP)`,
        {
          duration: 5000,
          description: 'Achievement Unlocked!',
        }
      );
    });

    // Level up
    const unsubscribeLevelUp = subscribeToLevelUp((data) => {
      const rewardsText = data.rewards && data.rewards.length > 0
        ? ` - ${data.rewards.length} new rewards!`
        : '';
      toast.success(
        `📈 Level ${data.newLevel} Reached!${rewardsText}`,
        {
          duration: 6000,
          description: 'Level Up!',
        }
      );
    });

    // Achievement revoked
    const unsubscribeRevoked = subscribeToAchievementRevoked((achievement) => {
      toast.info(
        `😔 ${achievement.icon} ${achievement.name}`,
        {
          duration: 5000,
          description: 'Achievement Lost - Keep playing to earn it back!',
        }
      );
    });

    // Bet finalized
    const unsubscribeBet = subscribeToBetFinalized((bet) => {
      const pointsEarned = bet.pointsEarned || 0;

      if (pointsEarned > 0) {
        toast.success(
          `🎯 Earned ${pointsEarned} points!`,
          {
            duration: 4000,
            description: 'Bet Finalized',
          }
        );
      } else {
        toast.info(
          '📊 Better luck next time!',
          {
            duration: 3000,
            description: 'Bet Finalized',
          }
        );
      }
    });

    // Perfect score celebration
    const unsubscribePerfectScore = subscribeToPerfectScore((data) => {
      toast.success(
        '🏆 PERFECT SCORE! 60 POINTS! 🎉',
        {
          duration: 10000,
          description: data.imageUrl
            ? 'Click to view your celebration image!'
            : 'Congratulations on your perfect score!',
          action: data.imageUrl ? {
            label: 'View Image',
            onClick: () => window.open(data.imageUrl, '_blank'),
          } : undefined,
        }
      );
    });

    // Race announcement (broadcast)
    const unsubscribeRace = subscribeToRaceAnnouncements((race) => {
      toast.info(
        `🏁 ${race.title || 'New race available'}`,
        {
          duration: 5000,
          description: 'Place your bets now!',
        }
      );
    });

    // Race results (broadcast)
    const unsubscribeResults = subscribeToRaceResults(() => {
      toast.info(
        '🏆 Race Results Available',
        {
          duration: 4000,
          description: 'Check out the latest results!',
        }
      );
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeAchievements?.();
      unsubscribeLevelUp?.();
      unsubscribeRevoked?.();
      unsubscribeBet?.();
      unsubscribePerfectScore?.();
      unsubscribeRace?.();
      unsubscribeResults?.();
    };
  }, [socket, isConnected]);

  // Connection status indicator (optional - for development)
  if (process.env.NODE_ENV === 'development' && userId) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {isConnected ? '🟢 Live' : '🔴 Offline'}
        </div>
      </div>
    );
  }

  return null;
}
