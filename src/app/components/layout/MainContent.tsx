'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FULLSCREEN_PATHS } from '@/app/config/routes';
import { matchesAnyPath } from '@/app/utils/path-matching';

export default function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = matchesAnyPath(pathname, FULLSCREEN_PATHS);

  return (
    <main className={isFullScreen ? '' : 'pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64'}>
      {children}
    </main>
  );
}
