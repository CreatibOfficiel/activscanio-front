"use client";

import { FC, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useUser } from '@clerk/nextjs';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { BettingWeek, BettingWeekStatus } from '@/app/models/BettingWeek';
import { Bet, BetStatus } from '@/app/models/Bet';
import { BettorRanking } from '@/app/models/CompetitorOdds';
import { Card, Badge, Button, Spinner } from '@/app/components/ui';
import {
  MdCasino,
  MdHistory,
  MdLeaderboard,
  MdTimer,
  MdCheckCircle,
  MdPending,
  MdTrendingUp,
  MdEmojiEvents
} from 'react-icons/md';

const BettingPage: FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<BettingWeek | null>(null);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [userRanking, setUserRanking] = useState<BettorRanking | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load current week
      const week = await BettingRepository.getCurrentWeek();
      setCurrentWeek(week);

      if (user) {
        const token = await getToken();
        if (token) {
          // Load current bet
          const bet = await BettingRepository.getCurrentBet(user.id, token);
          setCurrentBet(bet);

          // Load bet history (get last 3)
          const history = await BettingRepository.getBetHistory(user.id, token);
          setRecentBets(history.slice(0, 3));

          // Load user ranking for current month
          const now = new Date();
          const rankingsData = await BettingRepository.getMonthlyRankings(
            now.getMonth() + 1,
            now.getFullYear()
          );
          const myRanking = rankingsData.rankings.find(
            (r) => r.userId === user.id
          );
          setUserRanking(myRanking || null);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading betting data:', err);
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate time remaining until betting closes
  useEffect(() => {
    if (!currentWeek || currentWeek.status !== BettingWeekStatus.OPEN) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(currentWeek.endDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Fermé');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}j ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}min`);
      } else {
        setTimeRemaining(`${minutes}min`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [currentWeek]);

  const getBetStatusIcon = (status: BetStatus) => {
    switch (status) {
      case BetStatus.WON:
        return <MdCheckCircle className="text-green-400" />;
      case BetStatus.LOST:
        return <MdCheckCircle className="text-red-400" />;
      case BetStatus.CANCELLED:
        return <MdPending className="text-neutral-400" />;
      default:
        return <MdPending className="text-yellow-400" />;
    }
  };

  const formatWeekDates = (week: BettingWeek) => {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-regular">Chargement...</p>
        </div>
      </div>
    );
  }

  // Empty state - no betting week active and no history
  if (!currentWeek && recentBets.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-center text-title mb-4">Paris</h1>

          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6">
              <Image
                src="/illustrations/empty-bets.svg"
                alt="Aucun pari"
                width={240}
                height={200}
                priority
              />
            </div>

            <div className="text-center max-w-sm">
              <h2 className="text-heading text-white mb-2">
                Les paris arrivent bientôt !
              </h2>
              <p className="text-regular text-neutral-400 mb-6">
                Aucune semaine de paris n&apos;est active pour le moment.
                Revenez plus tard pour placer vos pronostics !
              </p>

              <Link href="/betting/rankings">
                <Button variant="primary" className="gap-2">
                  <MdLeaderboard className="text-lg" />
                  Voir le classement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <h1 className="text-center text-title mb-2">Paris</h1>

        {/* Main Action Card - Current Week */}
        {currentWeek && (
          <Card className="p-0 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-100 opacity-80">Semaine en cours</p>
                  <p className="text-bold text-white">{formatWeekDates(currentWeek)}</p>
                </div>
                {currentWeek.status === BettingWeekStatus.OPEN && timeRemaining && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <MdTimer className="text-white" />
                    <span className="text-sm text-white font-medium">{timeRemaining}</span>
                  </div>
                )}
                {currentWeek.status !== BettingWeekStatus.OPEN && (
                  <Badge variant="default">Fermé</Badge>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {currentBet ? (
                // User has already bet
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <MdCheckCircle className="text-xl" />
                    <span className="text-bold">Pari enregistré</span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Vous avez placé {currentBet.picks.length} pronostics pour cette semaine
                  </p>
                  <Link href="/betting/history">
                    <Button variant="secondary" size="sm" className="w-full gap-2">
                      <MdHistory className="text-lg" />
                      Voir les détails
                    </Button>
                  </Link>
                </div>
              ) : currentWeek.status === BettingWeekStatus.OPEN ? (
                // No bet yet, week is open
                <div className="space-y-3">
                  <p className="text-regular text-neutral-300">
                    Pronostiquez le podium de la semaine et gagnez des points !
                  </p>
                  <Link href="/betting/place-bet">
                    <Button variant="primary" className="w-full gap-2">
                      <MdCasino className="text-lg" />
                      Parier maintenant
                    </Button>
                  </Link>
                </div>
              ) : (
                // Week closed, no bet placed
                <div className="text-center py-2">
                  <p className="text-regular text-neutral-400">
                    Les paris sont fermés pour cette semaine
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* User Ranking Card */}
          <Link href="/betting/rankings">
            <Card className="p-4 hover:border-primary-500 transition-colors cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                  <MdEmojiEvents className="text-2xl text-yellow-400" />
                </div>
                <p className="text-sub text-neutral-400 mb-1">Mon rang</p>
                {userRanking ? (
                  <p className="text-heading text-white">#{userRanking.rank}</p>
                ) : (
                  <p className="text-heading text-neutral-500">-</p>
                )}
              </div>
            </Card>
          </Link>

          {/* Points Card */}
          <Card className="p-4 h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <MdTrendingUp className="text-2xl text-green-400" />
              </div>
              <p className="text-sub text-neutral-400 mb-1">Points ce mois</p>
              {userRanking ? (
                <p className="text-heading text-white">{userRanking.totalPoints}</p>
              ) : (
                <p className="text-heading text-neutral-500">0</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Bets */}
        {recentBets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-bold text-white">Derniers paris</h2>
              <Link href="/betting/history" className="text-sm text-primary-400 hover:text-primary-300">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              {recentBets.map((bet) => (
                <Card key={bet.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getBetStatusIcon(bet.status)}
                      <div>
                        <p className="text-sm text-white">
                          Pari du {new Date(bet.placedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {bet.picks.length} pronostics
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {bet.status === BetStatus.WON && (
                        <p className="text-sm text-green-400 font-medium">+{bet.pointsEarned || 0} pts</p>
                      )}
                      {bet.status === BetStatus.LOST && (
                        <p className="text-sm text-red-400 font-medium">0 pts</p>
                      )}
                      {bet.status === BetStatus.PENDING && (
                        <Badge variant="warning" size="sm">En attente</Badge>
                      )}
                      {bet.status === BetStatus.CANCELLED && (
                        <Badge variant="default" size="sm">Annulé</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-2">
          <h2 className="text-bold text-white mb-3">Navigation</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/betting/history">
              <Card className="p-4 hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MdHistory className="text-xl text-blue-400" />
                  </div>
                  <span className="text-regular text-white">Historique</span>
                </div>
              </Card>
            </Link>
            <Link href="/betting/rankings">
              <Card className="p-4 hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <MdLeaderboard className="text-xl text-yellow-400" />
                  </div>
                  <span className="text-regular text-white">Classement</span>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPage;
