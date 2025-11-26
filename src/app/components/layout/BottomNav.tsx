"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdLeaderboard,
  MdSportsScore,
  MdEmojiEvents,
  MdAddCircleOutline,
  MdFlag,
} from "react-icons/md";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", icon: MdLeaderboard, label: "Classement" },
    { href: "/betting/place-bet", icon: MdSportsScore, label: "Paris" },
    { href: "/betting/history", icon: MdEmojiEvents, label: "Historique" },
    { href: "/races/add", icon: MdAddCircleOutline, label: "Ajouter" },
    { href: "/races", icon: MdFlag, label: "Courses" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 h-14 flex items-center justify-around px-2 z-50 lg:hidden"
      role="navigation"
      aria-label="Navigation mobile"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center flex-1 h-full
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
              ${isActive ? "text-primary-500" : "text-neutral-300"}
            `}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <Icon className="text-xl" aria-hidden="true" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
