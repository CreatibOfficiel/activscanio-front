"use client";

import { FC } from "react";
import { useCountdown } from "@/app/hooks/useCountdown";

interface Props {
    targetDate: Date | null;
    seasonName?: string;
}

const TVHeroCountdown: FC<Props> = ({ targetDate, seasonName = "SAISON PILOTES" }) => {
    const { time } = useCountdown(targetDate, {
        warningSeconds: 7 * 24 * 60 * 60,
        criticalSeconds: 24 * 60 * 60,
    });

    if (!targetDate) return null;

    return (
        <div className="w-full flex justify-center mb-2">
            <div className="relative overflow-hidden rounded-lg w-[70%] transform -skew-x-12 bg-gradient-to-b from-red-400 via-orange-500 to-orange-700 p-[1.5px] shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-metallic-shine" />

                <div className="bg-gradient-to-b from-red-600 via-red-500 to-orange-600 rounded-lg h-full w-full flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {/* Inner reflection top */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />

                    <div className="transform skew-x-12 flex flex-col items-center z-10 w-full">
                        <h2 className="text-xl lg:text-2xl font-black italic text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] tracking-wider uppercase">
                            {time.isExpired ? "Saison Terminée" : seasonName}
                        </h2>
                        <div className="bg-black/30 px-3 py-0.5 rounded-full mt-1 border border-orange-400/30">
                            <p className="text-white font-bold tracking-widest text-[10px] lg:text-xs drop-shadow-md uppercase">
                                {time.days.toString().padStart(2, "0")}J : {time.hours.toString().padStart(2, "0")}H : {time.minutes.toString().padStart(2, "0")}M
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TVHeroCountdown;
