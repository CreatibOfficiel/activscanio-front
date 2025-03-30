"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import CompetitorDetailModal from "../competitor/CompetitorDetailModal";
import Confetti from "react-confetti";
// Import de la sous-composante PodiumCard (fichier que tu viens de créer)
import PodiumCard from "./PodiumCard";

interface Props {
  topThreeCompetitors: Competitor[];
}

const ScrollablePodiumView: FC<Props> = ({ topThreeCompetitors }) => {
  const [detail, setDetail] = useState<Competitor | null>(null);

  // On s'assure d'avoir 3 compétiteurs
  const [first, second, third] = [
    topThreeCompetitors[0] || null,
    topThreeCompetitors[1] || null,
    topThreeCompetitors[2] || null,
  ];

  // Au clic sur une carte, on ouvre le détail
  const handleOpenDetail = (competitor: Competitor) => {
    setDetail(competitor);
  };

  // Dégradé de fond selon l'index
  const getGradient = (index: number): string => {
    switch (index) {
      case 0: // OR
        return "bg-gradient-to-br from-[#FFF5CC] via-[#FFD770] to-[#D6A700]";
      case 1: // ARGENT
        return "bg-gradient-to-br from-[#F0F0F0] via-[#D9D9D9] to-[#A0A0A0]";
      case 2: // BRONZE
        return "bg-gradient-to-br from-[#F4E8DC] via-[#D7B58B] to-[#A1784F]";
      default:
        return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500";
    }
  };

  return (
      <>
        {/* EASTER EGG : confettis si le premier est "Joran" */}
        {first && first.firstName === "Joran" && (
            <Confetti style={{ position: "fixed", top: 0, left: 0, zIndex: 50 }} />
        )}

        {/* VERSION MOBILE (liste verticale) */}
        <div className="flex flex-col gap-3 md:hidden">
          {topThreeCompetitors.map((competitor, index) => {
            if (!competitor) return null;
            const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

            return (
                <div
                    key={competitor.id}
                    onClick={() => setDetail(competitor)}
                    className={`
                flex items-center justify-between p-3
                rounded-lg cursor-pointer
                ${getGradient(index)}
              `}
                >
                  <div className="flex items-center gap-4">
                    <Image
                        src={competitor.profilePictureUrl}
                        alt={competitor.firstName}
                        width={56}
                        height={56}
                        className="rounded-lg object-cover"
                    />
                    <div className="flex flex-col">
                  <span className="text-black font-medium text-lg">
                    {shortName}
                  </span>
                      <span className="text-black/80 text-base">
                    {Math.round(competitor.elo)}
                  </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-black text-sm">AVG.</span>
                    <span className="text-black font-medium text-base">
                  {competitor.avgRank12.toFixed(1)}
                </span>
                  </div>
                </div>
            );
          })}
        </div>

        {/* VERSION DESKTOP (3 cartes : 2e, 1er, 3e) */}
        <div className="hidden md:flex justify-center items-end gap-4">
          <PodiumCard
              competitor={second}
              index={1}
              size="small"
              onClick={handleOpenDetail}
              getGradient={getGradient}
          />
          <PodiumCard
              competitor={first}
              index={0}
              size="large"
              onClick={handleOpenDetail}
              getGradient={getGradient}
          />
          <PodiumCard
              competitor={third}
              index={2}
              size="small"
              onClick={handleOpenDetail}
              getGradient={getGradient}
          />
        </div>

        {/* Modal de détails */}
        {detail && (
            <CompetitorDetailModal
                competitor={detail}
                onClose={() => setDetail(null)}
            />
        )}
      </>
  );
};

export default ScrollablePodiumView;