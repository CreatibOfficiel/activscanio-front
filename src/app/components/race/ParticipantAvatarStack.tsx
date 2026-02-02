"use client";

import { FC } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";

interface ParticipantInfo {
  competitor: Competitor;
  rank12: number;
  score: number;
}

interface Props {
  participants: ParticipantInfo[];
  maxVisible?: number;
}

const ParticipantAvatarStack: FC<Props> = ({ participants, maxVisible = 3 }) => {
  const visibleParticipants = participants.slice(0, maxVisible);
  const hiddenCount = participants.length - maxVisible;

  // Build names list for visible participants
  const namesList = visibleParticipants
    .map((p) => {
      const name = formatCompetitorName(p.competitor.firstName, p.competitor.lastName);
      const rankLabel = `${p.rank12 === 2 ? "2e" : p.rank12 === 3 ? "3e" : `${p.rank12}e`}`;
      return `${name} ${rankLabel}`;
    })
    .join(" · ");

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-neutral-800/50">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {visibleParticipants.map((p, idx) => (
          <div
            key={p.competitor.id}
            className="relative w-8 h-8 rounded-full ring-2 ring-neutral-800 overflow-hidden"
            style={{ zIndex: maxVisible - idx }}
          >
            <Image
              src={p.competitor.profilePictureUrl}
              alt={formatCompetitorName(p.competitor.firstName, p.competitor.lastName)}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            className="relative w-8 h-8 rounded-full ring-2 ring-neutral-800 bg-neutral-700 flex items-center justify-center"
            style={{ zIndex: 0 }}
          >
            <span className="text-sub text-neutral-300 font-medium">
              +{hiddenCount}
            </span>
          </div>
        )}
      </div>

      {/* Names */}
      <div className="flex-1 min-w-0">
        <p className="text-sub text-neutral-400 truncate">
          {namesList}
          {hiddenCount > 0 && (
            <span className="text-neutral-500 ml-1">+{hiddenCount} autre{hiddenCount > 1 ? "s" : ""}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ParticipantAvatarStack;
