"use client";

import { FC, useEffect, useState, useCallback, useRef } from 'react';

export const dynamic = 'force-dynamic';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { BetStatus } from '@/app/models/Bet';
import { Card, Button, Skeleton, PageHeader } from '@/app/components/ui';
import { formatPoints } from '@/app/utils/formatters';
import BetStatusFilter from '@/app/components/betting/BetStatusFilter';
import WeekAccordionSection from '@/app/components/betting/WeekAccordionSection';
import { useBetsByWeek } from '@/app/hooks/useBetsByWeek';
import { Spinner } from '@/app/components/ui';

const HistoryPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>(
    searchParams.get('tab') === 'mine' ? 'mine' : 'all'
  );
  const [activeStatus, setActiveStatus] = useState<BetStatus | null>(null);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [hasCurrentBet, setHasCurrentBet] = useState(false);
  const [expandedWeekKey, setExpandedWeekKey] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const stableGetToken = useCallback(async () => {
    return await getToken({ skipCache: true });
  }, [getToken]);

  const {
    weekGroups,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    stats,
    loadMore,
    currentWeekKey,
  } = useBetsByWeek({
    activeTab,
    activeStatus,
    userId: user?.id,
    getToken: stableGetToken,
  });

  // Resolve internal user ID + current bet status on mount
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
        const history = await BettingRepository.getBetHistory(user.id, token, 1, 0);
        if (history.data.length > 0) {
          setInternalUserId(history.data[0].userId);
        }
      } catch {
        // Non-critical
      }
    };
    resolveUserId();
  }, [user, getToken]);

  // Auto-expand first group when data loads
  useEffect(() => {
    if (weekGroups.length > 0 && expandedWeekKey === null) {
      setExpandedWeekKey(weekGroups[0].key);
    }
  }, [weekGroups, expandedWeekKey]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, isLoadingMore, loadMore]);

  const handleTabChange = (tab: 'all' | 'mine') => {
    setActiveTab(tab);
    setActiveStatus(null);
    setExpandedWeekKey(null);
  };

  const handleStatusChange = (status: BetStatus | null) => {
    setActiveStatus(status);
    setExpandedWeekKey(null);
  };

  const handleToggleWeek = (key: string) => {
    setExpandedWeekKey((prev) => (prev === key ? null : key));
  };

  if (error && weekGroups.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            variant="detail"
            title="Historique des paris"
            subtitle="Communaut\u00e9"
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
          subtitle={activeTab === 'all' ? 'Paris de la communaut\u00e9' : 'Vos paris pass\u00e9s et performances'}
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

        {/* Stats summary — only on "mine" tab */}
        {activeTab === 'mine' && !isLoading && weekGroups.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="bg-neutral-800 rounded-xl p-3 text-center border border-neutral-700">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-neutral-400">Total</div>
            </div>
            <div className="bg-neutral-800 rounded-xl p-3 text-center border border-success-500/30">
              <div className="text-xl sm:text-2xl font-bold text-success-500">{stats.won}</div>
              <div className="text-xs text-neutral-400">Gagn\u00e9s</div>
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
          <div className="space-y-3">
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
          </div>
        ) : weekGroups.length === 0 ? (
          /* Empty state */
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">{activeTab === 'all' ? '\u{1F465}' : '\u{1F3B0}'}</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === 'all' ? 'Aucun pari pour le moment' : "Vous n'avez pas encore pari\u00e9"}
            </h3>
            <p className="text-neutral-400 mb-6">
              {activeTab === 'all'
                ? 'Soyez le premier \u00e0 parier cette semaine !'
                : 'Commencez \u00e0 parier pour voir votre historique ici'}
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
          /* Week accordion list */
          <div className="space-y-3">
            {weekGroups.map((group) => (
              <WeekAccordionSection
                key={group.key}
                group={group}
                isExpanded={expandedWeekKey === group.key}
                onToggle={() => handleToggleWeek(group.key)}
                isCurrentWeek={group.key === currentWeekKey}
                currentUserHasBet={hasCurrentBet}
                internalUserId={internalUserId}
                activeTab={activeTab}
              />
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
            {!hasMore && weekGroups.length > 0 && (
              <div className="text-center py-4 text-neutral-500 text-sm">
                {activeTab === 'all'
                  ? `${stats.total} paris au total`
                  : `Fin de l'historique (${stats.total} paris)`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
