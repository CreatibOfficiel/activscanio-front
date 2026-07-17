"use client";

import { FC } from "react";
import Image from "next/image";
import { getInitials, getColorFromName } from "@/app/components/ui/UserAvatar";
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
        <div className="bg-neutral-800 rounded-xl p-3 border border-neutral-700 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <MdFlag className="text-primary-500 text-lg" />
            <span className="text-sub text-neutral-400">Nb. total <span className="text-neutral-500">(all time)</span></span>
          </div>
          <p className="text-statistic text-neutral-100 mt-auto">{totalRaces ?? "-"}</p>
        </div>

        {/* This week */}
        <div className="bg-neutral-800 rounded-xl p-3 border border-neutral-700 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <MdCalendarToday className="text-primary-500 text-lg" />
            <span className="text-sub text-neutral-400">Nb. cette sem.</span>
          </div>
          <p className="text-statistic text-neutral-100 mt-auto">{weeklyRaces ?? "-"}</p>
        </div>

        {/* Most active player */}
        <div className="bg-neutral-800 rounded-xl p-3 border border-neutral-700 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <MdEmojiEvents className="text-gold-500 text-lg" />
            <span className="text-sub text-neutral-400">Plus actif <span className="text-neutral-500">(all time)</span></span>
          </div>
          {mostActive ? (
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                {mostActive.profilePictureUrl ? (
                  <Image
                    src={mostActive.profilePictureUrl}
                    alt={formatCompetitorName(mostActive.firstName, mostActive.lastName)}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-[9px] font-bold text-white ${getColorFromName(
                      `${mostActive.firstName} ${mostActive.lastName}`,
                    )}`}
                  >
                    {getInitials(`${mostActive.firstName} ${mostActive.lastName}`)}
                  </div>
                )}
              </div>
              <span className="text-regular text-neutral-100 truncate">
                {formatCompetitorName(mostActive.firstName, mostActive.lastName)}
              </span>
            </div>
          ) : (
            <p className="text-regular text-neutral-500 mt-auto">-</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RacesStatsHeader;
