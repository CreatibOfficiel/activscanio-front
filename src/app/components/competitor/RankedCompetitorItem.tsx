import { FC, useState } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import CompetitorDetailModal from "./CompetitorDetailModal";
import { MdShowChart, MdPercent } from "react-icons/md"; 

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
        className="bg-neutral-800 p-3 rounded cursor-pointer 
                   flex items-center justify-between"
      >
        {/* Left side: rank + avatar + name */}
        <div className="flex items-center space-x-2">
          <div className="text-right pr-2">
            <span className="text-neutral-500 text-bold">
              {competitor.rank}
            </span>
          </div>

          <Image
            src={competitor.profilePictureUrl}
            alt={competitor.firstName}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <span className="text-neutral-300 text-regular">{shortName}</span>
        </div>

        {/* Right side: ELO + Avg */}
        <div className="flex space-x-8">
          {/* ELO Column */}
          <div className="flex flex-col items-center w-12">
            <MdShowChart color="#cbd6e1" size={16} />
            <p className="text-sub text-neutral-300 text-center">
              {competitor.elo}
            </p>
          </div>
          {/* Average Column */}
          <div className="flex flex-col items-center">
            <MdPercent color="#cbd6e1" size={16} />
            <p className="text-sm text-neutral-300">
              {competitor.avgRank12.toFixed(1)}
            </p>
          </div>
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
