"use client";

import { FC } from "react";
import Image from "next/image";
import { MdFlag, MdCalendarToday, MdEmojiEvents } from "react-icons/md";
import { formatCompetitorName } from "@/app/utils/formatters";

interface MostActivePlayer {
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  raceCount: number;
}

interface Props {
  totalRaces?: number;
  weeklyRaces?: number;
  mostActive?: MostActivePlayer | null;
}

const RacesStatsHeader: FC<Props> = ({ totalRaces, weeklyRaces, mostActive }) => {
  return (
    <div className="px-4 pt-6 pb-4">
      {/* Title */}
      <h1 className="text-center text-title mb-6">Courses</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total races */}
        <div className="bg-neutral-800 rounded-xl p-3 border border-neutral-700">
          <div className="flex items-center gap-2 mb-1">
            <MdFlag className="text-primary-500 text-lg" />
            <span className="text-sub text-neutral-400">Nb. total <span className="text-neutral-500">(all time)</span></span>
          </div>
          <p className="text-statistic text-neutral-100">{totalRaces ?? "-"}</p>
        </div>

        {/* This week */}
        <div className="bg-neutral-800 rounded-xl p-3 border border-neutral-700">
          <div className="flex items-center gap-2 mb-1">
            <MdCalendarToday className="text-primary-500 text-lg" />
            <span className="text-sub text-neutral-400">Nb. cette sem.</span>
          </div>
          <p className="text-statistic text-neutral-100">{weeklyRaces ?? "-"}</p>
        </div>

        {/* Most active player */}
        <div className="bg-neutral-800 rounded-xl p-3 border border-neutral-700">
          <div className="flex items-center gap-2 mb-1">
            <MdEmojiEvents className="text-gold-500 text-lg" />
            <span className="text-sub text-neutral-400">Plus actif <span className="text-neutral-500">(all time)</span></span>
          </div>
          {mostActive ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={mostActive.profilePictureUrl}
                  alt={formatCompetitorName(mostActive.firstName, mostActive.lastName)}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-regular text-neutral-100 truncate">
                {formatCompetitorName(mostActive.firstName, mostActive.lastName)}
              </span>
            </div>
          ) : (
            <p className="text-regular text-neutral-500">-</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RacesStatsHeader;
