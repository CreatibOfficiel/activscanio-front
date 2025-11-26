"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";

import { MdLeaderboard, MdAddCircleOutline, MdFlag, MdSportsScore, MdEmojiEvents } from "react-icons/md";

const BottomNav: FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Classement", route: "/", icon: <MdLeaderboard /> },
    { label: "Paris", route: "/betting/place-bet", icon: <MdSportsScore /> },
    { label: "Historique", route: "/betting/history", icon: <MdEmojiEvents /> },
    { label: "Ajouter", route: "/races/add", icon: <MdAddCircleOutline /> },
    { label: "Courses", route: "/races", icon: <MdFlag /> },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-14 bg-neutral-800 border-t border-neutral-700
                    flex justify-around items-center shadow-md z-50"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.route;
        return (
          <Link href={item.route} key={item.route}>
            <div className="flex flex-col items-center cursor-pointer transition-colors">
              {/* Icône */}
              <span
                className={`text-2xl ${
                  isActive ? "text-primary-500" : "text-neutral-300"
                }`}
              >
                {item.icon}
              </span>
              {/* Label */}
              <span
                className={`text-xs ${
                  isActive ? "text-primary-500" : "text-neutral-500"
                }`}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
