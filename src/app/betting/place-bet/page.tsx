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
import { Card, Badge, Button, PageHeader } from '@/app/components/ui';
import { MdTrendingUp, MdInfo } from 'react-icons/md';
import { toast } from 'sonner';

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

  const [currentWeek, setCurrentWeek] = useState<BettingWeek | null>(null);
  const [odds, setOdds] = useState<CompetitorOdds[]>([]);
  const [selection, setSelection] = useState<PodiumSelection>({});
  const [boostedCompetitorId, setBoostedCompetitorId] = useState<string | undefined>();
  const [existingBet, setExistingBet] = useState(false);
  const [boostAvailable, setBoostAvailable] = useState(true);

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

      // Check if week is open for betting
      if (week.status === BettingWeekStatus.CALIBRATION) {
        setError(
          "C'est la première semaine du mois : période de calibration ELO. Les paris ouvriront la semaine prochaine."
        );
        setIsLoading(false);
        return;
      }

      if (week.status !== BettingWeekStatus.OPEN) {
        setError('Les paris sont fermés pour cette semaine.');
        setIsLoading(false);
        return;
      }

      // Load odds
      const oddsData = await BettingRepository.getCurrentWeekOdds();
      setOdds(oddsData);

      // Check if user already has a bet and load boost availability
      if (user) {
        const token = await getToken({ skipCache: true });
        if (token) {
          const bet = await BettingRepository.getCurrentBet(user.id, token);
          if (bet) {
            setExistingBet(true);
            setError('Vous avez déjà placé un pari pour cette semaine.');
          }

          // Load boost availability
          try {
            const boostStatus = await BettingRepository.getBoostAvailability(token);
            setBoostAvailable(boostStatus.available);
          } catch (err) {
            console.error('Error loading boost availability:', err);
            // Default to available on error
            setBoostAvailable(true);
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

  const getOddForPosition = (competitor: CompetitorOdds, position: BetPosition): number => {
    if (position === BetPosition.FIRST) return competitor.oddFirst;
    if (position === BetPosition.SECOND) return competitor.oddSecond;
    return competitor.oddThird;
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

      let points = getOddForPosition(competitor, position);

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

      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Token non disponible');
      }

      await BettingRepository.placeBet(
        user.id,
        {
          bettingWeekId: currentWeek!.id,
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

      toast.success('Pari placé avec succès ! 🎉');
      router.push('/betting/history');
    } catch (err) {
      console.error('Error placing bet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du placement du pari.';
      toast.error(errorMessage);
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

  // Show error if week is not open (calibration, closed) or user already has a bet
  const isWeekNotBettable =
    !currentWeek ||
    currentWeek.status === BettingWeekStatus.CALIBRATION ||
    currentWeek.status !== BettingWeekStatus.OPEN;

  if (error && (isWeekNotBettable || existingBet)) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <Card variant="error" className="p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <MdInfo className="text-2xl flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-heading text-white mb-2">Information</h2>
              <p className="text-regular">{error}</p>
              {existingBet && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/betting/history?tab=mine')}
                  className="mt-4"
                >
                  Voir mes paris
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const potentialGain = calculatePotentialGain();
  const selectedCount = Object.values(selection).filter(Boolean).length;
  const isSelectionComplete = selection[BetPosition.FIRST] && selection[BetPosition.SECOND] && selection[BetPosition.THIRD];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          variant="flow"
          title="Placer un pari"
          backHref="/betting"
          progress={{ current: selectedCount, total: 3 }}
          rightAction={
            currentWeek && (
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="md">
                  S{currentWeek.seasonWeekNumber}
                </Badge>
                {currentWeek.status === BettingWeekStatus.CALIBRATION ? (
                  <Badge variant="warning" size="md">
                    Calibration
                  </Badge>
                ) : currentWeek.status === BettingWeekStatus.OPEN ? (
                  <Badge variant="success" size="md">
                    Ouvert
                  </Badge>
                ) : (
                  <Badge variant="default" size="md">
                    Fermé
                  </Badge>
                )}
              </div>
            )
          }
        />

        {/* Info card */}
        <Card className="p-4 mb-6">
          <div className="flex items-start gap-3">
            <MdInfo className="text-primary-500 text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-bold text-white mb-2">Comment ça marche ?</h3>
              <ul className="text-sub text-neutral-300 space-y-1 list-disc list-inside">
                <li>Choisissez 3 pilotes pour le podium (1er, 2ème, 3ème)</li>
                <li>Optionnel : Appliquez un boost x2 sur un pilote</li>
                <li>Gagnez des points pour chaque prédiction correcte</li>
                <li>Bonus x2 si vous prédisez le podium complet !</li>
              </ul>
              {!boostAvailable && (
                <div className="mt-3 p-2 bg-warning-500/10 border border-warning-500/30 rounded-lg">
                  <p className="text-sub text-warning-500">
                    ⚠️ Vous avez déjà utilisé votre boost mensuel. Il sera réinitialisé le 1er du mois prochain.
                  </p>
                </div>
              )}
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
          boostAvailable={boostAvailable}
        />

        {/* Submit button */}
        {isSelectionComplete && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-800 border-t border-neutral-700 z-50">
            <div className="max-w-4xl mx-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Valider mon pari
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceBetPage;
