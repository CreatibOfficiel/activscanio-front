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

interface DigitBlockProps {
  value: number;
  unit: string;
  urgency: Urgency;
}

const DigitBlock: FC<DigitBlockProps> = ({ value, unit, urgency }) => {
  const colors = urgencyColors[urgency];
  return (
    <div className="flex flex-col items-center">
      <div
        className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-2 min-w-[3.5rem] text-center`}
      >
        <span
          className={`text-3xl font-bold tabular-nums ${colors.text}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{unit}</span>
    </div>
  );
};

const Separator: FC<{ urgency: Urgency }> = ({ urgency }) => {
  const colors = urgencyColors[urgency];
  return (
    <span className={`text-2xl font-bold ${colors.text} self-start mt-2 opacity-60`}>:</span>
  );
};

const TVCountdown: FC<TVCountdownProps> = ({
  label,
  targetDate,
  thresholds,
  expiredLabel = "Terminé",
  showDays = true,
}) => {
  const { time, urgency } = useCountdown(targetDate, thresholds);

  if (!targetDate) return null;

  if (time.isExpired) {
    return (
      <div className="flex items-center justify-center gap-3">
        <span className="text-lg text-neutral-500">{expiredLabel}</span>
      </div>
    );
  }

  const colors = urgencyColors[urgency];
  const pulseClass = urgency === "critical" ? "animate-countdown-pulse" : "";

  return (
    <div className={`flex flex-col items-center gap-2 ${pulseClass} ${colors.glow}`}>
      <span className={`text-sm uppercase tracking-widest ${colors.text} font-medium`}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {showDays && time.days > 0 && (
          <>
            <DigitBlock value={time.days} unit="j" urgency={urgency} />
            <Separator urgency={urgency} />
          </>
        )}
        <DigitBlock value={time.hours} unit="h" urgency={urgency} />
        <Separator urgency={urgency} />
        <DigitBlock value={time.minutes} unit="m" urgency={urgency} />
        <Separator urgency={urgency} />
        <DigitBlock value={time.seconds} unit="s" urgency={urgency} />
      </div>
    </div>
  );
};

export default TVCountdown;
