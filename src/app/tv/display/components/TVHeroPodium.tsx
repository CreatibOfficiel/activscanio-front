"use client";

import { FC } from "react";
import Image from "next/image";
import { PodiumItem } from "./TVPodium";

interface Props {
    items: PodiumItem[];
}

const TVHeroPodium: FC<Props> = ({ items }) => {
    const [first, second, third] = [items[0] || null, items[1] || null, items[2] || null];

    const getRankConfig = (rank: 1 | 2 | 3) => {
        switch (rank) {
            case 1:
                return {
                    gradient: "from-yellow-200 via-yellow-400 to-yellow-600",
                    innerGradient: "from-yellow-400 via-yellow-300 to-yellow-500",
                    shadow: "shadow-[0_0_30px_rgba(234,179,8,0.4)]",
                    textColor: "text-yellow-950",
                    badgeColor: "text-yellow-600",
                    badge: "1st",
                    width: "w-[90%]",
                    height: "h-28 lg:h-32",
                    imageSize: 84,
                };
            case 2:
                return {
                    gradient: "from-gray-200 via-gray-300 to-gray-500",
                    innerGradient: "from-gray-300 via-gray-200 to-gray-400",
                    shadow: "shadow-[0_0_20px_rgba(156,163,175,0.3)]",
                    textColor: "text-gray-900",
                    badgeColor: "text-gray-400",
                    badge: "2nd",
                    width: "w-[90%]",
                    height: "h-42 lg:h-48",
                    imageSize: 72,
                };
            case 3:
                return {
                    gradient: "from-amber-300 via-amber-600 to-amber-800",
                    innerGradient: "from-amber-500 via-amber-400 to-amber-600",
                    shadow: "shadow-[0_0_20px_rgba(217,119,6,0.3)]",
                    textColor: "text-amber-950",
                    badgeColor: "text-amber-800",
                    badge: "3rd",
                    width: "w-[90%]",
                    height: "h-42 lg:h-48",
                    imageSize: 72,
                };
        }
    };

    const Card = ({ item, rank }: { item: PodiumItem; rank: 1 | 2 | 3 }) => {
        const config = getRankConfig(rank);
        const isVertical = rank !== 1;

        return (
            <div className={`relative overflow-hidden rounded-2xl ${config.width} transform -skew-x-12 bg-gradient-to-b ${config.gradient} p-[2px] ${config.shadow} transition-all`}>
                {/* Brilliance Animation Layer using the global CSS class */}
                <div className="absolute inset-0 z-20 pointer-events-none animate-brilliance-v2" />

                <div className={`bg-gradient-to-b ${config.innerGradient} rounded-xl h-full w-full relative overflow-hidden flex ${isVertical ? 'flex-col items-center justify-center p-2' : 'items-center p-3'}`}>
                    {/* Inner metallic reflection */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20" />

                    {/* Rank Badge - Simple text, no background, metal color */}
                    <div className="absolute top-1 right-4 z-30 transform skew-x-12">
                        <span className={`font-black italic drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)] tracking-tighter ${config.badgeColor} ${rank === 1 ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'}`}>
                            {config.badge}
                        </span>
                    </div>

                    <div className={`transform skew-x-12 flex ${isVertical ? 'flex-col items-center' : 'items-center justify-between w-full'} z-10 px-1`}>

                        {/* Avatar + Character */}
                        <div className={`relative flex items-center justify-center ${!isVertical ? 'w-[40%]' : 'mb-3'}`}>
                            <div className="relative">
                                {item.imageUrl ? (
                                    <div
                                        className="rounded-full overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.4)]"
                                        style={{ width: config.imageSize, height: config.imageSize }}
                                    >
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            width={config.imageSize}
                                            height={config.imageSize}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.4)] flex items-center justify-center bg-neutral-800 text-white font-black"
                                        style={{ width: config.imageSize, height: config.imageSize, fontSize: config.imageSize / 2 }}
                                    >
                                        {item.name.charAt(0)}
                                    </div>
                                )}

                                {item.characterImageUrl && (
                                    <div className={`absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-[2px] shadow-lg z-20 ring-1 ring-cyan-400`}>
                                        <Image
                                            src={item.characterImageUrl}
                                            alt="character"
                                            width={isVertical ? 32 : 40}
                                            height={isVertical ? 32 : 40}
                                            className="rounded-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className={`flex flex-col justify-center items-center text-center ${!isVertical ? 'w-[60%] pl-2' : 'w-full'}`}>
                            <h3 className={`font-black italic drop-shadow-md line-clamp-1 w-full text-center ${rank === 1 ? 'text-xl lg:text-2xl' : 'text-base lg:text-lg'} ${config.textColor}`}>
                                {item.name}
                            </h3>

                            <div className={`font-black tracking-widest drop-shadow-sm flex items-end justify-center gap-1 mt-1 ${config.textColor} opacity-90 leading-tight`}>
                                <span className={rank === 1 ? "text-xl lg:text-2xl" : "text-base lg:text-xl"}>
                                    {typeof item.score === "number" ? Math.round(item.score) : item.score}
                                </span>
                                <span className="text-[10px] font-bold opacity-80 mb-0.5">{item.scoreLabel}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full gap-4">
            {/* 1st Place */}
            {first && (
                <div className="w-full flex justify-center relative z-30">
                    <Card item={first} rank={1} />
                </div>
            )}

            {/* 2nd and 3rd Place side by side */}
            <div className="flex w-full gap-2 px-1 relative z-20 items-stretch">
                <div className="w-1/2 flex justify-end">
                    {second && <Card item={second} rank={2} />}
                </div>
                <div className="w-1/2 flex justify-start">
                    {third && <Card item={third} rank={3} />}
                </div>
            </div>
        </div>
    );
};

export default TVHeroPodium;
