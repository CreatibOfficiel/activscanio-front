'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FULLSCREEN_PATHS } from '@/app/config/routes';
import { matchesAnyPath } from '@/app/utils/path-matching';

export default function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = matchesAnyPath(pathname, FULLSCREEN_PATHS);

  /**
   * The bottom padding clears the nav bar AND the add button that now
   * straddles its top edge.
   *
   * It was 5rem, which was exactly the bar. The button sticks up 36px above
   * that, and the reference design lets it cover the last row of the list
   * underneath — which is the precise complaint that moved the button off the
   * page in the first place. Copying the overlap would have reintroduced the
   * bug in a new position, so the padding grows instead: 5rem + 36px, rounded
   * to 8rem for a little breathing room under the glow.
   *
   * Unchanged on desktop, where the bar is hidden and the sidebar takes over.
   */
  return (
    <main className={isFullScreen ? '' : 'pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64'}>
      {children}
    </main>
  );
}
