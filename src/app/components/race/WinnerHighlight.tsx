"use client";

import { FC } from "react";
import Image from "next/image";
import { FaCrown } from "react-icons/fa";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";

interface Props {
  competitor: Competitor;
  score: number;
  rank12: number;
}

const WinnerHighlight: FC<Props> = ({ competitor, score, rank12 }) => {
  const displayName = formatCompetitorName(competitor.firstName, competitor.lastName);

  return (
    <div className="p-4 bg-gradient-to-r from-gold-500/15 via-gold-500/5 to-transparent border-l-4 border-gold-500">
      <div className="flex items-center gap-4">
        {/* Avatar with crown */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl ring-2 ring-gold-500 shadow-lg shadow-gold-500/30 overflow-hidden animate-gold-pulse">
            <Image
              src={competitor.profilePictureUrl}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          </div>
          {/* Crown icon */}
          <div className="absolute -top-2 -right-2 animate-crown-bounce">
            <FaCrown className="text-gold-500 text-xl drop-shadow-lg" />
          </div>
        </div>

        {/* Winner info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-bold text-neutral-100 truncate">
              {displayName}
            </span>
            <span className="px-2 py-0.5 bg-gold-500/20 text-gold-500 text-sub font-semibold rounded-full">
              1er
            </span>
          </div>
          <div className="flex items-center gap-3 text-sub text-neutral-400">
            <span>#{rank12}/12</span>
          </div>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <div className="text-statistic text-gold-500 font-bold">{score}</div>
          <div className="text-sub text-neutral-500">pts</div>
        </div>
      </div>
    </div>
  );
};

export default WinnerHighlight;
