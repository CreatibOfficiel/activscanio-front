"use client";

import { FC } from "react";
import Image from "next/image";

interface PodiumItem {
  id: string;
  name: string;
  imageUrl?: string;
  score: number;
  scoreLabel: string;
  subtitle?: string;
  rank: number;
}

interface Props {
  items: PodiumItem[];
  title?: string;
}

const TVPodium: FC<Props> = ({ items, title }) => {
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
        className="flex flex-col items-center animate-podium-rise"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {/* Crown for 1st place */}
        {config.crown && (
          <div className="animate-crown-drop mb-2">
            <span className="text-6xl drop-shadow-xl">👑</span>
          </div>
        )}

        {/* Avatar with glow */}
        <div className={`relative mb-4 ${config.glow} rounded-full`}>
          <div
            className={`ring-4 ${config.border} ring-offset-4 ring-offset-neutral-900 rounded-full overflow-hidden`}
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
                className={`flex items-center justify-center bg-neutral-700 text-4xl font-bold text-neutral-300`}
                style={{
                  width: config.avatarSize,
                  height: config.avatarSize,
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Medal badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-4xl">
            {config.medal}
          </div>
        </div>

        {/* Name */}
        <h3
          className={`font-bold text-white text-center mt-3 ${
            position === 1 ? "text-2xl" : "text-xl"
          }`}
        >
          {item.name}
        </h3>

        {/* Subtitle */}
        {item.subtitle && (
          <p className="text-neutral-400 text-base mt-1">{item.subtitle}</p>
        )}

        {/* Podium base */}
        <div
          className={`
            mt-4 w-48 rounded-t-2xl ${config.gradient} ${config.height}
            flex flex-col items-center justify-start pt-6
            transform transition-transform hover:scale-105
            border-t-4 ${config.border}
          `}
        >
          <span className={`text-4xl font-black ${config.textColor}`}>
            {typeof item.score === "number"
              ? item.score.toFixed(item.scoreLabel === "pts" ? 1 : 0)
              : item.score}
          </span>
          <span
            className={`text-sm font-bold uppercase tracking-wider ${config.textColor} opacity-70 mt-1`}
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
        <h2 className="text-3xl font-bold text-white mb-8">{title}</h2>
      )}

      {/* 3D Podium layout */}
      <div
        className="flex justify-center items-end gap-8 pt-20"
        style={{ perspective: "1200px" }}
      >
        {/* 2nd place - left */}
        <div className="transform">{renderPodiumPlace(second, 2, 200)}</div>

        {/* 1st place - center, elevated */}
        <div className="transform -mt-16">
          {renderPodiumPlace(first, 1, 400)}
        </div>

        {/* 3rd place - right */}
        <div className="transform">{renderPodiumPlace(third, 3, 100)}</div>
      </div>
    </div>
  );
};

export default TVPodium;
