"use client";

import { FC } from "react";

interface Props {
  rank: number;
  size?: "sm" | "md" | "lg";
  showMedal?: boolean;
}

const RankBadge: FC<Props> = ({ rank, size = "md", showMedal = true }) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const getMedalEmoji = (rank: number): string | null => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getGradientClass = (rank: number): string => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-yellow-900 shadow-[0_0_12px_rgba(234,179,8,0.4)]";
      case 2:
        return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-800 shadow-[0_0_12px_rgba(156,163,175,0.4)]";
      case 3:
        return "bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-amber-900 shadow-[0_0_12px_rgba(217,119,6,0.4)]";
      default:
        if (rank <= 10) {
          return "text-primary-400 font-bold";
        }
        return "text-neutral-500 font-medium";
    }
  };

  const medal = getMedalEmoji(rank);

  if (showMedal && medal) {
    return (
      <div
        className={`flex items-center justify-center ${sizeClasses[size]} ${size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg"}`}
      >
        {medal}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${getGradientClass(rank)}`}
    >
      {rank}
    </div>
  );
};

export default RankBadge;
