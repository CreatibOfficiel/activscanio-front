"use client";

import { FC, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Modal from "../ui/Modal";
import UserAvatar from "../ui/UserAvatar";
import DuelCountdown from "./DuelCountdown";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import { MdClose, MdCheck } from "react-icons/md";
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
  stakeEmoji?: string;
  stakeLabel?: string;
  conditionText?: string;
  expiresAt: string;
  onResponded?: () => void;
}

const DuelRequestModal: FC<DuelRequestModalProps> = ({
  isOpen,
  onClose,
  duelId,
  challenger,
  stakeEmoji,
  stakeLabel,
  conditionText,
  expiresAt,
  onResponded,
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const token = await getToken();
      if (!token) return;

      await DuelRepository.acceptDuel(duelId, token);
      toast.success(`Défi accepté ! La course de la semaine tranchera.`);
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
      toast("Défi refusé");
      onResponded?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error(message);
    } finally {
      setIsDeclining(false);
    }
  };

  const busy = isAccepting || isDeclining;
  const challengerName = `${challenger.firstName} ${challenger.lastName.charAt(0)}.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdropClick={false}>
      <div className="relative flex flex-col items-center animate-duelIn">
        {/* Quiet close */}
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Fermer"
          className="absolute -right-1 -top-1 grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition disabled:opacity-40"
        >
          <MdClose size={18} />
        </button>

        {/* Eyebrow */}
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-primary-400">
          ⚔️ Un duel
        </p>

        {/* VS row */}
        <div className="mt-5 flex items-center justify-center gap-3">
          {/* Challenger — glowing aggressor */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary-500/30 blur-lg" />
              <span className="relative block rounded-full ring-2 ring-primary-500">
                <UserAvatar
                  src={challenger.profilePictureUrl}
                  name={challengerName}
                  size="xl"
                />
              </span>
            </div>
            <span className="text-sm font-semibold text-white">{challengerName}</span>
          </div>

          {/* VS badge */}
          <div className="z-10 -mx-2 shrink-0">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-neutral-800 text-xs font-black italic tracking-tight text-primary-400 ring-1 ring-neutral-700 shadow-lg shadow-primary-500/20">
              VS
            </span>
          </div>

          {/* You — muted, not in the fight yet */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="block rounded-full opacity-60 saturate-50 ring-2 ring-neutral-700">
              <UserAvatar
                src={user?.imageUrl}
                name={user?.firstName ?? "Toi"}
                size="xl"
              />
            </span>
            <span className="text-sm font-medium text-neutral-400">Toi</span>
          </div>
        </div>

        {/* Headline */}
        <h2 className="mt-5 text-center text-xl font-bold text-white">
          <span className="text-primary-400">{challengerName}</span> te défie en duel
        </h2>

        {/* Stake hero */}
        <div className="mt-5 flex w-full flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-primary-500/10 to-transparent px-4 py-5 ring-1 ring-primary-500/30 shadow-[0_0_40px_-12px] shadow-primary-500/40">
          <span className="text-5xl leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {stakeEmoji ?? "🎯"}
          </span>
          {stakeLabel && (
            <p className="text-base font-semibold text-white">{stakeLabel}</p>
          )}
          <p className="text-xs uppercase tracking-widest text-primary-400/80">
            en jeu
          </p>
        </div>

        {/* Condition — "the rule", not fine print */}
        {conditionText && (
          <div className="mt-3 flex w-full gap-2.5 rounded-xl bg-amber-500/10 px-3.5 py-3 ring-1 ring-amber-500/25">
            <span className="text-base leading-none">⚡</span>
            <p className="text-sm leading-snug text-amber-200/90">
              <span className="font-semibold text-amber-200">La règle :</span>{" "}
              {conditionText}
            </p>
          </div>
        )}

        {/* Context */}
        <p className="mt-4 text-center text-xs text-neutral-400">
          La course de la semaine vous départage
        </p>

        {/* Actions */}
        <div className="mt-5 w-full space-y-2">
          <button
            onClick={handleAccept}
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 text-base font-bold text-neutral-900 shadow-lg shadow-primary-500/25 transition hover:bg-primary-400 active:scale-[0.97] disabled:opacity-50"
          >
            {isAccepting ? (
              "Acceptation…"
            ) : (
              <>
                <MdCheck size={20} />
                Accepter le duel
              </>
            )}
          </button>
          <button
            onClick={handleDecline}
            disabled={busy}
            className="h-11 w-full rounded-2xl text-sm font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-neutral-200 active:scale-[0.98] disabled:opacity-50"
          >
            {isDeclining ? "Refus…" : "Refuser"}
          </button>
        </div>

        {/* Countdown — low emphasis */}
        <div className="mt-4">
          <DuelCountdown expiresAt={expiresAt} label="pour répondre" compact />
        </div>
      </div>
    </Modal>
  );
};

export default DuelRequestModal;
