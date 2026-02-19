import { FC } from "react";
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
      className={`flex items-center ${isTv ? "gap-4" : "gap-3"} ${className}`}
    >
      <div className={`h-px flex-1 ${league.lineColor}`} />
      <h2
        className={`font-semibold uppercase tracking-wider flex items-center gap-1.5 ${league.textColor} ${
          isTv ? "text-lg" : "text-sm"
        }`}
      >
        <span>{league.emoji}</span> {league.label}
      </h2>
      <div className={`h-px flex-1 ${league.lineColor}`} />
    </div>
  );
};

export default LeagueDivider;
