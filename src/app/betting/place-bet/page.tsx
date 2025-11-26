"use client";

import { FC, useEffect, useState, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { BettingWeek, BettingWeekStatus } from '@/app/models/BettingWeek';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { BetPosition } from '@/app/models/Bet';
import PodiumSelector from '@/app/components/betting/PodiumSelector';
import { Card, Badge } from '@/app/components/layout';
import { MdTrendingUp, MdInfo } from 'react-icons/md';

interface PodiumSelection {
  [BetPosition.FIRST]?: string;
  [BetPosition.SECOND]?: string;
  [BetPosition.THIRD]?: string;
}

const PlaceBetPage: FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [currentWeek, setCurrentWeek] = useState<BettingWeek | null>(null);
  const [odds, setOdds] = useState<CompetitorOdds[]>([]);
  const [selection, setSelection] = useState<PodiumSelection>({});
  const [boostedCompetitorId, setBoostedCompetitorId] = useState<string | undefined>();
  const [existingBet, setExistingBet] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load current week
      const week = await BettingRepository.getCurrentWeek();
      if (!week) {
        setError('Aucune semaine de paris active pour le moment.');
        setIsLoading(false);
        return;
      }

      setCurrentWeek(week);

      // Check if week is open
      if (week.status !== BettingWeekStatus.OPEN) {
        setError('Les paris sont fermés pour cette semaine.');
        setIsLoading(false);
        return;
      }

      // Load odds
      const oddsData = await BettingRepository.getCurrentWeekOdds();
      setOdds(oddsData);

      // Check if user already has a bet
      if (user) {
        const token = await getToken();
        if (token) {
          const bet = await BettingRepository.getCurrentBet(user.id, token);
          if (bet) {
            setExistingBet(true);
            setError('Vous avez déjà placé un pari pour cette semaine.');
          }
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données.');
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectionChange = (
    newSelection: PodiumSelection,
    newBoostedCompetitorId?: string
  ) => {
    setSelection(newSelection);
    setBoostedCompetitorId(newBoostedCompetitorId);
    setError(null);
  };

  const calculatePotentialGain = (): number => {
    if (!selection[BetPosition.FIRST] || !selection[BetPosition.SECOND] || !selection[BetPosition.THIRD]) {
      return 0;
    }

    let total = 0;

    [BetPosition.FIRST, BetPosition.SECOND, BetPosition.THIRD].forEach((position) => {
      const competitorId = selection[position];
      if (!competitorId) return;

      const competitor = odds.find((c) => c.competitorId === competitorId);
      if (!competitor) return;

      let points = competitor.odd;

      // Apply boost
      if (boostedCompetitorId === competitorId) {
        points *= 2;
      }

      total += points;
    });

    return total;
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Vous devez être connecté pour parier.');
      return;
    }

    if (!selection[BetPosition.FIRST] || !selection[BetPosition.SECOND] || !selection[BetPosition.THIRD]) {
      setError('Veuillez sélectionner les 3 positions du podium.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Token non disponible');
      }

      await BettingRepository.placeBet(
        user.id,
        {
          picks: [
            {
              competitorId: selection[BetPosition.FIRST]!,
              position: BetPosition.FIRST,
              hasBoost: boostedCompetitorId === selection[BetPosition.FIRST],
            },
            {
              competitorId: selection[BetPosition.SECOND]!,
              position: BetPosition.SECOND,
              hasBoost: boostedCompetitorId === selection[BetPosition.SECOND],
            },
            {
              competitorId: selection[BetPosition.THIRD]!,
              position: BetPosition.THIRD,
              hasBoost: boostedCompetitorId === selection[BetPosition.THIRD],
            },
          ],
        },
        token
      );

      setSuccess(true);

      // Redirect to history after 2 seconds
      setTimeout(() => {
        router.push('/betting/history');
      }, 2000);
    } catch (err) {
      console.error('Error placing bet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du placement du pari.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <Card variant="success" className="p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-heading text-white mb-2">Pari placé avec succès !</h2>
          <p className="text-regular text-neutral-300">
            Votre pari a été enregistré. Bonne chance !
          </p>
          <p className="text-sub text-neutral-500 mt-4">
            Redirection vers l&apos;historique...
          </p>
        </Card>
      </div>
    );
  }

  if (error && (!currentWeek || currentWeek.status !== BettingWeekStatus.OPEN || existingBet)) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <Card variant="error" className="p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <MdInfo className="text-2xl flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-heading text-white mb-2">Information</h2>
              <p className="text-regular">{error}</p>
              {existingBet && (
                <button
                  onClick={() => router.push('/betting/history')}
                  className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-neutral-900 rounded-lg font-bold transition-colors"
                >
                  Voir mon pari
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const potentialGain = calculatePotentialGain();
  const isSelectionComplete = selection[BetPosition.FIRST] && selection[BetPosition.SECOND] && selection[BetPosition.THIRD];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-title text-center mb-2">Paris Sportifs</h1>
          {currentWeek && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="primary" size="md">
                Semaine {currentWeek.weekNumber}/{currentWeek.year}
              </Badge>
              <Badge variant="success" size="md">
                Ouvert
              </Badge>
            </div>
          )}
        </div>

        {/* Info card */}
        <Card className="p-4 mb-6">
          <div className="flex items-start gap-3">
            <MdInfo className="text-primary-500 text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-bold text-white mb-2">Comment ça marche ?</h3>
              <ul className="text-sub text-neutral-300 space-y-1 list-disc list-inside">
                <li>Choisissez 3 compétiteurs pour le podium (1er, 2ème, 3ème)</li>
                <li>Optionnel : Appliquez un boost x2 sur un compétiteur</li>
                <li>Gagnez des points pour chaque prédiction correcte</li>
                <li>Bonus x2 si vous prédisez le podium complet !</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Potential gain */}
        {potentialGain > 0 && (
          <Card variant="primary" className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdTrendingUp className="text-2xl" />
                <span className="text-bold">Gains potentiels</span>
              </div>
              <div className="text-right">
                <div className="text-statistic text-primary-500 font-bold">
                  {potentialGain.toFixed(2)} pts
                </div>
                <div className="text-sub text-neutral-300">
                  (x2 si podium complet)
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error message */}
        {error && !existingBet && (
          <Card variant="error" className="p-4 mb-6">
            <p className="text-regular">{error}</p>
          </Card>
        )}

        {/* Podium selector */}
        <PodiumSelector
          competitors={odds}
          onSelectionChange={handleSelectionChange}
          disabled={isSubmitting}
        />

        {/* Submit button */}
        {isSelectionComplete && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-800 border-t border-neutral-700">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full max-w-4xl mx-auto px-6 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-900 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-900"></div>
                  Placement en cours...
                </>
              ) : (
                <>Valider mon pari</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceBetPage;
