import { FC } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";

interface Props {
  competitor: Competitor;
  isSelected: boolean;
  toggleSelection: (competitor: Competitor) => void;
}

const CheckableCompetitorItem: FC<Props> = ({
  competitor,
  isSelected,
  toggleSelection,
}) => {
  const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

  return (
    <div
      className={`h-16 flex items-center px-3 rounded cursor-pointer border ${
        isSelected
          ? "bg-primary-900 border-primary-500"
          : "bg-neutral-800 border-transparent"
      }`}
      onClick={() => toggleSelection(competitor)}
    >
      {/* Checkbox style */}
      <div
        className={`w-6 h-6 rounded flex items-center justify-center mr-4 ${
          isSelected
            ? "bg-primary-500 border-primary-500"
            : "bg-neutral-700 border border-neutral-500"
        }`}
      >
        {isSelected && <span className="text-neutral-900 text-xs">✔</span>}
      </div>

      {/* Avatar */}
      <Image
        src={competitor.profilePictureUrl}
        alt={competitor.firstName}
        width={40} // equivalent to w-10
        height={40} // equivalent to h-10
        className="rounded-full object-cover mr-3"
      />

      {/* Name */}
      <span className="text-neutral-300 text-regular">{shortName}</span>
    </div>
  );
};

export default CheckableCompetitorItem;
