"use client";

import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button, Card, Spinner, PageHeader } from '@/app/components/ui';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { LiveBettingRepository } from '@/app/repositories/LiveBettingRepository';
import { CompetitorOdds, BettorRanking } from '@/app/models/CompetitorOdds';
import { LiveBet, LiveBetStatus } from '@/app/models/LiveBet';
import LiveCompetitorPicker from '@/app/components/live-betting/LiveCompetitorPicker';
import DetectionConfirm from '@/app/components/live-betting/DetectionConfirm';
import LiveBetCard from '@/app/components/live-betting/LiveBetCard';
import { MdCameraAlt } from 'react-icons/md';
import { formatOdds } from '@/app/utils/formatters';
import { useSocket } from '@/app/hooks/useSocket';
import { getCurrentSeasonNumber } from '@/app/utils/season-utils';

type Step = 'pick' | 'photo' | 'detecting' | 'confirm' | 'active' | 'resolved';

const CreateLiveBetPage: FC = () => {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const { socket, isConnected } = useSocket(userId ?? undefined);

  const [step, setStep] = useState<Step>('pick');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [competitors, setCompetitors] = useState<CompetitorOdds[]>([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [liveBet, setLiveBet] = useState<LiveBet | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load competitors with odds + user ranking
  useEffect(() => {
    const load = async () => {
      try {
        const odds = await BettingRepository.getCurrentWeekOdds();
        setCompetitors(odds);

        // Load user's current season points
        const now = new Date();
        const rankingsData = await BettingRepository.getMonthlyRankings(
          getCurrentSeasonNumber(),
          now.getFullYear(),
        );
        if (userId) {
          const myRanking = rankingsData.rankings.find(
            (r: BettorRanking) => r.userId === userId,
          );
          setUserPoints(myRanking?.totalPoints ?? 0);
        }
      } catch (err) {
        console.error('Error loading odds:', err);
        setError('Impossible de charger les cotes');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  // Listen for detection WebSocket events
  useEffect(() => {
    if (!socket || !isConnected || !liveBet) return;

    const handleDetected = (data: {
      liveBetId: string;
      status: string;
      detectedCharacters: LiveBet['detectedCharacters'];
      detectionExpiresAt: string;
    }) => {
      if (data.liveBetId !== liveBet.id) return;

      setLiveBet((prev) =>
        prev
          ? {
              ...prev,
              status: data.status as LiveBetStatus,
              detectedCharacters: data.detectedCharacters,
              detectionExpiresAt: data.detectionExpiresAt,
            }
          : prev,
      );

      if (data.status === LiveBetStatus.ACTIVE) {
        setStep('active');
      } else if (data.detectedCharacters) {
        setStep('confirm');
      }
    };

    const handleResolved = (data: { liveBetId: string; status: string; pointsEarned: number | null }) => {
      if (data.liveBetId !== liveBet.id) return;
      setLiveBet((prev) =>
        prev
          ? { ...prev, status: data.status as LiveBetStatus, pointsEarned: data.pointsEarned }
          : prev,
      );
      setStep('resolved');
    };

    socket.on('liveBet:detected', handleDetected);
    socket.on('liveBet:resolved', handleResolved);
    return () => {
      socket.off('liveBet:detected', handleDetected);
      socket.off('liveBet:resolved', handleResolved);
    };
  }, [socket, isConnected, liveBet]);

  const handlePhotoCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompetitorId) return;

    setIsSubmitting(true);
    setError(null);
    setStep('detecting');

    try {
      const token = await getToken();
      if (!token) throw new Error('Non authentifié');

      const result = await LiveBettingRepository.createLiveBet(
        selectedCompetitorId,
        file,
        token,
      );
      setLiveBet(result);

      // If detection already completed synchronously
      if (result.status === LiveBetStatus.ACTIVE) {
        setStep('active');
      } else if (result.detectedCharacters) {
        setStep('confirm');
      }
      // Otherwise wait for WS event
    } catch (err) {
      console.error('Error creating live bet:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du pari');
      setStep('pick');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCompetitorId, getToken]);

  const handleConfirm = useCallback(async (competitorIds: string[]) => {
    if (!liveBet) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Non authentifié');

      const updated = await LiveBettingRepository.confirmDetection(
        liveBet.id,
        competitorIds,
        token,
      );
      setLiveBet(updated);
      setStep('active');
    } catch (err) {
      console.error('Error confirming detection:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la confirmation');
    } finally {
      setIsSubmitting(false);
    }
  }, [liveBet, getToken]);

  const selectedCompetitor = competitors.find(
    (c) => c.competitorId === selectedCompetitorId,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <PageHeader
          title="Paris en direct"
          backHref="/betting/live"
          backLabel="Retour"
        />

        {error && (
          <Card className="p-3 border-red-500/50 bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {/* Step 1: Pick a winner */}
        {step === 'pick' && (
          <>
            {userPoints > 0 && (
              <p className="text-xs text-neutral-500 text-right">
                Vos points : <span className="text-neutral-300 font-medium">{userPoints}</span>
              </p>
            )}

            <LiveCompetitorPicker
              competitors={competitors}
              selectedId={selectedCompetitorId}
              onSelect={setSelectedCompetitorId}
              userPoints={userPoints}
            />

            {selectedCompetitorId && selectedCompetitor && (
              <Card className="p-4 border-primary-500/50 bg-primary-500/5">
                <div className="text-center space-y-3">
                  <p className="text-sm text-neutral-300">
                    Cote : <span className="text-primary-400 font-bold text-lg">
                      {formatOdds(selectedCompetitor.oddFirst)}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    Gagne = +{formatOdds(selectedCompetitor.oddFirst)} pts | Perd = -{formatOdds(selectedCompetitor.oddFirst)} pts
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />

                  <Button
                    variant="primary"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <MdCameraAlt className="text-lg" />
                    Valider avec photo
                  </Button>

                  <p className="text-xs text-neutral-500">
                    Prenez en photo l&apos;écran de sélection des karts
                  </p>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Step 2: Detecting */}
        {step === 'detecting' && (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Spinner size="lg" />
              <div>
                <p className="text-bold text-white">Analyse de la photo...</p>
                <p className="text-sm text-neutral-400 mt-1">
                  L&apos;IA détecte les joueurs sur l&apos;écran de sélection
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Confirm detections */}
        {step === 'confirm' && liveBet?.detectedCharacters && liveBet.detectionExpiresAt && (
          <DetectionConfirm
            detectedCharacters={liveBet.detectedCharacters}
            detectionExpiresAt={liveBet.detectionExpiresAt}
            onConfirm={handleConfirm}
            onCancel={() => router.push('/betting/live')}
            isLoading={isSubmitting}
          />
        )}

        {/* Step 4: Active - waiting for race */}
        {step === 'active' && liveBet && (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                <MdCameraAlt className="text-3xl text-primary-400" />
              </div>
              <div>
                <p className="text-bold text-white">Pari validé !</p>
                <p className="text-sm text-neutral-400 mt-1">
                  En attente de la prochaine course...
                </p>
              </div>
              <LiveBetCard liveBet={liveBet} />
              <Button
                variant="secondary"
                onClick={() => router.push('/betting/live')}
              >
                Retour aux paris en direct
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Resolved */}
        {step === 'resolved' && liveBet && (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                liveBet.status === LiveBetStatus.WON ? 'bg-green-500/20' :
                liveBet.status === LiveBetStatus.LOST ? 'bg-red-500/20' : 'bg-neutral-700'
              }`}>
                {liveBet.status === LiveBetStatus.WON ? '🎉' : liveBet.status === LiveBetStatus.LOST ? '😔' : '🔄'}
              </div>
              <div>
                <p className="text-bold text-white text-lg">
                  {liveBet.status === LiveBetStatus.WON ? 'Gagné !' :
                   liveBet.status === LiveBetStatus.LOST ? 'Perdu' : 'Annulé'}
                </p>
                {liveBet.pointsEarned != null && (
                  <p className={`text-xl font-bold mt-1 ${
                    liveBet.pointsEarned >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {liveBet.pointsEarned >= 0 ? '+' : ''}{formatOdds(liveBet.pointsEarned)} pts
                  </p>
                )}
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/betting/live')}
              >
                Retour aux paris en direct
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateLiveBetPage;
