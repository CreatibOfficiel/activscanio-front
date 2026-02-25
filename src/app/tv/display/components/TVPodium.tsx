"use client";

import { FC } from "react";
import Image from "next/image";

export interface PodiumItem {
  id: string;
  name: string;
  imageUrl?: string;
  characterImageUrl?: string;
  score: number;
  scoreLabel: string;
  subtitle?: string;
  rank: number;
}

interface Props {
  items: PodiumItem[];
  title?: string;
  disableEntryAnimation?: boolean;
}

const TVPodium: FC<Props> = ({ items, title, disableEntryAnimation = false }) => {
  const [first, second, third] = [
    items[0] || null,
    items[1] || null,
    items[2] || null,
  ];

  const getMedalConfig = (position: 1 | 2 | 3) => {
    switch (position) {
      case 1:
        return {
          medal: "🥇",
          gradient:
            "bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600",
          glow: "shadow-[0_0_60px_rgba(234,179,8,0.5)]",
          border: "border-yellow-400",
          height: "h-52",
          avatarSize: 120,
          textColor: "text-yellow-900",
          crown: true,
        };
      case 2:
        return {
          medal: "🥈",
          gradient: "bg-gradient-to-b from-gray-100 via-gray-300 to-gray-500",
          glow: "shadow-[0_0_40px_rgba(156,163,175,0.4)]",
          border: "border-gray-300",
          height: "h-40",
          avatarSize: 96,
          textColor: "text-gray-800",
          crown: false,
        };
      case 3:
        return {
          medal: "🥉",
          gradient:
            "bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700",
          glow: "shadow-[0_0_40px_rgba(217,119,6,0.4)]",
          border: "border-amber-500",
          height: "h-32",
          avatarSize: 96,
          textColor: "text-amber-900",
          crown: false,
        };
    }
  };

  const renderPodiumPlace = (
    item: PodiumItem | null,
    position: 1 | 2 | 3,
    animationDelay: number
  ) => {
    if (!item) return <div className="w-48" />;

    const config = getMedalConfig(position);

    return (
      <div
        className={`flex flex-col items-center ${disableEntryAnimation ? '' : 'animate-podium-rise'}`}
        style={disableEntryAnimation ? undefined : { animationDelay: `${animationDelay}ms` }}
      >
        {/* Crown for 1st place */}
        {config.crown && (
          <div className={disableEntryAnimation ? 'mb-0.5' : 'animate-crown-drop mb-0.5'}>
            <span className="text-4xl drop-shadow-xl">
              {item.name.includes("Joran") ? "🤪" : "👑"}
            </span>
          </div>
        )}

        {/* Avatar with glow */}
        <div className={`relative mb-2 ${config.glow} rounded-full`}>
          <div
            className={`ring-2 ${config.border} ring-offset-2 ring-offset-neutral-900 rounded-full overflow-hidden relative`}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={config.avatarSize}
                height={config.avatarSize}
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className={`flex items-center justify-center bg-neutral-700 text-2xl font-bold text-neutral-300`}
                style={{
                  width: config.avatarSize,
                  height: config.avatarSize,
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Character variant small overlay */}
          {item.characterImageUrl && (
            <div className={`absolute -right-1 -bottom-1 bg-neutral-800 rounded-full p-0.5 z-10 ring-2 ${config.border}`}>
              <Image
                src={item.characterImageUrl}
                alt="Character"
                width={position === 1 ? 32 : 24}
                height={position === 1 ? 32 : 24}
                className="rounded-full object-contain"
              />
            </div>
          )}

          {/* Medal badge */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-2xl z-20">
            {config.medal}
          </div>
        </div>

        {/* Name */}
        <h3
          className={`font-bold text-white text-center mt-1.5 line-clamp-1 max-w-[10rem] ${position === 1 ? "text-lg" : "text-base"
            }`}
        >
          {item.name}
        </h3>

        {/* Subtitle */}
        {item.subtitle && (
          <p className="text-neutral-400 text-[10px] mt-0.5 text-center">{item.subtitle}</p>
        )}

        {/* Podium base */}
        <div
          className={`
            mt-2 w-36 rounded-t-lg ${config.gradient} ${config.height}
            flex flex-col items-center justify-start pt-3
            transform transition-transform hover:scale-105
            border-t-2 ${config.border}
          `}
        >
          <span className={`text-2xl font-black ${config.textColor}`}>
            {typeof item.score === "number"
              ? item.score.toFixed(item.scoreLabel === "pts" ? 1 : 0)
              : item.score}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor} opacity-70 mt-0`}
          >
            {item.scoreLabel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      )}

      {/* 3D Podium layout */}
      <div
        className="flex justify-center items-end gap-2 pt-2"
        style={{ perspective: "1200px" }}
      >
        {/* 2nd place - left */}
        <div className="transform">{renderPodiumPlace(second, 2, 200)}</div>

        {/* 1st place - center, elevated */}
        <div className="transform -mt-10">
          {renderPodiumPlace(first, 1, 400)}
        </div>

        {/* 3rd place - right */}
        <div className="transform">{renderPodiumPlace(third, 3, 100)}</div>
      </div>
    </div>
  );
};

export default TVPodium;
