import { matchesAnyPath } from './path-matching';

/**
 * Whether a navigation entry should render as active for the current pathname.
 *
 * An entry is active on an exact match, or when the pathname falls under one
 * of its `activePaths` — that is how `/profile` stays lit on `/achievements`.
 */
export function isActiveRoute(
  pathname: string,
  href: string,
  activePaths?: readonly string[],
): boolean {
  if (pathname === href) return true;
  return activePaths ? matchesAnyPath(pathname, activePaths) : false;
}
