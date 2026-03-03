"use client";

import { FC } from "react";
import Image from "next/image";
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";

export interface TVLeaderboardItem {
  id: string;
  rank: number;
  name: string;
  imageUrl?: string;
  characterImageUrl?: string;
  score: number;
  scoreLabel: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  maxScore?: number;
}

interface Props {
  item: TVLeaderboardItem;
  animationDelay?: number;
  disableEntryAnimation?: boolean;
}

const TVLeaderboardRow: FC<Props> = ({ item, animationDelay = 0, disableEntryAnimation = false }) => {
  const progressPercent = item.maxScore
    ? Math.min((item.score / item.maxScore) * 100, 100)
    : 0;

  const getTrendIcon = () => {
    if (!item.trend) return null;

    const iconClass = "text-lg";

    switch (item.trend) {
      case "up":
        return (
          <div className="flex items-center gap-1 text-success-400 bg-success-500/20 px-3 py-1 rounded-full">
            <FaArrowUp className={iconClass} />
            {item.trendValue !== undefined && (
              <span className="font-bold text-base">{item.trendValue}</span>
            )}
          </div>
        );
      case "down":
        return (
          <div className="flex items-center gap-1 text-error-400 bg-error-500/20 px-3 py-1 rounded-full">
            <FaArrowDown className={iconClass} />
            {item.trendValue !== undefined && (
              <span className="font-bold text-base">{item.trendValue}</span>
            )}
          </div>
        );
      case "stable":
        return (
          <div className="flex items-center gap-1 text-neutral-400 bg-neutral-700/30 px-3 py-1 rounded-full">
            <FaMinus className={iconClass} />
          </div>
        );
    }
  };

  const getRankStyle = () => {
    if (item.rank <= 3) {
      return "text-primary-400 font-black";
    }
    if (item.rank <= 10) {
      return "text-neutral-300 font-bold";
    }
    return "text-neutral-500 font-semibold";
  };

  return (
    <div
      className={`flex items-center gap-3 py-2 px-4 rounded-xl relative overflow-hidden
                  border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]
                  bg-linear-to-r from-cyan-950/40 via-blue-950/30 to-fuchsia-950/30
                  hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all
                  ${disableEntryAnimation ? '' : 'animate-row-slide-in'}`}
      style={disableEntryAnimation ? undefined : { animationDelay: `${animationDelay}ms` }}
    >
      {/* Rank */}
      <div className={`w-12 text-xl italic text-center ${getRankStyle()} drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]`}>
        {item.rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        {item.imageUrl ? (
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-cyan-500/50 flex-shrink-0">
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={44}
              height={44}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-cyan-900/50 ring-2 ring-cyan-500/50 flex items-center justify-center text-lg font-bold text-cyan-200">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Character variant small overlay */}
        {item.characterImageUrl && (
          <div className="absolute -right-1.5 -bottom-1.5 bg-neutral-900 rounded-full p-[2px] z-10 ring-1 ring-cyan-400">
            <Image
              src={item.characterImageUrl}
              alt="Character"
              width={18}
              height={18}
              className="rounded-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Name and subtitle */}
      <div className="flex-grow min-w-0">
        <h4 className="text-base font-bold text-white truncate leading-tight">{item.name}</h4>
        {item.subtitle && (
          <p className="text-[10px] text-neutral-400 truncate leading-tight">{item.subtitle}</p>
        )}

        {/* Progress bar */}
        {item.maxScore && (
          <div className="mt-1 h-1 bg-neutral-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-700 animate-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-right min-w-[80px]">
        <div className="text-xl font-black text-primary-400">
          {typeof item.score === "number"
            ? item.score.toFixed(item.scoreLabel === "pts" ? 1 : 0)
            : item.score}
        </div>
        <div className="text-[8px] font-bold uppercase text-neutral-500 tracking-wider">
          {item.scoreLabel}
        </div>
      </div>

      {/* Trend */}
      <div className="w-14 flex justify-center scale-90" title={item.trend ? `Tendance (vs précédent)` : undefined}>{getTrendIcon()}</div>
    </div>
  );
};

export default TVLeaderboardRow;
