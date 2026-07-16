import { FC } from "react";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { Competitor } from "@/app/models/Competitor";
import { MdCheck } from "react-icons/md";
import { formatCompetitorName } from "@/app/utils/formatters";

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
  const shortName = formatCompetitorName(competitor.firstName, competitor.lastName);

  return (
    <div
      className={`
        flex items-center py-2 cursor-pointer transition-colors rounded
        ${isSelected ? "bg-neutral-800" : "hover:bg-neutral-800"}
      `}
      onClick={() => toggleSelection(competitor)}
    >
      <UserAvatar
        src={competitor.profilePictureUrl}
        name={`${competitor.firstName} ${competitor.lastName}`}
        size="md"
        className="ml-1 mr-3"
      />

      <span className="text-base text-neutral-100">{shortName}</span>

      <div className="ml-auto mr-2">
        <div
          className={`
            w-5 h-5 rounded flex items-center justify-center
            border transition-colors
            ${
              isSelected
                ? "bg-primary-500 border-primary-500"
                : "bg-neutral-900 border-neutral-500"
            }
          `}
        >
          {isSelected && <MdCheck className="text-neutral-900 text-lg" />}
        </div>
      </div>
    </div>
  );
};

export default CheckableCompetitorItem;
