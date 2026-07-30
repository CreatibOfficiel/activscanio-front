/**
 * Path matching helpers for route-prefix checks.
 *
 * This module has no imports on purpose: it is reachable from `middleware.ts`,
 * which runs on the Edge runtime and must not pull in React or `react-icons`.
 */

/**
 * True when `pathname` is `prefix` itself or one of its descendants.
 *
 * Unlike `String.prototype.startsWith`, this compares whole segments:
 * `/races/additional` does NOT match the prefix `/races/add`.
 */
export function matchPath(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true;
  const withSlash = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return pathname.startsWith(withSlash);
}

/** True when `pathname` matches at least one of the prefixes. */
export function matchesAnyPath(
  pathname: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some((prefix) => matchPath(pathname, prefix));
}
