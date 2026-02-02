"use client";

import { FC } from "react";

export type Period = "week" | "month" | "all";

interface Props {
  activePeriod: Period;
  onChange: (period: Period) => void;
  className?: string;
}

const PeriodTabs: FC<Props> = ({ activePeriod, onChange, className = "" }) => {
  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "Semaine" },
    { key: "month", label: "Mois" },
    { key: "all", label: "All-time" },
  ];

  return (
    <div
      className={`inline-flex items-center bg-neutral-800/60 rounded-lg p-1 ${className}`}
    >
      {periods.map((period) => (
        <button
          key={period.key}
          onClick={() => onChange(period.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activePeriod === period.key
              ? "bg-primary-500 text-neutral-900 shadow-md shadow-primary-500/20"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodTabs;
