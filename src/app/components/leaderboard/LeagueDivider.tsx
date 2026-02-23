import { FC } from "react";
import Image from "next/image";
import { LeagueConfig } from "@/app/utils/leagues";

interface LeagueDividerProps {
  league: LeagueConfig;
  variant: "mobile" | "tv";
  className?: string;
}

const LeagueDivider: FC<LeagueDividerProps> = ({ league, variant, className = "" }) => {
  const isTv = variant === "tv";

  return (
    <div
      className={`flex items-center ${isTv ? "gap-3 py-2" : "gap-3"} ${className}`}
    >
      <div className={`h-px flex-1 ${league.lineColor}`} />
      <h2
        className={`font-semibold uppercase tracking-wider flex items-center gap-2 ${league.textColor} ${isTv ? "text-base" : "text-sm"
          }`}
      >
        {league.icon ? (
          <div className={`relative ${isTv ? "w-5 h-5" : "w-4 h-4"}`}>
            <Image
              src={league.icon}
              alt={league.label}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <span>{league.emoji}</span>
        )}
        <span>{league.label}</span>
      </h2>
      <div className={`h-px flex-1 ${league.lineColor}`} />
    </div>
  );
};

export default LeagueDivider;
