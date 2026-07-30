/**
 * Route lists shared by the layout chrome, the onboarding guard and the
 * middleware.
 *
 * This module must stay import-free: `middleware.ts` runs on the Edge runtime
 * and pulling in React or `react-icons` from here would break the build.
 * Anything needing components belongs in `navigation.ts` instead.
 */

/**
 * Task flows that hide the mobile bottom nav.
 *
 * Longer than SIDEBAR_HIDDEN_PATHS by four entries. The two lists were meant
 * to be identical — the sidebar's copy was simply never updated when those
 * flows were added (its comment still only mentions race creation). Aligning
 * them is a behaviour change on desktop, so it is handled separately rather
 * than smuggled into an extraction.
 */
export const BOTTOM_NAV_HIDDEN_PATHS = [
  '/onboarding',
  '/races/add',
  '/races/score-setup',
  '/races/summary',
  '/betting/place-bet',
  '/betting/live/create',
  '/competitors/add',
  '/competitors/edit',
  '/tv',
] as const;

/** Task flows that hide the desktop sidebar. */
export const SIDEBAR_HIDDEN_PATHS = [
  '/onboarding',
  '/races/add',
  '/races/score-setup',
  '/races/summary',
  '/tv',
] as const;

/**
 * Routes rendered without the layout's chrome padding.
 *
 * Same contents as SIDEBAR_HIDDEN_PATHS today, but a distinct concern: this
 * one drives padding, the other visibility. Keep them separate so a future
 * route can opt into one without the other.
 */
export const FULLSCREEN_PATHS = [
  '/onboarding',
  '/races/add',
  '/races/score-setup',
  '/races/summary',
  '/tv',
] as const;

/**
 * Clerk pages, which render without the authenticated chrome.
 *
 * Deliberately excludes `/tv/display`: the TV view keeps its own chrome
 * handling through the hidden-path lists above.
 */
export const AUTH_CHROME_PATHS = ['/sign-in', '/sign-up'] as const;

/** Routes that skip the onboarding completion check. */
export const ONBOARDING_EXEMPT_PATHS = [
  '/tv/display',
  '/sign-in',
  '/sign-up',
] as const;

/**
 * Public routes, in Clerk's `createRouteMatcher` pattern syntax.
 *
 * Kept as explicit patterns rather than derived from a plain path list: the
 * sign-in and sign-up entries match sub-routes, the other two do not.
 */
export const PUBLIC_ROUTE_MATCHERS = [
  '/tv/display',
  '/api/webhooks/clerk',
  '/sign-in(.*)',
  '/sign-up(.*)',
] as const;
