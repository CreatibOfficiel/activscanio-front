import { FC, useState } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import CompetitorDetailModal from "./CompetitorDetailModal";

interface Props {
  competitor: Competitor;
}

const RankedCompetitorItem: FC<Props> = ({ competitor }) => {
  const [showModal, setShowModal] = useState(false);
  const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="p-2 pt-0 rounded cursor-pointer
                   flex items-center justify-between"
      >
        {/* Rank + Avatar + Name + ELO */}
        <div className="flex items-center gap-3">
          <span className="text-neutral-500 font-bold">{competitor.rank}</span>
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
            <span className="text-sm text-neutral-400">
              {competitor.elo.toFixed(0)}
            </span>
          </div>
        </div>

        {/* AVG only */}
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase text-neutral-400">Avg</span>
          <span className="text-neutral-100 font-semibold">
            {competitor.avgRank12.toFixed(1)}
          </span>
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
