"use client";

import { FC, useEffect, useState, useCallback, useRef } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdLock } from 'react-icons/md';
import { BettingRepository, PaginationMeta } from '@/app/repositories/BettingRepository';
import { Bet, BetStatus } from '@/app/models/Bet';
import { BettingWeekStatus } from '@/app/models/BettingWeek';
import { Card, Button, Spinner, PageHeader } from '@/app/components/ui';
import { AchievementCard } from '@/app/components/achievements';
import { formatPoints } from '@/app/utils/formatters';
import CommunityBetCard from '@/app/components/betting/CommunityBetCard';
import BetStatusFilter from '@/app/components/betting/BetStatusFilter';

const BETS_PER_PAGE = 10;

const HistoryPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Community filters
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>(
    searchParams.get('tab') === 'mine' ? 'mine' : 'all'
  );
  const [activeStatus, setActiveStatus] = useState<BetStatus | null>(null);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [hasCurrentBet, setHasCurrentBet] = useState(false);
  const [weekClosed, setWeekClosed] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Resolve internal user ID + week status on mount
  useEffect(() => {
    const resolveUserId = async () => {
      if (!user) return;
      try {
        const token = await getToken({ skipCache: true });
        if (!token) return;
        const bet = await BettingRepository.getCurrentBet(user.id, token);
        if (bet) {
          setInternalUserId(bet.userId);
          setHasCurrentBet(true);
          return;
        }
        // Fallback: load first personal bet
        const history = await BettingRepository.getBetHistory(user.id, token, 1, 0);
        if (history.data.length > 0) {
          setInternalUserId(history.data[0].userId);
        }
      } catch {
        // Non-critical, just can't identify own bets
      }
    };
    const loadWeekStatus = async () => {
      try {
        const week = await BettingRepository.getCurrentWeek();
        setWeekClosed(week ? week.status !== BettingWeekStatus.OPEN : false);
      } catch {
        // Non-critical
      }
    };
    resolveUserId();
    loadWeekStatus();
  }, [user, getToken]);

  const loadHistory = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      let response;

      if (activeTab === 'all') {
        // Community tab — public endpoint
        response = await BettingRepository.getCommunityBets(
          BETS_PER_PAGE,
          offset,
          undefined,
          activeStatus ?? undefined
        );
      } else {
        // My bets tab — authenticated
        if (!user) {
          throw new Error('Utilisateur non connecté');
        }
        const token = await getToken({ skipCache: true });
        if (!token) {
          throw new Error('Token non disponible');
        }
        response = await BettingRepository.getBetHistory(
          user.id,
          token,
          BETS_PER_PAGE,
          offset
        );
      }

      if (append) {
        setBets((prev) => [...prev, ...response.data]);
      } else {
        setBets(response.data);
      }
      setMeta(response.meta);
    } catch (err) {
      console.error('Error loading history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab, activeStatus, user, getToken]);

  const loadMore = useCallback(() => {
    if (!meta?.hasMore || isLoadingMore) return;
    loadHistory(meta.offset + meta.limit, true);
  }, [meta, isLoadingMore, loadHistory]);

  // Initial load + reload on tab/filter change
  useEffect(() => {
    if (activeTab === 'mine' && !user) {
      setError('Vous devez être connecté pour voir vos paris.');
      setIsLoading(false);
      return;
    }
    loadHistory(0);
  }, [activeTab, activeStatus, user, loadHistory]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && meta?.hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [meta?.hasMore, isLoadingMore, loadMore]);

  // Stats (only meaningful on "mine" tab)
  const stats = {
    total: meta?.total ?? bets.length,
    won: bets.filter((b) => b.isFinalized && (b.pointsEarned ?? 0) > 0).length,
    totalPoints: bets
      .filter((b) => b.isFinalized)
      .reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0),
    perfectPodiums: bets.filter(
      (b) => b.isFinalized && b.picks.every((p) => p.isCorrect === true)
    ).length,
  };

  const handleTabChange = (tab: 'all' | 'mine') => {
    setActiveTab(tab);
    setActiveStatus(null);
    setBets([]);
    setMeta(null);
  };

  const handleStatusChange = (status: BetStatus | null) => {
    setActiveStatus(status);
    setBets([]);
    setMeta(null);
  };

  if (error && bets.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            variant="detail"
            title="Historique des paris"
            subtitle="Communauté"
            backHref="/betting"
          />
          <Card variant="error" className="p-6">
            <p className="text-regular">{error}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/betting/place-bet')}
              className="mt-4"
            >
              Placer un pari
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          variant="detail"
          title="Historique des paris"
          subtitle={activeTab === 'all' ? 'Paris de la communauté' : 'Vos paris passés et performances'}
          backHref="/betting"
        />

        {/* Filters */}
        <div className="mb-6">
          <BetStatusFilter
            activeTab={activeTab}
            onTabChange={handleTabChange}
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Banner: invite to bet to unlock picks */}
        {activeTab === 'all' && user && !hasCurrentBet && (
          <Link href="/betting/place-bet">
            <Card className="p-4 mb-6 border-primary-500/50 hover:border-primary-500 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10 flex-shrink-0">
                  <MdLock className="text-xl text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Placez votre pari pour découvrir les pronostics des autres joueurs
                  </p>
                  <p className="text-xs text-primary-400 mt-0.5">Parier maintenant →</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Stats summary — only on "mine" tab */}
        {activeTab === 'mine' && bets.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-neutral-800 rounded-xl p-3 text-center border border-neutral-700">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-neutral-400">Total</div>
            </div>
            <div className="bg-neutral-800 rounded-xl p-3 text-center border border-success-500/30">
              <div className="text-xl sm:text-2xl font-bold text-success-500">{stats.won}</div>
              <div className="text-xs text-neutral-400">Gagnés</div>
            </div>
            <div className="bg-neutral-800 rounded-xl p-3 text-center border border-primary-500/30">
              <div className="text-xl sm:text-2xl font-bold text-primary-500">
                {formatPoints(stats.totalPoints, 0)}
              </div>
              <div className="text-xs text-neutral-400">Points</div>
            </div>
            <div className="bg-neutral-800 rounded-xl p-3 text-center border border-gold-500/30">
              <div className="text-xl sm:text-2xl font-bold text-gold-500">{stats.perfectPodiums}</div>
              <div className="text-xs text-neutral-400">Parfaits</div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-regular">Chargement...</p>
            </div>
          </div>
        ) : bets.length === 0 ? (
          /* Empty state */
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">{activeTab === 'all' ? '\u{1F465}' : '\u{1F3B0}'}</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === 'all' ? 'Aucun pari pour le moment' : "Vous n'avez pas encore parié"}
            </h3>
            <p className="text-neutral-400 mb-6">
              {activeTab === 'all'
                ? 'Soyez le premier à parier cette semaine !'
                : 'Commencez à parier pour voir votre historique ici'}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/betting/place-bet')}
            >
              Placer un pari
            </Button>
          </Card>
        ) : (
          /* Bets list */
          <div className="space-y-4">
            {bets.map((bet) => (
              <div key={bet.id}>
                <CommunityBetCard
                  bet={bet}
                  isCurrentUser={!!internalUserId && bet.userId === internalUserId}
                  variant="full"
                  currentUserHasBet={hasCurrentBet}
                  weekClosed={weekClosed}
                />

                {/* Achievement Timeline — only on "mine" tab for own bets */}
                {activeTab === 'mine' && bet.achievementsUnlocked && bet.achievementsUnlocked.length > 0 && (
                  <div className="mt-2 ml-4 pl-4 border-l-2 border-neutral-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-primary-400">
                        Achievements débloqués
                      </span>
                    </div>
                    <div className="space-y-2">
                      {bet.achievementsUnlocked.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={{
                            ...achievement,
                            isUnlocked: true,
                          }}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-10" />

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="md" />
                <span className="ml-2 text-neutral-400">Chargement...</span>
              </div>
            )}

            {/* End of list indicator */}
            {meta && !meta.hasMore && bets.length > 0 && (
              <div className="text-center py-4 text-neutral-500 text-sm">
                {activeTab === 'all'
                  ? `${meta.total} paris au total`
                  : `Fin de l'historique (${meta.total} paris)`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
