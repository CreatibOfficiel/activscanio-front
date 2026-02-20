"use client";

import { FC } from "react";
import Countdown from "../ui/Countdown";

interface DuelCountdownProps {
  expiresAt: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

const DuelCountdown: FC<DuelCountdownProps> = ({
  expiresAt,
  label = "Temps restant",
  compact = false,
  className = "",
}) => {
  const targetDate = new Date(expiresAt);

  return (
    <Countdown
      label={label}
      targetDate={targetDate}
      thresholds={{ warningSeconds: 30, criticalSeconds: 10 }}
      expiredLabel="Expire"
      compact={compact}
      className={className}
    />
  );
};

export default DuelCountdown;
