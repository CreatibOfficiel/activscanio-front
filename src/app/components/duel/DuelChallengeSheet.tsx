"use client";

import { FC, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import { toast } from "sonner";

interface DuelChallengeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  competitorId: string;
  competitorName: string;
  competitorAvatar?: string;
}

const STAKE_OPTIONS = [5, 10, 25] as const;

const DuelChallengeSheet: FC<DuelChallengeSheetProps> = ({
  isOpen,
  onClose,
  competitorId,
  competitorName,
  competitorAvatar,
}) => {
  const { getToken } = useAuth();
  const [selectedStake, setSelectedStake] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);

  const handleChallenge = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      await DuelRepository.createDuel(competitorId, selectedStake, token);
      toast.success(`Duel envoye a ${competitorName} ! ${selectedStake} pts en jeu.`);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la creation du duel";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Defier" size="sm">
      <div className="flex flex-col items-center gap-4">
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
            {STAKE_OPTIONS.map((stake) => (
              <button
                key={stake}
                onClick={() => setSelectedStake(stake)}
                className={`flex-1 py-3 rounded-lg text-center font-bold transition-all ${
                  selectedStake === stake
                    ? "bg-primary-500 text-neutral-900 ring-2 ring-primary-400"
                    : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                }`}
              >
                {stake} pts
              </button>
            ))}
          </div>
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
        >
          Defier pour {selectedStake} pts
        </Button>
      </div>
    </Modal>
  );
};

export default DuelChallengeSheet;
