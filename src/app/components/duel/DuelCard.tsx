"use client";

import { FC, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Duel,
  DuelStatus,
  DuelConditionType,
  StakeType,
} from "@/app/models/Duel";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import UserAvatar from "../ui/UserAvatar";
import DuelCountdown from "./DuelCountdown";
import { toast } from "sonner";

interface DuelCardProps {
  duel: Duel;
  currentUserId?: string;
  onAccept?: (duelId: string) => void;
  onDecline?: (duelId: string) => void;
  onCancel?: (duelId: string) => void;
  onChange?: () => void;
  compact?: boolean;
}

const statusConfig: Record<
  DuelStatus,
  {
    label: string;
    variant: "default" | "primary" | "success" | "error" | "warning" | "gold" | "silver" | "bronze";
  }
> = {
  [DuelStatus.PENDING]: { label: "En attente", variant: "warning" },
  [DuelStatus.ACCEPTED]: { label: "En cours", variant: "primary" },
  [DuelStatus.RESOLVED]: { label: "Terminé", variant: "success" },
  [DuelStatus.AWAITING_SETTLEMENT]: { label: "À régler", variant: "warning" },
  [DuelStatus.SETTLED]: { label: "Réglé ✓", variant: "success" },
  [DuelStatus.CANCELLED]: { label: "Annulé", variant: "default" },
  [DuelStatus.DECLINED]: { label: "Refusé", variant: "error" },
};

function formatName(user?: { firstName: string; lastName: string }): string {
  if (!user) return "???";
  return `${user.firstName} ${user.lastName.charAt(0)}.`;
}

function stakeLabel(duel: Duel): string {
  const emoji = duel.stakeEmoji ?? "🎯";
  if (duel.stakeType === StakeType.CUSTOM && duel.stakeLabel) {
    return `${emoji} ${duel.stakeLabel}`;
  }
  return emoji;
}

function conditionLine(duel: Duel): string | null {
  if (!duel.conditionType || duel.conditionType === DuelConditionType.RANK_WINS) {
    return null;
  }
  const v = duel.conditionValue ?? 0;
  switch (duel.conditionType) {
    case DuelConditionType.MARGIN_GREATER:
      return `Le challenger gagne si écart > ${v} pts`;
    case DuelConditionType.MARGIN_BETWEEN:
      return `Écart ≥ ${v} pts entre les deux`;
    case DuelConditionType.EXACT_TIE:
      return `Pari sur une égalité`;
    default:
      return null;
  }
}

const DuelCard: FC<DuelCardProps> = ({
  duel,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  onChange,
  compact = false,
}) => {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { label, variant } = statusConfig[duel.status];
  const isChallenger =
    currentUserId != null && duel.challengerUser?.clerkId === currentUserId;
  const isChallenged =
    currentUserId != null && duel.challengedUser?.clerkId === currentUserId;

  const myInternalId = isChallenger
    ? duel.challengerUserId
    : isChallenged
      ? duel.challengedUserId
      : undefined;
  const isWinner = myInternalId != null && duel.winnerUserId === myInternalId;
  const isLoser = myInternalId != null && duel.loserUserId === myInternalId;

  const showActions =
    isChallenged && duel.status === DuelStatus.PENDING && onAccept && onDecline;
  const showCancel =
    isChallenger && duel.status === DuelStatus.PENDING && onCancel;
  const showPayAction =
    isLoser && duel.status === DuelStatus.AWAITING_SETTLEMENT;
  const showUndo = isLoser && duel.status === DuelStatus.SETTLED;

  const condition = conditionLine(duel);
  const counterpartName = isWinner
    ? formatName(duel.loserUserId === duel.challengerUserId ? duel.challengerUser : duel.challengedUser)
    : formatName(duel.winnerUserId === duel.challengerUserId ? duel.challengerUser : duel.challengedUser);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setIsUploading(true);
      const token = await getToken();
      if (!token) return;
      await DuelRepository.uploadProof(duel.id, file, token);
      toast.success("Preuve envoyée, dette réglée !");
      onChange?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'envoi de la preuve";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUndo = async () => {
    try {
      setIsUploading(true);
      const token = await getToken();
      if (!token) return;
      await DuelRepository.undoProof(duel.id, token);
      toast.success("Règlement annulé");
      onChange?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'annulation";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        {/* Players */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <UserAvatar
              src={duel.challengerUser?.profilePictureUrl}
              name={formatName(duel.challengerUser)}
              size="xs"
            />
            <span className="text-sm font-medium text-white truncate">
              {formatName(duel.challengerUser)}
            </span>
          </div>

          <span className="text-neutral-500 text-xs">vs</span>

          <div className="flex items-center gap-1.5">
            <UserAvatar
              src={duel.challengedUser?.profilePictureUrl}
              name={formatName(duel.challengedUser)}
              size="xs"
            />
            <span className="text-sm font-medium text-white truncate">
              {formatName(duel.challengedUser)}
            </span>
          </div>
        </div>

        {/* Stake + Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-bold text-primary-400">{stakeLabel(duel)}</span>
          <Badge variant={variant} size="sm">
            {label}
          </Badge>
        </div>
      </div>

      {/* Condition line */}
      {condition && (
        <p className="mt-1.5 text-xs text-neutral-400">⚡ {condition}</p>
      )}

      {/* Result row for resolved/settled duels */}
      {(duel.status === DuelStatus.AWAITING_SETTLEMENT ||
        duel.status === DuelStatus.SETTLED) &&
        currentUserId && (isWinner || isLoser) && (
          <div
            className={`mt-2 pt-2 border-t border-neutral-700 text-sm font-medium ${
              isWinner ? "text-success-500" : "text-error-500"
            }`}
          >
            {isWinner
              ? `${counterpartName} te doit ${stakeLabel(duel)}`
              : `Tu dois ${stakeLabel(duel)} à ${counterpartName}`}
          </div>
        )}

      {/* Proof thumbnail when settled */}
      {duel.status === DuelStatus.SETTLED && duel.proofPhotoUrl && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={duel.proofPhotoUrl}
            alt="Preuve de paiement"
            className="rounded-lg max-h-40 w-auto object-cover border border-neutral-700"
          />
        </div>
      )}

      {/* Countdown for active duels */}
      {(duel.status === DuelStatus.PENDING ||
        duel.status === DuelStatus.ACCEPTED) &&
        !compact && (
          <div className="mt-2">
            <DuelCountdown
              expiresAt={
                duel.status === DuelStatus.PENDING
                  ? duel.expiresAt
                  : duel.resolveDeadline ?? duel.expiresAt
              }
              label={
                duel.status === DuelStatus.PENDING
                  ? "Accepter avant"
                  : "Course avant"
              }
              compact
            />
          </div>
        )}

      {/* Accept / decline */}
      {showActions && (
        <div className="mt-2 pt-2 border-t border-neutral-700 flex gap-2">
          <button
            onClick={() => onAccept(duel.id)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-success-500 hover:bg-success-600 text-white text-sm font-bold transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={() => onDecline(duel.id)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold transition-colors"
          >
            Refuser
          </button>
        </div>
      )}

      {showCancel && (
        <div className="mt-2 pt-2 border-t border-neutral-700">
          <button
            onClick={() => onCancel(duel.id)}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Annuler le défi
          </button>
        </div>
      )}

      {/* Pay action (loser settles with photo proof) */}
      {showPayAction && (
        <div className="mt-2 pt-2 border-t border-neutral-700">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            onClick={handlePickFile}
            disabled={isUploading}
            className="w-full px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-neutral-900 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isUploading ? "Envoi…" : "J'ai payé 📸"}
          </button>
        </div>
      )}

      {showUndo && (
        <div className="mt-2">
          <button
            onClick={handleUndo}
            disabled={isUploading}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
          >
            Annuler le règlement
          </button>
        </div>
      )}
    </Card>
  );
};

export default DuelCard;
