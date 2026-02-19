"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

/**
 * Renders children only on authenticated routes (i.e. NOT sign-in/sign-up).
 * Unlike Clerk's <SignedIn>, this uses the pathname instead of auth state,
 * so the layout chrome (navbar, sidebar) stays visible even when
 * the Clerk session token is temporarily stale.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}

/**
 * Renders children only on public auth routes (sign-in, sign-up).
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}
