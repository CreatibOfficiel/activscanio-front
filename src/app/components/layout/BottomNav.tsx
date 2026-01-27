"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdLeaderboard,
  MdFlag,
  MdCasino,
  MdPerson,
} from "react-icons/md";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide navigation during onboarding
  if (pathname.startsWith("/onboarding")) {
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
