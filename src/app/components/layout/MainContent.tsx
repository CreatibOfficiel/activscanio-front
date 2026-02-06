'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const fullScreenPaths = ['/onboarding', '/races/add', '/races/score-setup', '/races/summary'];

export default function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = fullScreenPaths.some(path => pathname.startsWith(path));

  return (
    <main className={isFullScreen ? '' : 'pb-20 lg:pb-0 lg:pl-64'}>
      {children}
    </main>
  );
}
