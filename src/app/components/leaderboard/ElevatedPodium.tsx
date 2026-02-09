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
}

const ElevatedPodium: FC<Props> = ({ topThree, trends }) => {
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<Competitor | null>(null);

  const [first, second, third] = [
    topThree[0] || null,
    topThree[1] || null,
    topThree[2] || null,
  ];

  const getMedalConfig = (position: 1 | 2 | 3) => {
    switch (position) {
      case 1:
        return {
          medal: "🥇",
          gradient:
            "bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600",
          glow: "shadow-[0_0_40px_rgba(234,179,8,0.4)]",
          ring: "ring-yellow-500",
          crown: true,
          height: "h-32",
          avatarSize: 80,
          textColor: "text-yellow-900",
        };
      case 2:
        return {
          medal: "🥈",
          gradient: "bg-gradient-to-b from-gray-200 via-gray-300 to-gray-500",
          glow: "shadow-[0_0_30px_rgba(156,163,175,0.3)]",
          ring: "ring-gray-400",
          crown: false,
          height: "h-24",
          avatarSize: 64,
          textColor: "text-gray-900",
        };
      case 3:
        return {
          medal: "🥉",
          gradient: "bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700",
          glow: "shadow-[0_0_30px_rgba(217,119,6,0.3)]",
          ring: "ring-amber-600",
          crown: false,
          height: "h-20",
          avatarSize: 64,
          textColor: "text-amber-900",
        };
    }
  };

  const renderPodiumPlace = (
    competitor: Competitor | null,
    position: 1 | 2 | 3,
    animationDelay: number
  ) => {
    if (!competitor) return null;

    const config = getMedalConfig(position);
    const shortName = formatCompetitorName(
      competitor.firstName,
      competitor.lastName
    );
    const trend = trends?.get(competitor.id);

    return (
      <div
        className={`
          flex flex-col items-center cursor-pointer
          animate-podium-rise
        `}
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={() => setSelectedCompetitor(competitor)}
      >
        {/* Crown for 1st place */}
        {config.crown && (
          <div className="animate-crown-drop mb-1">
            <span className="text-3xl drop-shadow-lg">
              {competitor.firstName === "Joran" ? "🤪" : "👑"}
            </span>
          </div>
        )}

        {/* Avatar with glow */}
        <div className={`relative mb-2 ${config.glow} rounded-full`}>
          <div
            className={`ring-4 ${config.ring} ring-offset-2 ring-offset-neutral-900 rounded-full overflow-hidden`}
          >
            <Image
              src={competitor.profilePictureUrl}
              alt={competitor.firstName}
              width={config.avatarSize}
              height={config.avatarSize}
              className="rounded-full object-cover"
            />
          </div>

          {/* Medal badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">
            {config.medal}
          </div>
        </div>

        {/* Name + trend inline */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`font-bold text-neutral-100 truncate max-w-[100px] ${position === 1 ? "text-lg" : "text-base"}`}
          >
            {shortName}
          </span>
          {trend && (
            <TrendIndicator
              direction={trend.direction}
              value={trend.value}
              size="sm"
            />
          )}
        </div>

        {/* Provisional badge */}
        {competitor.provisional && (
          <span className="text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded mt-1">
            {competitor.raceCount}/5
          </span>
        )}

        {/* Podium base */}
        <div
          className={`
            mt-3 w-full px-4 py-2 rounded-t-xl ${config.gradient}
            ${config.height}
            flex flex-col items-center justify-start pt-3
            transition-transform hover:scale-105
          `}
        >
          <span className={`text-xl font-black ${config.textColor}`}>
            {getDisplayScore(competitor)}
          </span>
          <span
            className={`text-xs font-semibold uppercase ${config.textColor} opacity-70`}
          >
            ELO
          </span>
          {competitor.avgRank12 && (
            <span
              className={`text-xs mt-1 ${config.textColor} opacity-60`}
            >
              Avg: {competitor.avgRank12.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile view - vertical list with enhanced styling */}
      <div className="md:hidden space-y-3">
        {topThree.map((competitor, idx) => {
          if (!competitor) return null;
          const position = (idx + 1) as 1 | 2 | 3;
          const config = getMedalConfig(position);
          const shortName = formatCompetitorName(
            competitor.firstName,
            competitor.lastName
          );
          const trend = trends?.get(competitor.id);

          return (
            <div
              key={competitor.id}
              onClick={() => setSelectedCompetitor(competitor)}
              className={`
                flex items-center gap-4 p-4 rounded-xl cursor-pointer
                ${config.gradient} ${config.glow}
                transform transition-all duration-200 hover:scale-[1.02]
                stagger-item
              `}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Crown for 1st */}
              {position === 1 && (
                <span className="text-2xl animate-crown-bounce">
                  {competitor.firstName === "Joran" ? "🤪" : "👑"}
                </span>
              )}

              {/* Avatar */}
              <div className={`ring-2 ${config.ring} rounded-full`}>
                <Image
                  src={competitor.profilePictureUrl}
                  alt={competitor.firstName}
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${config.textColor}`}>
                    {shortName}
                  </span>
                  {competitor.provisional && (
                    <span className="text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">
                      {competitor.raceCount}/5
                    </span>
                  )}
                  {trend && (
                    <TrendIndicator
                      direction={trend.direction}
                      value={trend.value}
                      size="sm"
                    />
                  )}
                </div>
                <div className={`flex items-center gap-3 ${config.textColor} opacity-80`}>
                  <span className="text-base font-semibold">
                    {getDisplayScore(competitor)} ELO
                  </span>
                  {competitor.avgRank12 && (
                    <span className="text-sm">
                      • Avg: {competitor.avgRank12.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Medal */}
              <span className="text-3xl">{config.medal}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop view - 3D elevated podium */}
      <div
        className="hidden md:flex justify-center items-end gap-4 pt-16 pb-4"
        style={{ perspective: "1000px" }}
      >
        {/* 2nd place - left */}
        <div className="w-32">{renderPodiumPlace(second, 2, 200)}</div>

        {/* 1st place - center, elevated */}
        <div className="w-36 -mt-8">{renderPodiumPlace(first, 1, 400)}</div>

        {/* 3rd place - right */}
        <div className="w-32">{renderPodiumPlace(third, 3, 100)}</div>
      </div>

      {/* Modal */}
      {selectedCompetitor && (
        <CompetitorDetailModal
          competitor={selectedCompetitor}
          onClose={() => setSelectedCompetitor(null)}
        />
      )}
    </>
  );
};

export default ElevatedPodium;
