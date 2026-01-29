"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { Competitor, getDisplayScore } from "@/app/models/Competitor";
import CompetitorDetailModal from "./CompetitorDetailModal";
import EditCompetitorButton from "./EditCompetitorButton";
import { formatCompetitorName } from "@/app/utils/formatters";

interface Props {
  competitor: Competitor;
}

const RankedCompetitorItem: FC<Props> = ({ competitor }) => {
  const [showModal, setShowModal] = useState(false);

  const shortName = formatCompetitorName(competitor.firstName, competitor.lastName);
  const baseName = competitor.characterVariant?.baseCharacter?.name ?? null;
  const variantLabel = competitor.characterVariant?.label ?? null;

  return (
    <>
      <div className="p-2 pt-0 rounded cursor-pointer flex items-center justify-between">
        {/* Rank + Avatar + Name + Score */}
        <div
          className="flex items-center gap-3 flex-grow"
          onClick={() => setShowModal(true)}
        >
          <Image
            src={competitor.profilePictureUrl}
            alt={competitor.firstName}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />

          <div className="flex flex-col">
            <span className="text-neutral-200 text-base font-semibold">
              {shortName}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">
                {getDisplayScore(competitor)}
              </span>

              {baseName && (
                <span className="text-xs text-neutral-500">
                  • {baseName}
                  {variantLabel &&
                    variantLabel !== "Default" &&
                    ` (${variantLabel})`}
                </span>
              )}
              {competitor.provisional && competitor.raceCount && (
                <span className="text-xs text-primary-400">
                  • En placement ({competitor.raceCount}/5)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AVG + Edit */}
        <div className="flex items-center gap-3">
          <div
            className="flex flex-col items-end"
            onClick={() => setShowModal(true)}
          >
            <span className="text-xs uppercase text-neutral-400">Avg</span>
            <span className="text-neutral-100 font-semibold">
              {competitor.avgRank12 ? competitor.avgRank12.toFixed(1) : "N/A"}
            </span>
          </div>
          <EditCompetitorButton competitor={competitor} />
        </div>
      </div>

      {showModal && (
        <CompetitorDetailModal
          competitor={competitor}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default RankedCompetitorItem;
