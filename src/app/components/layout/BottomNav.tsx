"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";

/**
 * BottomNav is a persistent bottom navigation bar,
 * styled similarly to a mobile app navigation.
 */
const BottomNav: FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Classement", route: "/", icon: "📈" },
    { label: "Ajouter", route: "/races/add", icon: "➕" },
    { label: "Courses", route: "/races", icon: "🏁" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-neutral-800 border-t border-neutral-700 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.route;
        return (
          <Link href={item.route} key={item.route}>
            <div className="flex flex-col items-center cursor-pointer">
              <span
                className={`text-xl ${
                  isActive ? "text-primary-500" : "text-neutral-300"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-regular ${
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
