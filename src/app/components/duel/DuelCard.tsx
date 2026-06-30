"use client";

import { FC, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Duel,
  DuelStatus,
  DuelConditionType,
  StakeType,
  DuelUser,
} from "@/app/models/Duel";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import Card from "../ui/Card";
import UserAvatar from "../ui/UserAvatar";
import ImageLightbox from "../ui/ImageLightbox";
import DuelCountdown from "./DuelCountdown";
import { MdZoomIn } from "react-icons/md";
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
  { label: string; dot: string; text: string }
> = {
  [DuelStatus.PENDING]: { label: "En attente", dot: "bg-amber-400", text: "text-amber-300" },
  [DuelStatus.ACCEPTED]: { label: "En cours", dot: "bg-primary-400", text: "text-primary-300" },
  [DuelStatus.RESOLVED]: { label: "Terminé", dot: "bg-success-500", text: "text-success-500" },
  [DuelStatus.AWAITING_SETTLEMENT]: { label: "À régler", dot: "bg-orange-400", text: "text-orange-300" },
  [DuelStatus.SETTLED]: { label: "Réglé", dot: "bg-success-500", text: "text-success-500" },
  [DuelStatus.CANCELLED]: { label: "Annulé", dot: "bg-neutral-500", text: "text-neutral-400" },
  [DuelStatus.DECLINED]: { label: "Refusé", dot: "bg-neutral-500", text: "text-neutral-400" },
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

interface PlayerProps {
  user?: DuelUser;
  won: boolean;
  resolved: boolean;
  align: "start" | "end";
}

const Player: FC<PlayerProps> = ({ user, won, resolved, align }) => {
  const lost = resolved && !won;
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 ${
        align === "end" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <div className="relative">
        <span
          className={`block rounded-full ${
            won
              ? "ring-2 ring-success-500"
              : lost
                ? "ring-2 ring-error-500/60 opacity-80"
                : "ring-2 ring-neutral-600"
          } ${won ? "scale-105" : ""}`}
        >
          <UserAvatar src={user?.profilePictureUrl} name={formatName(user)} size="md" />
        </span>
        {won && (
          <span className="absolute -right-1.5 -top-2 text-lg drop-shadow">👑</span>
        )}
      </div>
      <span
        className={`max-w-[96px] truncate text-sm font-semibold ${
          lost ? "text-neutral-400" : "text-neutral-100"
        }`}
      >
        {formatName(user)}
      </span>
      {resolved && (
        <span
          className={`text-[11px] font-semibold ${
            won ? "text-success-500" : "text-error-500"
          }`}
        >
          {won ? "▲ Gagné" : "▼ Défait"}
        </span>
      )}
    </div>
  );
};

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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const status = statusConfig[duel.status];
  const isChallenger =
    currentUserId != null && duel.challengerUser?.clerkId === currentUserId;
  const isChallenged =
    currentUserId != null && duel.challengedUser?.clerkId === currentUserId;

  const myInternalId = isChallenger
    ? duel.challengerUserId
    : isChallenged
      ? duel.challengedUserId
      : undefined;
  const isLoser = myInternalId != null && duel.loserUserId === myInternalId;

  const resolved =
    duel.status === DuelStatus.AWAITING_SETTLEMENT ||
    duel.status === DuelStatus.SETTLED;
  const settled = duel.status === DuelStatus.SETTLED;

  // Winner / loser users (by internal id)
  const winnerUser =
    duel.winnerUserId === duel.challengerUserId
      ? duel.challengerUser
      : duel.challengedUser;
  const loserUser =
    duel.loserUserId === duel.challengerUserId
      ? duel.challengerUser
      : duel.challengedUser;

  const challengerWon =
    resolved && duel.winnerUserId === duel.challengerUserId;
  const challengedWon =
    resolved && duel.winnerUserId === duel.challengedUserId;

  const showActions =
    isChallenged && duel.status === DuelStatus.PENDING && onAccept && onDecline;
  const showCancel =
    isChallenger && duel.status === DuelStatus.PENDING && onCancel;
  const showPayAction =
    isLoser && duel.status === DuelStatus.AWAITING_SETTLEMENT;
  const showUndo = isLoser && duel.status === DuelStatus.SETTLED;

  const condition = conditionLine(duel);

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

  const StatusPill = (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.dot} ${
          settled ? "shadow-[0_0_8px] shadow-success-500/50" : ""
        }`}
      />
      <span className={status.text}>
        {settled ? "✓ " : ""}
        {status.label}
      </span>
    </span>
  );

  return (
    <Card
      className={`relative overflow-hidden p-4 ${
        settled
          ? "border border-success-500/30 bg-gradient-to-b from-success-500/10 via-neutral-900 to-neutral-900"
          : ""
      }`}
    >
      {/* SETTLED — trophy headline */}
      {resolved ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-base font-bold text-neutral-50">
              <span>👑</span>
              <span className="truncate">{formatName(winnerUser)} a gagné</span>
            </h3>
            {StatusPill}
          </div>
          <p className="mt-0.5 text-sm text-neutral-400">
            contre{" "}
            <span className="text-neutral-300">{formatName(loserUser)}</span> ·{" "}
            <span className="text-primary-300">{stakeLabel(duel)}</span>
          </p>

          {/* Outcome avatars */}
          <div className="mt-3 flex items-center justify-center gap-8">
            <Player user={duel.challengerUser} won={challengerWon} resolved align="end" />
            <Player user={duel.challengedUser} won={challengedWon} resolved align="start" />
          </div>
        </>
      ) : (
        <>
          {/* ACTIVE / PENDING — VS split with center medallion */}
          <div className="flex justify-end">{StatusPill}</div>
          <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Player user={duel.challengerUser} won={false} resolved={false} align="end" />
            <div className="flex flex-col items-center gap-1">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-800 text-[11px] font-bold text-neutral-400 ring-1 ring-neutral-700">
                VS
              </span>
              <span className="whitespace-nowrap rounded-full bg-primary-500/15 px-2 py-0.5 text-xs font-medium text-primary-300">
                {stakeLabel(duel)}
              </span>
            </div>
            <Player user={duel.challengedUser} won={false} resolved={false} align="start" />
          </div>
        </>
      )}

      {/* Condition line */}
      {condition && (
        <p className="mt-2 text-center text-xs text-neutral-500">⚡ {condition}</p>
      )}

      {/* Debt line (single plain-language source) */}
      {resolved && (
        <>
          <div className="my-3 border-t border-dashed border-neutral-700/80" />
          <p className="text-sm font-medium text-neutral-300">
            💸{" "}
            <span className="text-neutral-200">{formatName(loserUser)}</span> doit{" "}
            <span className="text-primary-300">{stakeLabel(duel)}</span> à{" "}
            <span className="text-neutral-200">{formatName(winnerUser)}</span>
          </p>
        </>
      )}

      {/* Proof photo — hero, tap to enlarge, PAYÉ stamp */}
      {settled && duel.proofPhotoUrl && (
        <>
          <button
            onClick={() => setLightboxOpen(true)}
            className="group relative mt-3 block w-full overflow-hidden rounded-2xl ring-1 ring-neutral-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={duel.proofPhotoUrl}
              alt="Preuve de règlement"
              className="aspect-video w-full object-cover transition group-active:scale-[0.99]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950/60 to-transparent" />
            <span className="pointer-events-none absolute bottom-3 left-3 select-none rounded-md border-2 border-success-500/80 bg-neutral-900/30 px-2 py-0.5 text-sm font-black uppercase tracking-widest text-success-500 shadow-sm backdrop-blur-[1px] [transform:rotate(-8deg)]">
              Payé
            </span>
            <span className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-neutral-900/70 text-neutral-100 backdrop-blur transition group-hover:bg-neutral-900/90">
              <MdZoomIn size={20} />
            </span>
          </button>
          <p className="mt-2 text-sm text-neutral-400">
            📸 réglé par{" "}
            <span className="text-neutral-300">{formatName(loserUser)}</span>
          </p>
        </>
      )}

      {/* Countdown for active duels */}
      {(duel.status === DuelStatus.PENDING ||
        duel.status === DuelStatus.ACCEPTED) &&
        !compact && (
          <div className="mt-3">
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => onAccept(duel.id)}
            className="h-11 rounded-xl bg-success-500 hover:bg-success-600 text-white text-sm font-bold transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={() => onDecline(duel.id)}
            className="h-11 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-sm font-medium transition-colors"
          >
            Refuser
          </button>
        </div>
      )}

      {showCancel && (
        <div className="mt-3">
          <button
            onClick={() => onCancel(duel.id)}
            className="text-xs text-neutral-500 underline-offset-2 hover:underline"
          >
            Annuler le défi
          </button>
        </div>
      )}

      {/* Pay action (loser settles with photo proof) */}
      {showPayAction && (
        <>
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
            className="mt-3 h-11 w-full rounded-xl bg-primary-500 hover:bg-primary-600 text-neutral-900 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isUploading ? "Envoi…" : "J'ai payé 📸"}
          </button>
        </>
      )}

      {showUndo && (
        <div className="mt-2">
          <button
            onClick={handleUndo}
            disabled={isUploading}
            className="text-xs text-neutral-500 underline-offset-2 hover:underline disabled:opacity-50"
          >
            Annuler le règlement
          </button>
        </div>
      )}

      {settled && duel.proofPhotoUrl && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={duel.proofPhotoUrl}
          alt="Preuve de règlement"
        />
      )}
    </Card>
  );
};

export default DuelCard;
