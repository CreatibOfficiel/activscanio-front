"use client";

import { useState, useEffect, useCallback } from "react";
import { SeasonsRepository } from "../repositories/SeasonsRepository";

const STORAGE_KEY = "lastSeenSeasonRecap";

function getPreviousMonth(): { month: number; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: Jan=0
  if (month === 0) {
    return { month: 12, year: now.getFullYear() - 1 };
  }
  return { month, year: now.getFullYear() };
}

function hasSeenRecap(month: number, year: number): boolean {
  if (typeof window === "undefined") return true;
  const seen = localStorage.getItem(STORAGE_KEY);
  return seen === `${year}-${String(month).padStart(2, "0")}`;
}

function markRecapSeen(month: number, year: number): void {
  localStorage.setItem(
    STORAGE_KEY,
    `${year}-${String(month).padStart(2, "0")}`
  );
}

export function useSeasonRecap() {
  const [showRecap, setShowRecap] = useState(false);
  const [recapMonth, setRecapMonth] = useState<number | null>(null);
  const [recapYear, setRecapYear] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  // Auto-detect on mount
  useEffect(() => {
    if (checked) return;

    const { month, year } = getPreviousMonth();

    if (hasSeenRecap(month, year)) {
      setChecked(true);
      return;
    }

    SeasonsRepository.getSeason(year, month)
      .then((season) => {
        if (season && season.id) {
          setRecapMonth(month);
          setRecapYear(year);
          setShowRecap(true);
        }
      })
      .catch(() => {
        // No archived season — do nothing
      })
      .finally(() => {
        setChecked(true);
      });
  }, [checked]);

  const openRecap = useCallback((month: number, year: number) => {
    setRecapMonth(month);
    setRecapYear(year);
    setShowRecap(true);
  }, []);

  const closeRecap = useCallback(() => {
    if (recapMonth && recapYear) {
      markRecapSeen(recapMonth, recapYear);
    }
    setShowRecap(false);
  }, [recapMonth, recapYear]);

  return { showRecap, recapMonth, recapYear, openRecap, closeRecap };
}
