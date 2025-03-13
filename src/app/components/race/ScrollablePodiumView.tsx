import { FC, useState } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import CompetitorDetailModal from "../competitor/CompetitorDetailModal";

interface Props {
  topThreeCompetitors: Competitor[];
}

const ScrollablePodiumView: FC<Props> = ({ topThreeCompetitors }) => {
  const [detail, setDetail] = useState<Competitor | null>(null);

  const getBackgroundColor = (index: number): string => {
    switch (index) {
      case 0:
        return "bg-gold-500";
      case 1:
        return "bg-silver-500";
      case 2:
        return "bg-bronze-500";
      default:
        return "bg-neutral-100";
    }
  };

  const getEmojiIcon = (index: number): string => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "⭐";
    }
  };

  return (
    <div className="flex space-x-4 overflow-x-auto">
      {topThreeCompetitors.map((c, index) => (
        <div
          key={c.id}
          className="relative w-40 h-52 rounded bg-neutral-700 cursor-pointer"
          onClick={() => setDetail(c)}
        >
          {/* Photo */}
          <Image
            src={c.profilePictureUrl}
            alt={c.firstName}
            width={160}
            height={208}
            className="object-cover rounded"
          />
          {/* Index icon */}
          <div
            className={`absolute top-2 right-2 w-8 h-8 rounded flex items-center justify-center ${getBackgroundColor(
              index
            )}`}
          >
            <span>{getEmojiIcon(index)}</span>
          </div>
          {/* Name + stats at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
            <p className="text-white text-heading">
              {c.firstName} {c.lastName[0]}.
            </p>
            <div className="flex justify-between text-neutral-300">
              <div>
                <p className="text-bold">Élo: <span className="text-regular">{c.elo}</span></p>
              </div>
              <div>
                <p className="text-bold">Avg: <span className="text-regular">{c.avgRank12.toFixed(1)}</span></p>
              </div>
            </div>
          </div>
        </div>
      ))}
      {detail && (
        <CompetitorDetailModal
          competitor={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
};

export default ScrollablePodiumView;
