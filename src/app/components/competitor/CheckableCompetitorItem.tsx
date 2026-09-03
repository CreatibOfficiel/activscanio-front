import { FC } from "react";
import Image from "next/image";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { Competitor } from "@/app/models/Competitor";
import { MdCheck } from "react-icons/md";
import { formatCompetitorName } from "@/app/utils/formatters";
import { characterLabel } from "@/app/utils/character-label";

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
  // Two people can play the same character in different colours. Without the
  // variant shown here, the list gives no way to tell them apart.
  const character = characterLabel(competitor.characterVariant);

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

      <div className="min-w-0 flex-1">
        <span className="block text-base text-neutral-100 truncate">
          {shortName}
        </span>
        {character && (
          <span className="block text-xs text-neutral-400 truncate">
            {character}
          </span>
        )}
      </div>

      {competitor.characterVariant?.imageUrl && (
        <Image
          src={competitor.characterVariant.imageUrl}
          alt=""
          width={28}
          height={28}
          className="ml-2 h-7 w-7 shrink-0 object-contain"
        />
      )}

      <div className="ml-2 mr-2">
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
