"use client";

import { FC, useEffect, useState, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { Bet, BetPosition } from '@/app/models/Bet';
import { Card, Badge } from '@/app/components/layout';
import { BET_POSITION_LABELS } from '@/app/utils/constants';
import { formatPoints, formatOdds, formatDateLocale } from '@/app/utils/formatters';
import { MdHistory, MdCheckCircle, MdCancel, MdPending, MdBolt } from 'react-icons/md';

const HistoryPage: FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Token non disponible');
      }

      const data = await BettingRepository.getBetHistory(user.id, token);
      setBets(data);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setError('Vous devez être connecté pour voir votre historique.');
      setIsLoading(false);
    }
  }, [user, loadHistory]);

  const getPositionBadgeVariant = (position: BetPosition) => {
    return position === BetPosition.FIRST ? 'gold' : position === BetPosition.SECOND ? 'silver' : 'bronze';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
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
          <button
            onClick={() => router.push('/betting/place-bet')}
            className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-neutral-900 rounded-lg font-bold transition-colors"
          >
            Placer un pari
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MdHistory className="text-4xl text-primary-500" />
            <h1 className="text-title">Historique des Paris</h1>
          </div>

          <div className="text-center">
            <Badge variant="primary" size="md">
              {bets.length} pari{bets.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Stats summary */}
        {bets.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl text-primary-500 mb-1">{bets.length}</div>
              <div className="text-sub text-neutral-400">Total</div>
            </Card>

            <Card variant="success" className="p-4 text-center">
              <div className="text-2xl text-success-500 mb-1">
                {bets.filter((b) => b.isFinalized && (b.pointsEarned ?? 0) > 0).length}
              </div>
              <div className="text-sub text-neutral-400">Gagnants</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl text-primary-500 mb-1">
                {formatPoints(
                  bets
                    .filter((b) => b.isFinalized)
                    .reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0),
                  1
                )}
              </div>
              <div className="text-sub text-neutral-400">Points</div>
            </Card>
          </div>
        )}

        {/* Bets list */}
        {bets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-regular text-neutral-400 mb-4">
              Vous n&apos;avez pas encore placé de pari.
            </p>
            <button
              onClick={() => router.push('/betting/place-bet')}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-neutral-900 rounded-lg font-bold transition-colors"
            >
              Placer mon premier pari
            </button>
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
                  variant={
                    bet.isFinalized
                      ? (bet.pointsEarned ?? 0) > 0
                        ? 'success'
                        : 'default'
                      : 'primary'
                  }
                  className="p-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-bold text-white">
                        Pari du {formatDateLocale(bet.placedAt)}
                      </h3>
                      <p className="text-sub text-neutral-400">
                        {new Date(bet.placedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {bet.isFinalized ? (
                        <>
                          <Badge
                            variant={(bet.pointsEarned ?? 0) > 0 ? 'success' : 'error'}
                            size="md"
                          >
                            {(bet.pointsEarned ?? 0) > 0 ? (
                              <>
                                <MdCheckCircle className="inline mr-1" />
                                {formatPoints(bet.pointsEarned ?? 0, 1)} pts
                              </>
                            ) : (
                              <>
                                <MdCancel className="inline mr-1" />
                                0 pts
                              </>
                            )}
                          </Badge>
                          {isPerfectPodium && (
                            <Badge variant="gold" size="sm">
                              🏆 Parfait!
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="warning" size="md">
                          <MdPending className="inline mr-1" />
                          En attente
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Picks */}
                  <div className="space-y-2">
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
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            bet.isFinalized
                              ? pick.isCorrect
                                ? 'bg-success-500/20 border border-success-500'
                                : 'bg-neutral-800 border border-neutral-700 opacity-70'
                              : 'bg-neutral-800 border border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={getPositionBadgeVariant(pick.position)}
                              size="sm"
                            >
                              {BET_POSITION_LABELS[pick.position]}
                            </Badge>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-regular text-white">
                                  Compétiteur #{pick.competitorId.slice(0, 8)}
                                </span>
                                {pick.hasBoost && (
                                  <Badge variant="warning" size="sm">
                                    <MdBolt className="inline" /> x2
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sub text-neutral-400">
                                Cote: {formatOdds(pick.oddAtBet)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {bet.isFinalized && (
                              <>
                                {pick.isCorrect ? (
                                  <MdCheckCircle className="text-2xl text-success-500" />
                                ) : (
                                  <MdCancel className="text-2xl text-error-500" />
                                )}
                                <div className="text-sub text-neutral-400 mt-1">
                                  {formatPoints(pick.pointsEarned ?? 0, 1)} pts
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA */}
        {bets.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/betting/place-bet')}
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-neutral-900 rounded-lg font-bold transition-colors"
            >
              Placer un nouveau pari
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
