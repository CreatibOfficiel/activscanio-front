import { FC } from "react";
import { MdEdit } from "react-icons/md";
import { useRouter } from "next/navigation";
import { Competitor } from "@/app/models/Competitor";

interface Props {
  competitor: Competitor;
  className?: string;
}

const EditCompetitorButton: FC<Props> = ({ competitor, className = "" }) => {
  const router = useRouter();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/competitors/edit/${competitor.id}`);
  };

  return (
    <button
      onClick={handleEdit}
      className={`rounded-full bg-neutral-700 hover:bg-neutral-600 p-2 transition-colors ${className}`}
      aria-label="Éditer le compétiteur"
    >
      <MdEdit className="text-lg text-neutral-200" />
    </button>
  );
};

export default EditCompetitorButton;
