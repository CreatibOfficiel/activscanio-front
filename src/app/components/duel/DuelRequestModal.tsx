"use client";

import { FC, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import DuelCountdown from "./DuelCountdown";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import { toast } from "sonner";

interface DuelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  duelId: string;
  challenger: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  stake: number;
  expiresAt: string;
  onResponded?: () => void;
}

const DuelRequestModal: FC<DuelRequestModalProps> = ({
  isOpen,
  onClose,
  duelId,
  challenger,
  stake,
  expiresAt,
  onResponded,
}) => {
  const { getToken } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const token = await getToken();
      if (!token) return;

      await DuelRepository.acceptDuel(duelId, token);
      toast.success(`Duel accepte ! ${stake} pts en jeu.`);
      onResponded?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error(message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsDeclining(true);
      const token = await getToken();
      if (!token) return;

      await DuelRepository.declineDuel(duelId, token);
      toast("Duel refuse");
      onResponded?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error(message);
    } finally {
      setIsDeclining(false);
    }
  };

  const challengerName = `${challenger.firstName} ${challenger.lastName.charAt(0)}.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdropClick={false}>
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Challenger avatar */}
        {challenger.profilePictureUrl ? (
          <img
            src={challenger.profilePictureUrl}
            alt={challengerName}
            className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center text-3xl">
            ?
          </div>
        )}

        <div className="text-center">
          <p className="text-heading text-white">{challengerName}</p>
          <p className="text-regular text-neutral-400">te defie !</p>
        </div>

        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl px-6 py-3 text-center">
          <p className="text-statistic text-primary-400">{stake} pts</p>
          <p className="text-sub text-neutral-400">en jeu</p>
        </div>

        <DuelCountdown expiresAt={expiresAt} label="Temps pour repondre" />

        <div className="w-full flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            loading={isDeclining}
            disabled={isAccepting}
            onClick={handleDecline}
          >
            Refuser
          </Button>
          <Button
            variant="primary"
            fullWidth
            loading={isAccepting}
            disabled={isDeclining}
            onClick={handleAccept}
          >
            Accepter
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DuelRequestModal;
