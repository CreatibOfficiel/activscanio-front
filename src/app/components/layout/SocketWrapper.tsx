'use client';

import { useEffect } from 'react';
import { useSocket, subscribeToAchievements, subscribeToLevelUp, subscribeToAchievementRevoked, subscribeToBetFinalized, subscribeToPerfectScore, subscribeToRaceAnnouncements, subscribeToRaceResults, subscribeToCompetitorUpdated, subscribeToRankingsUpdated, subscribeToStreakLost } from '@/app/hooks/useSocket';
import { useApp } from '@/app/context/AppContext';
import { useResultModals } from '@/app/context/ResultModalsContext';
import { toast } from 'sonner';

interface SocketWrapperProps {
  userId?: string;
}

export default function SocketWrapper({ userId }: SocketWrapperProps) {
  const { socket, isConnected } = useSocket(userId);
  const { refreshCompetitors } = useApp();
  const { enqueueBetResult, enqueueStreakLoss } = useResultModals();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Achievement unlocked
    const unsubscribeAchievements = subscribeToAchievements((achievement) => {
      toast.success(
        `🎉 ${achievement.icon} ${achievement.name} (+${achievement.xpReward} XP)`,
        {
          duration: 5000,
          description: 'Succès débloqué !',
        }
      );
    });

    // Level up
    const unsubscribeLevelUp = subscribeToLevelUp((data) => {
      const rewardsText = data.rewards && data.rewards.length > 0
        ? ` - ${data.rewards.length} nouvelles récompenses !`
        : '';
      toast.success(
        `📈 Niveau ${data.newLevel} atteint !${rewardsText}`,
        {
          duration: 6000,
          description: 'Niveau supérieur !',
        }
      );
    });

    // Achievement revoked
    const unsubscribeRevoked = subscribeToAchievementRevoked((achievement) => {
      toast.info(
        `😔 ${achievement.icon} ${achievement.name}`,
        {
          duration: 5000,
          description: 'Succès perdu - Continuez à jouer pour le récupérer !',
        }
      );
    });

    // Bet finalized — enqueue modal instead of toast
    const unsubscribeBet = subscribeToBetFinalized((bet) => {
      enqueueBetResult({
        betId: bet.betId,
        weekId: bet.weekId,
        status: bet.status,
        pointsEarned: bet.pointsEarned,
        isPerfectPodium: bet.isPerfectPodium,
        perfectPodiumBonus: bet.perfectPodiumBonus,
        correctPicks: bet.correctPicks,
        totalPicks: bet.totalPicks,
        hasBoost: bet.hasBoost,
        picks: bet.picks,
      });
    });

    // Perfect score celebration
    const unsubscribePerfectScore = subscribeToPerfectScore((data) => {
      toast.success(
        '🏆 SCORE PARFAIT ! 60 POINTS ! 🎉',
        {
          duration: 10000,
          description: data.imageUrl
            ? 'Cliquez pour voir votre image !'
            : 'Félicitations pour votre score parfait !',
          action: data.imageUrl ? {
            label: 'Voir l\'image',
            onClick: () => window.open(data.imageUrl, '_blank'),
          } : undefined,
        }
      );
    });

    // Race announcement (broadcast)
    const unsubscribeRace = subscribeToRaceAnnouncements((race) => {
      if (race.bettingOpen) {
        toast.info(
          `🏁 ${race.title || 'Nouvelle course disponible'}`,
          {
            duration: 5000,
            description: 'Placez vos paris maintenant !',
          }
        );
      } else {
        toast.info(
          `🏁 ${race.title || 'Nouvelle course ajoutée'}`,
          {
            duration: 4000,
          }
        );
      }
      refreshCompetitors();
    });

    // Race results (broadcast)
    const unsubscribeResults = subscribeToRaceResults(() => {
      toast.info(
        '🏆 Résultats de course disponibles',
        {
          duration: 4000,
          description: 'Découvrez les derniers résultats !',
        }
      );
      refreshCompetitors();
    });

    // Competitor updated (broadcast)
    const unsubscribeCompetitor = subscribeToCompetitorUpdated(() => {
      refreshCompetitors();
    });

    // Rankings updated (broadcast) — triggers ranking animation
    const unsubscribeRankings = subscribeToRankingsUpdated(() => {
      refreshCompetitors();
    });

    // Streak lost — enqueue modal
    const unsubscribeStreak = subscribeToStreakLost((data) => {
      enqueueStreakLoss([{
        type: data.type,
        lostValue: data.lostValue,
        lostAt: data.lostAt,
      }]);
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
      unsubscribeCompetitor?.();
      unsubscribeRankings?.();
      unsubscribeStreak?.();
    };
  }, [socket, isConnected, refreshCompetitors, enqueueBetResult, enqueueStreakLoss]);

  // Refresh data when app returns to foreground (iOS PWA fix)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCompetitors();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCompetitors]);

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
