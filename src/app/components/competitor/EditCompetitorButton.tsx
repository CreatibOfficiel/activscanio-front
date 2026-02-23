import { FC } from "react";
import { MdEdit } from "react-icons/md";
import { useRouter } from "next/navigation";
import { Competitor } from "@/app/models/Competitor";
import { useCurrentUserData } from "@/app/hooks/useCurrentUserData";

interface Props {
  competitor: Competitor;
  className?: string;
}

const EditCompetitorButton: FC<Props> = ({ competitor, className = "" }) => {
  const router = useRouter();
  const { userData } = useCurrentUserData();

  if (userData?.competitorId !== competitor.id) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/competitors/edit/${competitor.id}`);
  };

  return (
    <button
      onClick={handleEdit}
      className={`p-2 rounded-xl text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-200 shadow-sm group ${className}`}
      aria-label="Éditer le pilote"
      title="Éditer le pilote"
    >
      <MdEdit className="text-xl transition-transform duration-200 group-hover:scale-110" />
    </button>
  );
};

export default EditCompetitorButton;
