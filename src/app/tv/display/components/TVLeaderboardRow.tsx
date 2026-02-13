"use client";

import { FC } from "react";
import Image from "next/image";
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";

export interface TVLeaderboardItem {
  id: string;
  rank: number;
  name: string;
  imageUrl?: string;
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
}

const TVLeaderboardRow: FC<Props> = ({ item, animationDelay = 0 }) => {
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
      className="flex items-center gap-6 py-4 px-6 rounded-xl bg-neutral-800/40 hover:bg-neutral-800/60 transition-colors animate-row-slide-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Rank */}
      <div className={`w-16 text-3xl text-center ${getRankStyle()}`}>
        #{item.rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={64}
            height={64}
            className="rounded-full object-cover ring-2 ring-neutral-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-2xl font-bold text-neutral-400">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name and subtitle */}
      <div className="flex-grow min-w-0">
        <h4 className="text-xl font-bold text-white truncate">{item.name}</h4>
        {item.subtitle && (
          <p className="text-base text-neutral-400 truncate">{item.subtitle}</p>
        )}

        {/* Progress bar */}
        {item.maxScore && (
          <div className="mt-2 h-2 bg-neutral-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-700 animate-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-right min-w-[120px]">
        <div className="text-3xl font-black text-primary-400">
          {typeof item.score === "number"
            ? item.score.toFixed(item.scoreLabel === "pts" ? 1 : 0)
            : item.score}
        </div>
        <div className="text-sm font-semibold uppercase text-neutral-500 tracking-wider">
          {item.scoreLabel}
        </div>
      </div>

      {/* Trend */}
      <div className="w-20 flex justify-center" title={item.trend ? `Tendance (vs précédent)` : undefined}>{getTrendIcon()}</div>
    </div>
  );
};

export default TVLeaderboardRow;
