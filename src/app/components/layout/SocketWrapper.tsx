'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket, subscribeToAchievements, subscribeToLevelUp, subscribeToAchievementRevoked, subscribeToBetFinalized, subscribeToPerfectScore, subscribeToRaceAnnouncements, subscribeToRaceResults, subscribeToCompetitorUpdated, subscribeToDuelReceived, subscribeToDuelAccepted, subscribeToDuelDeclined, subscribeToDuelResolved, subscribeToDuelCancelled, DuelReceivedData } from '@/app/hooks/useSocket';
import { useApp } from '@/app/context/AppContext';
import { toast } from 'sonner';
import DuelRequestModal from '@/app/components/duel/DuelRequestModal';

interface SocketWrapperProps {
  userId?: string;
}

export default function SocketWrapper({ userId }: SocketWrapperProps) {
  const { socket, isConnected } = useSocket(userId);
  const { refreshCompetitors } = useApp();

  const [pendingDuel, setPendingDuel] = useState<DuelReceivedData | null>(null);

  const handleDuelResponded = useCallback(() => {
    setPendingDuel(null);
  }, []);

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

    // Bet finalized
    const unsubscribeBet = subscribeToBetFinalized((bet) => {
      const pointsEarned = bet.pointsEarned || 0;

      if (pointsEarned > 0) {
        toast.success(
          `🎯 ${pointsEarned} points gagnés !`,
          {
            duration: 4000,
            description: 'Pari finalisé',
          }
        );
      } else {
        toast.info(
          '📊 Plus de chance la prochaine fois !',
          {
            duration: 3000,
            description: 'Pari finalisé',
          }
        );
      }
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

    // Duel received — show modal
    const unsubscribeDuelReceived = subscribeToDuelReceived((data) => {
      setPendingDuel(data);
    });

    // Duel accepted
    const unsubscribeDuelAccepted = subscribeToDuelAccepted(() => {
      toast.success('Duel accepte ! En attente de la prochaine course.', { duration: 4000 });
    });

    // Duel declined
    const unsubscribeDuelDeclined = subscribeToDuelDeclined(() => {
      toast('Duel refuse', { duration: 3000 });
    });

    // Duel resolved — event is targeted, so we just show a toast
    const unsubscribeDuelResolved = subscribeToDuelResolved((data) => {
      toast.info(`Duel termine ! Mise: ${data.stake} pts`, {
        duration: 5000,
        description: 'Consultez vos duels pour les details.',
      });
    });

    // Duel cancelled
    const unsubscribeDuelCancelled = subscribeToDuelCancelled((data) => {
      const reason = data.reason === 'expired' ? 'Temps ecoule' : data.reason === 'absent' ? 'Absent de la course' : 'Annule';
      toast(`Duel annule : ${reason}`, { duration: 4000 });
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
      unsubscribeDuelReceived?.();
      unsubscribeDuelAccepted?.();
      unsubscribeDuelDeclined?.();
      unsubscribeDuelResolved?.();
      unsubscribeDuelCancelled?.();
    };
  }, [socket, isConnected, refreshCompetitors, userId]);

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

  return (
    <>
      {/* Duel request modal - shown when a duel is received via WebSocket */}
      {pendingDuel && (
        <DuelRequestModal
          isOpen={!!pendingDuel}
          onClose={() => setPendingDuel(null)}
          duelId={pendingDuel.duelId}
          challenger={pendingDuel.challenger}
          stake={pendingDuel.stake}
          expiresAt={pendingDuel.expiresAt}
          onResponded={handleDuelResponded}
        />
      )}

      {/* Connection status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && userId && (
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
      )}
    </>
  );
}
