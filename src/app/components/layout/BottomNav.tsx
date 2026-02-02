"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdLeaderboard,
  MdFlag,
  MdCasino,
  MdPerson,
} from "react-icons/md";
import { toast } from "sonner";
import { useSoundboard } from "../../context/SoundboardContext";
import { useEasterEgg } from "../../hooks/useEasterEgg";

export default function BottomNav() {
  const pathname = usePathname();
  const { state, unlock, open } = useSoundboard();
  const [isShaking, setIsShaking] = useState(false);

  const handleUnlock = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    unlock();
    open();

    toast.success('Tu as découvert un secret !', {
      icon: '🎉',
      duration: 4000,
    });

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }, [unlock, open]);

  const { handleTap } = useEasterEgg({
    targetTaps: 7,
    timeWindow: 3000,
    onUnlock: handleUnlock,
  });

  const handleLeaderboardClick = useCallback((e: React.MouseEvent) => {
    if (state.isUnlocked) {
      e.preventDefault();
      open();
    } else {
      handleTap();
      // Don't prevent default - still navigate to classement
    }
  }, [state.isUnlocked, open, handleTap]);

  // Hide navigation during onboarding and task flows (race creation, betting, competitor management)
  const hiddenPaths = [
    '/onboarding',
    '/races/add',
    '/races/score-setup',
    '/races/summary',
    '/betting/place-bet',
    '/competitors/add',
    '/competitors/edit',
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
      className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 h-14 flex items-center justify-around px-2 z-50 lg:hidden"
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
              flex flex-col items-center justify-center flex-1 h-full
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
              ${isActive ? "text-primary-500" : "text-neutral-300"}
              ${isLeaderboard && isShaking ? "animate-shake-unlock" : ""}
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
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
