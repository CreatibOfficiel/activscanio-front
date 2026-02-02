"use client";

import { FC } from "react";

interface Props {
  label: string;
  count: number;
}

const DateSeparator: FC<Props> = ({ label, count }) => {
  return (
    <div className="flex items-center gap-3 py-4 px-4">
      {/* Left line */}
      <div className="flex-1 h-px bg-neutral-700" />

      {/* Label with count */}
      <div className="flex items-center gap-2">
        <span className="text-sub text-neutral-400 font-medium uppercase tracking-wide">
          {label}
        </span>
        <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-sub rounded-full border border-neutral-700">
          {count}
        </span>
      </div>

      {/* Right line */}
      <div className="flex-1 h-px bg-neutral-700" />
    </div>
  );
};

export default DateSeparator;
