"use client";

import { FC, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Card, Button, Spinner, PageHeader, Badge } from '@/app/components/ui';
import { LiveBettingRepository } from '@/app/repositories/LiveBettingRepository';
import { LiveBet, LiveBetStatus } from '@/app/models/LiveBet';
import LiveBetCard from '@/app/components/live-betting/LiveBetCard';
import { MdCameraAlt, MdHistory } from 'react-icons/md';

const LiveBettingPage: FC = () => {
  const { getToken, isSignedIn } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [activeBets, setActiveBets] = useState<LiveBet[]>([]);
  const [recentBets, setRecentBets] = useState<LiveBet[]>([]);
  const [history, setHistory] = useState<LiveBet[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Public: recent resolved bets
      const recent = await LiveBettingRepository.getRecent(5);
      setRecentBets(recent);

      // Auth: active bets + history
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          const [active, historyData] = await Promise.all([
            LiveBettingRepository.getActiveBets(token),
            LiveBettingRepository.getHistory(token, 5),
          ]);
          setActiveBets(active);
          setHistory(historyData.data);
        }
      }
    } catch (err) {
      console.error('Error loading live betting data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasActiveBet = activeBets.some(
    (b) => b.status === LiveBetStatus.ACTIVE || b.status === LiveBetStatus.DETECTING,
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <PageHeader
          title="Paris Live"
          backHref="/betting"
          backLabel="Paris"
        />

        {/* Main action */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-500 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <MdCameraAlt className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-bold text-white">Pari en direct</h2>
                <p className="text-sm text-white/80">
                  Pariez sur le gagnant avant chaque course
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {hasActiveBet ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pari en cours</Badge>
                </div>
                {activeBets.map((bet) => (
                  <LiveBetCard key={bet.id} liveBet={bet} compact />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-regular text-neutral-300">
                  Choisissez un gagnant, prenez une photo de l&apos;écran de sélection des karts, et validez votre pari !
                </p>
                <Link href="/betting/live/create">
                  <Button variant="primary" className="w-full gap-2">
                    <MdCameraAlt className="text-lg" />
                    Nouveau pari live
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Active bets */}
        {activeBets.length > 0 && !hasActiveBet && (
          <div>
            <h3 className="text-bold text-white mb-2">Mes paris actifs</h3>
            <div className="space-y-2">
              {activeBets.map((bet) => (
                <LiveBetCard key={bet.id} liveBet={bet} />
              ))}
            </div>
          </div>
        )}

        {/* My history */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-bold text-white flex items-center gap-2">
                <MdHistory className="text-lg text-neutral-400" />
                Mon historique
              </h3>
            </div>
            <div className="space-y-2">
              {history.map((bet) => (
                <LiveBetCard key={bet.id} liveBet={bet} compact />
              ))}
            </div>
          </div>
        )}

        {/* Recent community bets */}
        {recentBets.length > 0 && (
          <div>
            <h3 className="text-bold text-white mb-2">Derniers paris résolus</h3>
            <div className="space-y-2">
              {recentBets.map((bet) => (
                <LiveBetCard key={bet.id} liveBet={bet} compact />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentBets.length === 0 && history.length === 0 && activeBets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-400 mb-4">
              Aucun pari live pour le moment.
            </p>
            <Link href="/betting/live/create">
              <Button variant="primary" className="gap-2">
                <MdCameraAlt className="text-lg" />
                Lancer mon premier pari
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBettingPage;
