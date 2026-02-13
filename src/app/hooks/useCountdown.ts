"use client";

import { useState, useEffect, useCallback } from "react";

export type Urgency = "normal" | "warning" | "critical";

export interface UrgencyThresholds {
  warningSeconds: number;
  criticalSeconds: number;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

export interface CountdownResult {
  time: CountdownTime;
  urgency: Urgency;
}

function computeTime(targetDate: Date): CountdownTime {
  const now = Date.now();
  const diff = targetDate.getTime() - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds, isExpired: false };
}

function computeUrgency(totalSeconds: number, thresholds: UrgencyThresholds): Urgency {
  if (totalSeconds <= thresholds.criticalSeconds) return "critical";
  if (totalSeconds <= thresholds.warningSeconds) return "warning";
  return "normal";
}

export function useCountdown(
  targetDate: Date | null,
  thresholds: UrgencyThresholds = { warningSeconds: 86400, criticalSeconds: 7200 }
): CountdownResult {
  const compute = useCallback((): CountdownResult => {
    if (!targetDate) {
      return {
        time: { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true },
        urgency: "normal",
      };
    }
    const time = computeTime(targetDate);
    const urgency = time.isExpired ? "normal" : computeUrgency(time.totalSeconds, thresholds);
    return { time, urgency };
  }, [targetDate, thresholds]);

  const [result, setResult] = useState<CountdownResult>(compute);

  useEffect(() => {
    if (!targetDate) return;

    // Immediately sync
    setResult(compute());

    const interval = setInterval(() => {
      setResult(compute());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, compute]);

  return result;
}
