"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdLeaderboard,
  MdFlag,
  MdCasino,
  MdPerson,
} from "react-icons/md";
import { useSoundboard } from "../../context/SoundboardContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { state, open } = useSoundboard();

  const handleLeaderboardClick = useCallback((e: React.MouseEvent) => {
    // If unlocked, clicking on Classement opens the soundboard
    if (state.isUnlocked) {
      e.preventDefault();
      open();
    }
    // Otherwise, normal navigation to classement
  }, [state.isUnlocked, open]);

  // Hide navigation during onboarding and task flows (race creation, betting, competitor management)
  const hiddenPaths = [
    '/onboarding',
    '/races/add',
    '/races/score-setup',
    '/races/summary',
    '/betting/place-bet',
    '/competitors/add',
    '/competitors/edit',
    '/tv',
  ];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  // Check if current path matches item or any of its sub-paths
  const isActiveRoute = (href: string, activePaths?: string[]) => {
    if (pathname === href) return true;
    if (activePaths) {
      return activePaths.some(path => pathname.startsWith(path));
    }
    return false;
  };

  const items = [
    { href: "/", icon: MdLeaderboard, label: "Classement" },
    { href: "/races", icon: MdFlag, label: "Courses", activePaths: ["/races"] },
    { href: "/betting", icon: MdCasino, label: "Paris", activePaths: ["/betting"] },
    { href: "/profile", icon: MdPerson, label: "Profil", activePaths: ["/profile", "/achievements"] },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 flex items-stretch justify-around px-2 z-50 lg:hidden"
      role="navigation"
      aria-label="Navigation mobile"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveRoute(item.href, item.activePaths);
        const isLeaderboard = item.href === "/";

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={isLeaderboard ? handleLeaderboardClick : undefined}
            className={`
              flex flex-col items-center justify-start flex-1
              pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
              ${isActive ? "text-primary-500" : "text-neutral-300"}
            `}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <div className="relative">
              <Icon className="text-xl" aria-hidden="true" />
              {isLeaderboard && state.isUnlocked && (
                <span className="absolute -top-1 -right-1 text-[8px]" aria-hidden="true">🔊</span>
              )}
            </div>
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
