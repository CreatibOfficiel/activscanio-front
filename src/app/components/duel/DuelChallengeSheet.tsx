"use client";

import { FC, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Button from "../ui/Button";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import { toast } from "sonner";

interface DuelChallengeFormProps {
  competitorId: string;
  competitorName: string;
  competitorAvatar?: string;
  userPoints?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const STAKE_OPTIONS = [5, 10, 25] as const;

const DuelChallengeForm: FC<DuelChallengeFormProps> = ({
  competitorId,
  competitorName,
  competitorAvatar,
  userPoints,
  onSuccess,
  onCancel,
}) => {
  const { getToken } = useAuth();
  const [selectedStake, setSelectedStake] = useState<number | null>(10);
  const [isLoading, setIsLoading] = useState(false);

  const points = userPoints ?? 0;

  // Auto-select the best affordable stake
  useEffect(() => {
    if (userPoints === undefined) return;
    if (selectedStake !== null && selectedStake <= points) return;
    const affordable = [...STAKE_OPTIONS].reverse().find((s) => s <= points);
    setSelectedStake(affordable ?? null);
  }, [userPoints, points, selectedStake]);

  const handleChallenge = async () => {
    if (selectedStake === null) return;
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      await DuelRepository.createDuel(competitorId, selectedStake, token);
      toast.success(`Duel envoye a ${competitorName} ! ${selectedStake} pts en jeu.`);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la creation du duel";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = selectedStake !== null && selectedStake <= points;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="self-start flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <span>&larr;</span>
        <span>Retour</span>
      </button>

      {/* Opponent info */}
      <div className="flex flex-col items-center gap-2">
        {competitorAvatar ? (
          <img
            src={competitorAvatar}
            alt={competitorName}
            className="w-16 h-16 rounded-full object-cover border-2 border-neutral-600"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-2xl">
            ?
          </div>
        )}
        <p className="text-bold text-white">{competitorName}</p>
      </div>

      {/* Stake selection */}
      <div className="w-full">
        <p className="text-sub text-neutral-400 mb-2 text-center">Choisis ta mise</p>
        <div className="flex gap-2">
          {STAKE_OPTIONS.map((stake) => {
            const affordable = stake <= points;
            return (
              <button
                key={stake}
                onClick={() => affordable && setSelectedStake(stake)}
                disabled={!affordable}
                className={`flex-1 py-3 rounded-lg text-center font-bold transition-all ${
                  !affordable
                    ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                    : selectedStake === stake
                      ? "bg-primary-500 text-neutral-900 ring-2 ring-primary-400"
                      : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                }`}
              >
                {stake} pts
              </button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500 text-center mt-2">
          Tu as {points} pts ce mois
        </p>
      </div>

      {/* Info */}
      <p className="text-sub text-neutral-500 text-center">
        L&apos;adversaire a 1 minute pour accepter. La prochaine course tranche.
      </p>

      {/* Submit */}
      <Button
        variant="primary"
        fullWidth
        loading={isLoading}
        onClick={handleChallenge}
        disabled={!canSubmit}
      >
        {canSubmit
          ? `Defier pour ${selectedStake} pts`
          : "Pas assez de points"}
      </Button>
    </div>
  );
};

export default DuelChallengeForm;
