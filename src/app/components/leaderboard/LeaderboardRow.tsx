"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { Competitor, getDisplayScore } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";
import RankBadge from "./RankBadge";
import TrendIndicator, { TrendDirection } from "./TrendIndicator";
import CompetitorDetailModal from "../competitor/CompetitorDetailModal";

interface Props {
  competitor: Competitor;
  rank: number;
  trend?: {
    direction: TrendDirection;
    value?: number;
  };
  isCurrentUser?: boolean;
  animationDelay?: number;
  disableEntryAnimation?: boolean;
}

const LeaderboardRow: FC<Props> = ({
  competitor,
  rank,
  trend,
  isCurrentUser = false,
  animationDelay = 0,
  disableEntryAnimation = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const shortName = formatCompetitorName(
    competitor.firstName,
    competitor.lastName
  );
  // Progress bar calculation (towards next rank)
  const maxScore = 2000; // Approximate max ELO
  const progressPercent = Math.min(
    ((competitor.conservativeScore ?? 1500) / maxScore) * 100,
    100
  );

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={`
          group relative flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer
          bg-neutral-800/40 border border-neutral-600/60
          transition-all duration-200 hover:bg-neutral-800/60 hover:border-neutral-500/60
          ${isCurrentUser ? "ring-1 ring-primary-500/30" : ""}
          ${disableEntryAnimation ? '' : 'stagger-item'}
        `}
        style={disableEntryAnimation ? undefined : {
          animationDelay: `${animationDelay}ms`,
        }}
      >
        {/* Rank badge */}
        <RankBadge rank={rank} size="md" />

        {/* Avatar with Character Overlay */}
        <div className="relative flex-shrink-0">
          <Image
            src={competitor.profilePictureUrl}
            alt={competitor.firstName}
            width={40}
            height={40}
            className="rounded-full object-cover border border-neutral-700"
          />

          {/* Character Overlay */}
          {competitor.characterVariant?.imageUrl && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden shadow-sm">
              <Image
                src={competitor.characterVariant.imageUrl}
                alt="Character"
                width={20}
                height={20}
                className="object-contain w-full h-full p-0.5"
              />
            </div>
          )}

          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 px-1 h-3.5 bg-primary-500 rounded-full flex items-center justify-center border border-neutral-900 shadow-sm">
              <span className="text-[7px] text-neutral-900 font-black leading-none uppercase">You</span>
            </div>
          )}
        </div>

        {/* Name and details */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold truncate ${isCurrentUser ? "text-primary-400" : "text-neutral-100"}`}
            >
              {shortName}
            </span>
            {competitor.provisional && (
              <span className="text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">
                {competitor.raceCount}/5
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1 bg-neutral-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Score and trend */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold text-neutral-100">
              {getDisplayScore(competitor)}
            </div>
            <div className="text-xs text-neutral-500 uppercase">ELO</div>
          </div>

          {trend && (
            <TrendIndicator
              direction={trend.direction}
              value={trend.value}
              size="sm"
            />
          )}

          <div className="text-right min-w-[48px]">
            <div className="text-base font-semibold text-neutral-300">
              {competitor.avgRank12 ? competitor.avgRank12.toFixed(1) : "N/A"}
            </div>
            <div className="text-xs text-neutral-500 uppercase">AVG</div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-linear-to-r from-primary-500/5 to-transparent" />
      </div >

      <CompetitorDetailModal
        competitor={competitor}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        rank={rank}
        trend={trend}
      />
    </>
  );
};

export default LeaderboardRow;
