'use client';

import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdLeaderboard, MdFlag, MdCasino, MdPerson } from 'react-icons/md';

const Sidebar: FC = () => {
  const pathname = usePathname();

  // Hide navigation during onboarding and task flows (race creation)
  const hiddenPaths = ['/onboarding', '/races/add', '/races/score-setup', '/races/summary'];
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

  const navItems = [
    { href: '/', label: 'Classement', icon: MdLeaderboard },
    { href: '/races', label: 'Courses', icon: MdFlag, activePaths: ['/races'] },
    { href: '/betting', label: 'Paris', icon: MdCasino, activePaths: ['/betting'] },
    { href: '/profile', label: 'Profil', icon: MdPerson, activePaths: ['/profile', '/achievements'] },
  ];

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-neutral-800 lg:border-r lg:border-neutral-700 lg:z-40"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex flex-col flex-1 p-4">
        {/* Logo/Title */}
        <h1 className="text-heading text-primary-500 mb-8 px-4">
          MushroomBet
        </h1>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href, item.activePaths);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="text-xl flex-shrink-0" aria-hidden="true" />
                <span className="text-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
