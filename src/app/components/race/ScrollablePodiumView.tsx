"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { Competitor, getDisplayScore } from "@/app/models/Competitor";
import CompetitorDetailModal from "../competitor/CompetitorDetailModal";
import PodiumCard from "./PodiumCard";

interface Props {
  topThreeCompetitors: Competitor[];
}

const ScrollablePodiumView: FC<Props> = ({ topThreeCompetitors }) => {
  const [detail, setDetail] = useState<Competitor | null>(null);

  const [first, second, third] = [
    topThreeCompetitors[0] || null,
    topThreeCompetitors[1] || null,
    topThreeCompetitors[2] || null,
  ];

  const handleOpenDetail = (competitor: Competitor) => {
    setDetail(competitor);
  };

  const getGradient = (index: number): string => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-[#FFF5CC] via-[#FFD770] to-[#D6A700]";
      case 1:
        return "bg-gradient-to-br from-[#F0F0F0] via-[#D9D9D9] to-[#A0A0A0]";
      case 2:
        return "bg-gradient-to-br from-[#F4E8DC] via-[#D7B58B] to-[#A1784F]";
      default:
        return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500";
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {topThreeCompetitors.map((competitor, index) => {
          if (!competitor) return null;
          const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

          return (
            <div
              key={competitor.id}
              onClick={() => setDetail(competitor)}
              className={`
                flex items-center justify-between p-3
                rounded-lg cursor-pointer
                ${getGradient(index)}
              `}
            >
              <div className="flex items-center gap-4">
                <Image
                  src={competitor.profilePictureUrl}
                  alt={competitor.firstName}
                  width={56}
                  height={56}
                  className="rounded-lg object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-black font-medium text-lg">
                    {shortName}
                  </span>
                  <span className="text-black/80 text-base">
                    {getDisplayScore(competitor)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-black text-sm">AVG.</span>
                <span className="text-black font-medium text-base">
                  {competitor.avgRank12
                    ? competitor.avgRank12.toFixed(1)
                    : "N/A"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:flex justify-center items-end gap-4">
        <PodiumCard
          competitor={second}
          index={1}
          size="small"
          onClick={handleOpenDetail}
          getGradient={getGradient}
        />
        <PodiumCard
          competitor={first}
          index={0}
          size="large"
          onClick={handleOpenDetail}
          getGradient={getGradient}
        />
        <PodiumCard
          competitor={third}
          index={2}
          size="small"
          onClick={handleOpenDetail}
          getGradient={getGradient}
        />
      </div>

      {detail && (
        <CompetitorDetailModal
          competitor={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
};

export default ScrollablePodiumView;
