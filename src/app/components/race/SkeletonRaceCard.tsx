"use client";

import { FC } from "react";

interface Props {
  count?: number;
}

const SkeletonRaceCard: FC<Props> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden animate-pulse"
        >
          {/* Header skeleton */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/50">
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 bg-neutral-700 rounded" />
              <div className="h-3 w-1 bg-neutral-700 rounded" />
              <div className="h-3 w-14 bg-neutral-700 rounded" />
            </div>
            <div className="h-6 w-16 bg-neutral-700 rounded-full" />
          </div>

          {/* Winner skeleton */}
          <div className="p-4 bg-gradient-to-r from-neutral-700/30 to-transparent border-l-4 border-neutral-600">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-xl bg-neutral-700" />

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-neutral-700 rounded" />
                  <div className="h-5 w-8 bg-neutral-700 rounded-full" />
                </div>
                <div className="h-3 w-12 bg-neutral-700 rounded" />
              </div>

              {/* Score */}
              <div className="text-right space-y-1">
                <div className="h-6 w-10 bg-neutral-700 rounded" />
                <div className="h-3 w-6 bg-neutral-700 rounded ml-auto" />
              </div>
            </div>
          </div>

          {/* Other participants skeleton */}
          <div className="flex items-center gap-3 px-4 py-3 bg-neutral-800/50">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-neutral-700" />
              <div className="w-8 h-8 rounded-full bg-neutral-700" />
              <div className="w-8 h-8 rounded-full bg-neutral-700" />
            </div>
            <div className="h-3 w-32 bg-neutral-700 rounded" />
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonRaceCard;
