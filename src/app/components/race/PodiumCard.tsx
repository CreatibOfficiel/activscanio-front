"use client";

import { FC } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";

interface PodiumCardProps {
    competitor: Competitor | null;
    index: number;              // 0=1er, 1=2e, 2=3e
    size?: "large" | "small";
    onClick: (competitor: Competitor) => void;
    getGradient: (index: number) => string;
}

const PodiumCard: FC<PodiumCardProps> = ({
    competitor,
    index,
    size = "small",
    onClick,
    getGradient,
}) => {
    if (!competitor) return null;

    const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;
    const gradientBg = getGradient(index);

    // Different height for 1st / 2nd+3rd
    const cardHeight = size === "large" ? "h-[320px]" : "h-[280px]";

    const handleClick = () => {
        onClick(competitor);
    };

    return (
        <div
            onClick={handleClick}
            className={`
        relative flex flex-col
        rounded-lg overflow-hidden
        cursor-pointer
        ${gradientBg} ${cardHeight} w-40 md:w-44
        p-2 hover:opacity-90 transition-opacity
      `}
        >
            <div className="w-full flex-shrink-0">
                <Image
                    src={competitor.profilePictureUrl}
                    alt={competitor.firstName}
                    width={300}
                    height={200}
                    className="w-full rounded-lg object-cover"
                />
            </div>

            <div className="p-4 flex flex-col items-center text-center text-black flex-grow">
                <span className="text-xl font-bold">{shortName}</span>

                <div className="flex gap-8 mt-3">
                    {/* ELO */}
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold uppercase">ELO</span>
                        <span className="text-lg font-bold">
                            {Math.round(competitor.elo)}
                        </span>
                    </div>
                    {/* AVG */}
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold uppercase">AVG</span>
                        <span className="text-lg font-bold">
                            {competitor.avgRank12.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PodiumCard;
