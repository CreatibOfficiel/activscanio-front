"use client";

import { FC } from "react";
import { useCountdown, UrgencyThresholds, Urgency } from "@/app/hooks/useCountdown";

interface TVCountdownProps {
  label: string;
  targetDate: Date | null;
  thresholds?: UrgencyThresholds;
  expiredLabel?: string;
  showDays?: boolean;
}

const urgencyColors: Record<Urgency, { text: string; border: string; bg: string; glow: string }> = {
  normal: {
    text: "text-primary-400",
    border: "border-primary-500/30",
    bg: "bg-primary-500/10",
    glow: "countdown-glow-normal",
  },
  warning: {
    text: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "countdown-glow-warning",
  },
  critical: {
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    glow: "countdown-glow-critical",
  },
};

const TVCountdown: FC<TVCountdownProps> = ({
  label,
  targetDate,
  thresholds,
  expiredLabel = "Terminé",
}) => {
  const { time, urgency } = useCountdown(targetDate, thresholds);

  if (!targetDate) return null;

  if (time.isExpired) {
    return (
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest">{expiredLabel}</span>
      </div>
    );
  }

  const colors = urgencyColors[urgency];
  const pulseClass = urgency === "critical" ? "animate-countdown-pulse" : "";

  return (
    <div className={`p-1 px-3 rounded-lg border-2 backdrop-blur-md ${colors.glow} ${pulseClass} border-white/10 flex flex-col items-center min-w-[100px]`}>
      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <div className="flex gap-2 items-baseline">
        {time.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white leading-none">
              {time.days}
            </span>
            <span className="text-[6px] font-bold text-neutral-500 uppercase">
              J
            </span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-white leading-none tabular-nums">
            {time.hours.toString().padStart(2, "0")}:{time.minutes.toString().padStart(2, "0")}
            <span className="text-xs ml-0.5 opacity-70">:{time.seconds.toString().padStart(2, "0")}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TVCountdown;
