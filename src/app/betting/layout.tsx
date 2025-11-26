import { ReactNode } from 'react';

// Force dynamic rendering for all betting routes
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function BettingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
