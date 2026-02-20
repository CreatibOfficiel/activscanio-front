"use client";

import { FC } from "react";
import { Duel, DuelStatus } from "@/app/models/Duel";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import DuelCountdown from "./DuelCountdown";

interface DuelCardProps {
  duel: Duel;
  currentUserId?: string;
  onAccept?: (duelId: string) => void;
  onDecline?: (duelId: string) => void;
  onCancel?: (duelId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<DuelStatus, { label: string; variant: "default" | "primary" | "success" | "error" | "warning" | "gold" | "silver" | "bronze" }> = {
  [DuelStatus.PENDING]: { label: "En attente", variant: "warning" },
  [DuelStatus.ACCEPTED]: { label: "En cours", variant: "primary" },
  [DuelStatus.RESOLVED]: { label: "Termine", variant: "success" },
  [DuelStatus.CANCELLED]: { label: "Annule", variant: "default" },
  [DuelStatus.DECLINED]: { label: "Refuse", variant: "error" },
};

function formatName(user?: { firstName: string; lastName: string }): string {
  if (!user) return "???";
  return `${user.firstName} ${user.lastName.charAt(0)}.`;
}

const DuelCard: FC<DuelCardProps> = ({
  duel,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  compact = false,
}) => {
  const { label, variant } = statusConfig[duel.status];
  const isChallenger = currentUserId != null && duel.challengerUser?.clerkId === currentUserId;
  const isChallenged = currentUserId != null && duel.challengedUser?.clerkId === currentUserId;

  const myInternalId = isChallenger ? duel.challengerUserId : isChallenged ? duel.challengedUserId : undefined;
  const isWinner = myInternalId != null && duel.winnerUserId === myInternalId;
  const showActions =
    isChallenged && duel.status === DuelStatus.PENDING && onAccept && onDecline;
  const showCancel =
    isChallenger && duel.status === DuelStatus.PENDING && onCancel;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        {/* Players */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {duel.challengerUser?.profilePictureUrl ? (
              <img
                src={duel.challengerUser.profilePictureUrl}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-700" />
            )}
            <span className="text-sm font-medium text-white truncate">
              {formatName(duel.challengerUser)}
            </span>
          </div>

          <span className="text-neutral-500 text-xs">vs</span>

          <div className="flex items-center gap-1.5">
            {duel.challengedUser?.profilePictureUrl ? (
              <img
                src={duel.challengedUser.profilePictureUrl}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-700" />
            )}
            <span className="text-sm font-medium text-white truncate">
              {formatName(duel.challengedUser)}
            </span>
          </div>
        </div>

        {/* Stake + Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-bold text-primary-400">{duel.stake} pts</span>
          <Badge variant={variant} size="sm">
            {label}
          </Badge>
        </div>
      </div>

      {/* Result row for resolved duels */}
      {duel.status === DuelStatus.RESOLVED && currentUserId && (
        <div
          className={`mt-2 pt-2 border-t border-neutral-700 text-sm font-medium ${
            isWinner ? "text-success-500" : "text-error-500"
          }`}
        >
          {isWinner ? `+${duel.stake} pts` : `-${duel.stake} pts`}
        </div>
      )}

      {/* Countdown for active duels */}
      {(duel.status === DuelStatus.PENDING || duel.status === DuelStatus.ACCEPTED) && !compact && (
        <div className="mt-2">
          <DuelCountdown
            expiresAt={duel.expiresAt}
            label={duel.status === DuelStatus.PENDING ? "Accepter avant" : "Course avant"}
            compact
          />
        </div>
      )}

      {/* Action buttons */}
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
            Annuler le duel
          </button>
        </div>
      )}
    </Card>
  );
};

export default DuelCard;
