import { FC } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
// On peut utiliser une icône check plus propre, par ex. react-icons
import { MdCheck } from "react-icons/md";

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
    const shortName = `${competitor.firstName} ${competitor.lastName}`;

    return (
        <div
            className={`
        flex items-center py-2 cursor-pointer transition-colors rounded
        ${
                // En survol, on peut mettre un léger fond pour repérer la ligne
                isSelected ? "bg-neutral-800" : "hover:bg-neutral-800"
            }
      `}
            onClick={() => toggleSelection(competitor)}
        >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden ml-1 mr-3 flex-shrink-0">
                <Image
                    src={competitor.profilePictureUrl}
                    alt={competitor.firstName}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                />
            </div>

            {/* Nom du joueur */}
            <span className="text-base text-neutral-100">
        {shortName}
      </span>

            {/* Checkbox à droite */}
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
