import { FC, useContext, useState } from "react";
import Image from "next/image";
import { Competitor, getDisplayScore } from "@/app/models/Competitor";
import CompetitorDetailModal from "./CompetitorDetailModal";
import EditCompetitorButton from "./EditCompetitorButton";
import { AppContext } from "@/app/context/AppContext";

interface Props {
  competitor: Competitor;
}

const RankedCompetitorItem: FC<Props> = ({ competitor }) => {
  const [showModal, setShowModal] = useState(false);
  const { baseCharacters } = useContext(AppContext);
  const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

  // Find the base character for this competitor
  const foundBaseChar = competitor.characterVariantId
    ? baseCharacters.find((bc) =>
        bc.variants?.some((v) => v.id === competitor.characterVariantId)
      )
    : null;
  const foundVariantChar = competitor.characterVariantId
    ? baseCharacters
        .flatMap((bc) => bc.variants)
        .find((v) => v.id === competitor.characterVariantId)
    : null;

  const handleItemClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="p-2 pt-0 rounded cursor-pointer flex items-center justify-between">
        {/* Rank + Avatar + Name + ELO */}
        <div
          className="flex items-center gap-3 flex-grow"
          onClick={handleItemClick}
        >
          <span className="text-neutral-500 font-bold">{competitor.rank}</span>
          <Image
            src={competitor.profilePictureUrl}
            alt={competitor.firstName}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <div className="flex flex-col">
            <div className="flex flex-col">
              <span className="text-neutral-200 text-base font-semibold">
                {shortName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">
                  {getDisplayScore(competitor)}
                </span>
                {foundBaseChar && (
                  <span className="text-xs text-neutral-500">
                    • {foundBaseChar.name}
                    {foundVariantChar && ` (${foundVariantChar.label})`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AVG + Edit Button */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end" onClick={handleItemClick}>
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
