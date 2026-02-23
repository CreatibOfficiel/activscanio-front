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
    <div className="fixed bottom-0 left-0 right-0 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 lg:hidden pointer-events-none">
      <nav
        className="mx-auto max-w-lg bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around p-1.5 pointer-events-auto relative overflow-hidden"
        style={{
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
        }}
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
                relative flex flex-col items-center justify-center flex-1
                py-2.5 rounded-2xl
                transition-all duration-300
                ${isActive ? "text-primary-400" : "text-neutral-400 hover:text-neutral-200"}
              `}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {/* Active Indicator Background */}
              {isActive && (
                <div className="absolute inset-x-1 inset-y-1 bg-primary-500/10 rounded-xl" />
              )}

              <div className="relative">
                <Icon className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} aria-hidden="true" />
                {isLeaderboard && state.isUnlocked && (
                  <span className="absolute -top-1 -right-1 text-[8px]" aria-hidden="true">🔊</span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
