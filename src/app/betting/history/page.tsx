"use client";

import { FC, useEffect, useState, useCallback, useRef } from 'react';

export const dynamic = 'force-dynamic';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { BettingRepository, PaginationMeta } from '@/app/repositories/BettingRepository';
import { Bet, BetPosition } from '@/app/models/Bet';
import { Card, Badge, Button, Spinner, PageHeader } from '@/app/components/ui';
import { AchievementCard } from '@/app/components/achievements';
import { formatPoints, formatOdds, formatDateLocale, formatCompetitorName } from '@/app/utils/formatters';
import { MdCheckCircle, MdCancel, MdPending, MdBolt } from 'react-icons/md';

const BETS_PER_PAGE = 10;

// Position medal component with visual styling
const PositionMedal: FC<{ position: BetPosition; isCorrect?: boolean; isFinalized: boolean }> = ({
  position,
  isCorrect,
  isFinalized
}) => {
  const medalConfig = {
    [BetPosition.FIRST]: {
      emoji: '🥇',
      label: '1er',
      bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-600',
      textColor: 'text-amber-900',
      shadowColor: 'shadow-amber-500/30',
    },
    [BetPosition.SECOND]: {
      emoji: '🥈',
      label: '2ème',
      bgColor: 'bg-gradient-to-br from-gray-300 to-gray-500',
      textColor: 'text-gray-800',
      shadowColor: 'shadow-gray-400/30',
    },
    [BetPosition.THIRD]: {
      emoji: '🥉',
      label: '3ème',
      bgColor: 'bg-gradient-to-br from-orange-400 to-orange-700',
      textColor: 'text-orange-900',
      shadowColor: 'shadow-orange-500/30',
    },
  };

  const config = medalConfig[position];
  const dimmed = isFinalized && !isCorrect;

  return (
    <div
      className={`
        flex items-center justify-center w-12 h-12 rounded-full
        ${config.bgColor} ${config.shadowColor} shadow-lg
        ${dimmed ? 'opacity-40 grayscale' : ''}
        transition-all duration-200
      `}
    >
      <span className="text-2xl" role="img" aria-label={config.label}>
        {config.emoji}
      </span>
    </div>
  );
};

const HistoryPage: FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Token non disponible');
      }

      const response = await BettingRepository.getBetHistory(
        user.id,
        token,
        BETS_PER_PAGE,
        offset
      );

      if (append) {
        setBets((prev) => [...prev, ...response.data]);
      } else {
        setBets(response.data);
      }
      setMeta(response.meta);

      if (offset === 0) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique.';
      setError(errorMessage);
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, getToken]);

  const loadMore = useCallback(() => {
    if (!meta?.hasMore || isLoadingMore) return;
    loadHistory(meta.offset + meta.limit, true);
  }, [meta, isLoadingMore, loadHistory]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadHistory(0);
    } else {
      setError('Vous devez être connecté pour voir votre historique.');
      setIsLoading(false);
    }
  }, [user, loadHistory]);

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

  // Calculate stats (from loaded bets, but show total from meta)
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <Card variant="error" className="p-6 max-w-2xl mx-auto">
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
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          variant="detail"
          title="Historique des paris"
          subtitle="Consultez vos paris passés et suivez vos performances"
          backHref="/betting"
        />

        {/* Stats summary - compact cards */}
        {bets.length > 0 && (
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

        {/* Bets list */}
        {bets.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">🎰</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Aucun pari pour le moment
            </h3>
            <p className="text-neutral-400 mb-6">
              Commencez à parier pour voir votre historique ici
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/betting/place-bet')}
            >
              Placer mon premier pari
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => {
              const isPerfectPodium =
                bet.isFinalized &&
                bet.picks.every((pick) => pick.isCorrect === true);

              return (
                <Card
                  key={bet.id}
                  className={`p-4 ${
                    bet.isFinalized
                      ? (bet.pointsEarned ?? 0) > 0
                        ? 'border-success-500/30'
                        : 'border-neutral-700'
                      : 'border-primary-500/30'
                  }`}
                >
                  {/* Bet Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {formatDateLocale(bet.placedAt)}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {new Date(bet.placedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {bet.isFinalized ? (
                        <>
                          {(bet.pointsEarned ?? 0) > 0 ? (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-success-500/20 text-success-500">
                              <MdCheckCircle className="w-4 h-4" />
                              <span className="font-semibold">
                                +{formatPoints(bet.pointsEarned ?? 0, 1)} pts
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-500/20 text-error-500">
                              <MdCancel className="w-4 h-4" />
                              <span className="font-semibold">0 pts</span>
                            </div>
                          )}
                          {isPerfectPodium && (
                            <Badge variant="gold" size="sm">
                              Parfait!
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-warning-500/20 text-warning-500">
                          <MdPending className="w-4 h-4" />
                          <span className="font-medium">En attente</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Picks with medal design */}
                  <div className="space-y-3">
                    {bet.picks
                      .sort((a, b) => {
                        const order = {
                          [BetPosition.FIRST]: 1,
                          [BetPosition.SECOND]: 2,
                          [BetPosition.THIRD]: 3,
                        };
                        return order[a.position] - order[b.position];
                      })
                      .map((pick) => (
                        <div
                          key={pick.id}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                            bet.isFinalized
                              ? pick.isCorrect
                                ? 'bg-success-500/10 border border-success-500/30'
                                : 'bg-neutral-800/50 border border-neutral-700/50'
                              : 'bg-neutral-800 border border-neutral-700'
                          }`}
                        >
                          {/* Medal */}
                          <PositionMedal
                            position={pick.position}
                            isCorrect={pick.isCorrect}
                            isFinalized={bet.isFinalized}
                          />

                          {/* Competitor info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium truncate ${
                                bet.isFinalized && !pick.isCorrect
                                  ? 'text-neutral-400'
                                  : 'text-white'
                              }`}>
                                {pick.competitor
                                  ? formatCompetitorName(pick.competitor.firstName, pick.competitor.lastName)
                                  : `#${pick.competitorId.slice(0, 8)}`}
                              </span>
                              {pick.hasBoost && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-500 text-xs font-semibold">
                                  <MdBolt className="w-3 h-3" />
                                  x2
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-neutral-500">
                              Cote {formatOdds(pick.oddAtBet)}
                            </span>
                          </div>

                          {/* Result */}
                          {bet.isFinalized && (
                            <div className="flex flex-col items-end">
                              {pick.isCorrect ? (
                                <MdCheckCircle className="w-6 h-6 text-success-500" />
                              ) : (
                                <MdCancel className="w-6 h-6 text-error-500/60" />
                              )}
                              <span className={`text-sm font-medium ${
                                pick.isCorrect ? 'text-success-500' : 'text-neutral-500'
                              }`}>
                                {formatPoints(pick.pointsEarned ?? 0, 1)} pts
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Achievement Timeline - Show achievements unlocked for this bet */}
                  {bet.achievementsUnlocked && bet.achievementsUnlocked.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-primary-400">
                          Achievements débloqués
                        </span>
                        <Badge variant="primary" size="sm">
                          +{bet.achievementsUnlocked.reduce((sum, a) => sum + a.xpReward, 0)} XP
                        </Badge>
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
                </Card>
              );
            })}

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
                Fin de l&apos;historique ({meta.total} paris)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
