"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { Competitor, getDisplayScore } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";
import CompetitorDetailModal from "../competitor/CompetitorDetailModal";
import TrendIndicator, { TrendDirection } from "./TrendIndicator";

interface Props {
  topThree: Competitor[];
  trends?: Map<string, { direction: TrendDirection; value?: number }>;
  disableEntryAnimation?: boolean;
}

/**
 * Podium card configuration per position.
 */
const PODIUM_STYLES = {
  1: {
    glowClass: "podium-card-gold",
    metallicBg: "linear-gradient(135deg, #FFB300 0%, #FFF176 50%, #FFB300 100%)",
    borderColor: "border-[#FFD700]",
    ringColor: "ring-yellow-400",
    eloColor: "text-amber-400",
    checkeredColor: "rgba(255, 215, 0, 0.2)",
  },
  2: {
    glowClass: "podium-card-silver",
    metallicBg: "linear-gradient(135deg, #BDBDBD 0%, #FFFFFF 50%, #BDBDBD 100%)",
    borderColor: "border-[#E0E0E0]",
    ringColor: "ring-gray-100",
    eloColor: "text-gray-200",
    checkeredColor: "rgba(224, 224, 224, 0.15)",
  },
  3: {
    glowClass: "podium-card-bronze",
    metallicBg: "linear-gradient(135deg, #8D5524 0%, #E6B980 50%, #8D5524 100%)",
    borderColor: "border-[#CD7F32]",
    ringColor: "ring-amber-500",
    eloColor: "text-amber-600",
    checkeredColor: "rgba(205, 127, 50, 0.15)",
  },
} as const;

const ElevatedPodium: FC<Props> = ({ topThree, trends, disableEntryAnimation = false }) => {
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<Competitor | null>(null);

  const renderPodiumCard = (
    competitor: Competitor | null,
    position: 1 | 2 | 3,
    index: number
  ) => {
    if (!competitor) return null;

    const style = PODIUM_STYLES[position];
    const shortName = formatCompetitorName(
      competitor.firstName,
      competitor.lastName
    );
    const trend = trends?.get(competitor.id);
    const characterImageUrl = competitor.characterVariant?.imageUrl ?? null;

    return (
      <div
        key={competitor.id}
        onClick={() => setSelectedCompetitor(competitor)}
        className={`
          flex items-stretch h-20 gap-1 mx-1
          cursor-pointer
          transform transition-all duration-200 hover:scale-[1.02]
          ${disableEntryAnimation ? "" : "stagger-item"}
        `}
        style={disableEntryAnimation ? undefined : { animationDelay: `${index * 120}ms` }}
      >
        {/* Left Side (Photo, Name, Score) */}
        <div className={`
          flex-1 relative -skew-x-20 rounded-lg border-[1.5px] ${style.borderColor} ${style.glowClass}
          bg-neutral-900 overflow-hidden will-change-transform [backface-visibility:hidden]
        `}>
          {/* Metallic Strip (More progressive fade) */}
          <div
            className="absolute top-0 left-0 bottom-0 w-[35%] animate-brilliance-v2 z-10"
            style={{
              background: style.metallicBg,
              maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)'
            }}
          />

          {/* Finish Line Checkered Pattern (Fading) */}
          <div
            className="absolute top-0 right-0 bottom-0 w-24 z-0 opacity-80"
            style={{
              backgroundImage: `
                linear-gradient(45deg, ${style.checkeredColor} 25%, transparent 25%), 
                linear-gradient(-45deg, ${style.checkeredColor} 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, ${style.checkeredColor} 75%), 
                linear-gradient(-45deg, transparent 75%, ${style.checkeredColor} 75%)
              `,
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 0 5px, 5px 5px, 5px 0',
              maskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 100%)'
            }}
          />

          <div className="w-full h-full skew-x-20 relative z-20 flex items-center pl-7 pr-4 gap-3 [backface-visibility:hidden]">
            {/* Avatar */}
            <div className="relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={competitor.profilePictureUrl}
                alt={competitor.firstName}
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
            </div>

            {/* Name + ELO */}
            <div className="flex-grow min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate text-lg drop-shadow-sm">
                  {shortName}
                </span>
                {trend && trend.direction !== "stable" && (
                  <span className="bg-neutral-900/60 rounded-full">
                    <TrendIndicator
                      direction={trend.direction}
                      value={trend.value}
                      size="sm"
                    />
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-bold text-lg ${style.eloColor} drop-shadow-sm`}>
                  {getDisplayScore(competitor)} <span className="text-xs font-medium opacity-70 uppercase text-white">ELO</span>
                </span>
                {competitor.avgRank12 !== undefined && (
                  <span className="text-xs font-semibold text-white/60">
                    AVG: <span className="text-white/90">{competitor.avgRank12.toFixed(1)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Character) */}
        <div className={`
          w-16 sm:w-20 relative -skew-x-20 rounded-lg border-[1.5px] ${style.borderColor} ${style.glowClass}
          bg-neutral-900 overflow-hidden will-change-transform [backface-visibility:hidden]
        `}>
          <div className="w-full h-full skew-x-20 flex items-center justify-center [backface-visibility:hidden]">
            <div className="relative z-[2] w-9 h-9 flex items-center justify-center">
              {characterImageUrl ? (
                <Image
                  src={characterImageUrl}
                  alt="Character"
                  fill
                  className="object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                />
              ) : (
                <span className="font-black text-2xl text-neutral-500/50">?</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {topThree.map((competitor, idx) => {
          if (!competitor) return null;
          const position = (idx + 1) as 1 | 2 | 3;
          return renderPodiumCard(competitor, position, idx);
        })}
      </div>

      {/* Detail modal */}
      <CompetitorDetailModal
        competitor={selectedCompetitor ?? topThree[0]}
        isOpen={selectedCompetitor !== null}
        onClose={() => setSelectedCompetitor(null)}
        rank={selectedCompetitor ? topThree.indexOf(selectedCompetitor) + 1 : undefined}
        trend={selectedCompetitor ? trends?.get(selectedCompetitor.id) : undefined}
      />
    </>
  );
};

export default ElevatedPodium;
