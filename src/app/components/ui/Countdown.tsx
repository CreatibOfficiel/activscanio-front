"use client";

import { FC } from "react";
import { useCountdown, UrgencyThresholds, Urgency } from "@/app/hooks/useCountdown";
import { MdTimer } from "react-icons/md";

interface CountdownProps {
  label: string;
  targetDate: Date | null;
  thresholds?: UrgencyThresholds;
  expiredLabel?: string;
  showIcon?: boolean;
  compact?: boolean;
  className?: string;
}

const urgencyStyles: Record<Urgency, { bg: string; border: string; text: string; accent: string; dot: string; compactBg: string; compactBorder: string; compactText: string }> = {
  normal: {
    bg: "bg-primary-500/5",
    border: "border-primary-500/20",
    text: "text-primary-400",
    accent: "text-primary-500",
    dot: "bg-primary-500",
    compactBg: "bg-white/15",
    compactBorder: "border-white/25",
    compactText: "text-white",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-400",
    accent: "text-amber-500",
    dot: "bg-amber-500",
    compactBg: "bg-amber-900/50",
    compactBorder: "border-amber-500/40",
    compactText: "text-amber-200",
  },
  critical: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-400",
    accent: "text-red-500",
    dot: "bg-red-500",
    compactBg: "bg-red-900/50",
    compactBorder: "border-red-500/40",
    compactText: "text-red-200",
  },
};

const DigitPair: FC<{ value: number; unit: string; urgency: Urgency }> = ({ value, unit, urgency }) => {
  const styles = urgencyStyles[urgency];
  return (
    <div className="flex items-baseline gap-0.5">
      <span
        className={`font-bold tabular-nums ${styles.accent}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[0.65em] text-neutral-500 font-medium">{unit}</span>
    </div>
  );
};

const Countdown: FC<CountdownProps> = ({
  label,
  targetDate,
  thresholds,
  expiredLabel = "Terminé",
  showIcon = true,
  compact = false,
  className = "",
}) => {
  const { time, urgency } = useCountdown(targetDate, thresholds);

  if (!targetDate) return null;

  const styles = urgencyStyles[urgency];
  const pulseClass = urgency === "critical" ? "animate-pulse" : "";

  if (time.isExpired) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 ${className}`}>
        <MdTimer className="text-neutral-500" />
        <span className="text-sm text-neutral-500">{expiredLabel}</span>
      </div>
    );
  }

  if (compact) {
    // Inline pill style — used inside headers/cards (uses compactBg/compactText for contrast on colored backgrounds)
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.compactBg} border ${styles.compactBorder} backdrop-blur-sm ${pulseClass} ${className}`}
      >
        {showIcon && <MdTimer className={`text-sm ${styles.compactText}`} />}
        <span className={`text-sm font-medium tabular-nums ${styles.compactText}`} style={{ fontVariantNumeric: "tabular-nums" }}>
          {time.days > 0 && `${time.days}j `}
          {String(time.hours).padStart(2, "0")}:{String(time.minutes).padStart(2, "0")}:{String(time.seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }

  // Full card-like display
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl ${styles.bg} border ${styles.border} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`relative flex items-center justify-center`}>
          <div className={`w-2 h-2 rounded-full ${styles.dot} ${pulseClass}`} />
        </div>
        <span className={`text-sm font-medium ${styles.text}`}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-base">
        {time.days > 0 && (
          <>
            <DigitPair value={time.days} unit="j" urgency={urgency} />
            <span className={`${styles.text} opacity-40 mx-0.5`}>·</span>
          </>
        )}
        <DigitPair value={time.hours} unit="h" urgency={urgency} />
        <span className={`${styles.text} opacity-40`}>:</span>
        <DigitPair value={time.minutes} unit="m" urgency={urgency} />
        <span className={`${styles.text} opacity-40`}>:</span>
        <DigitPair value={time.seconds} unit="s" urgency={urgency} />
      </div>
    </div>
  );
};

export default Countdown;
