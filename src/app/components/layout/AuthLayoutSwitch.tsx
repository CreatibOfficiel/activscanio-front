"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AUTH_CHROME_PATHS } from "@/app/config/routes";
import { matchesAnyPath } from "@/app/utils/path-matching";

/**
 * Renders children only on authenticated routes (i.e. NOT sign-in/sign-up).
 * Unlike Clerk's <SignedIn>, this uses the pathname instead of auth state,
 * so the layout chrome (navbar, sidebar) stays visible even when
 * the Clerk session token is temporarily stale.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (matchesAnyPath(pathname, AUTH_CHROME_PATHS)) return null;
  return <>{children}</>;
}

/**
 * Renders children only on public auth routes (sign-in, sign-up).
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!matchesAnyPath(pathname, AUTH_CHROME_PATHS)) return null;
  return <>{children}</>;
}
