'use client';

import { FC, ReactNode } from 'react';
import Link from 'next/link';

interface SettingsLinkProps {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

export const SettingsLink: FC<SettingsLinkProps> = ({
  href,
  icon,
  title,
  subtitle,
}) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-750 active:bg-neutral-700 transition-colors min-h-[64px]"
    >
      <span className="text-2xl flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-bold text-white">{title}</h3>
        {subtitle && (
          <p className="text-sub text-neutral-400 truncate">{subtitle}</p>
        )}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5 text-neutral-500 flex-shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </Link>
  );
};

interface SettingsInfoProps {
  icon: ReactNode;
  title: string;
  value: string;
}

export const SettingsInfo: FC<SettingsInfoProps> = ({ icon, title, value }) => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 min-h-[64px]">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-bold text-white">{title}</h3>
        <p className="text-sub text-neutral-400">{value}</p>
      </div>
    </div>
  );
};
