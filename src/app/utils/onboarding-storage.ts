/**
 * Local persistence of "this user has finished onboarding".
 *
 * Purpose is purely to avoid blocking the first paint. `OnboardingGuard` used
 * to hold `children` back on every cold load until `/users/me` answered, which
 * put a serial network hop in front of every page. Once we have seen a user
 * complete onboarding, that answer is a foregone conclusion on the next load,
 * so we render immediately and let the real check confirm in the background.
 *
 * This is a render-timing hint, never an authorisation signal. It can only ever
 * cause the app to render one frame earlier; the server response still decides
 * where the user ends up, and a stale `true` is corrected by the background
 * check the moment it lands.
 *
 * Keyed per Clerk user id on purpose: a shared key would let a second account
 * on the same device inherit the first account's "done" flag and skip the
 * blocking check it actually needs.
 */

const KEY_PREFIX = 'onboardingComplete:';

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

/**
 * True only when this exact user was previously confirmed as onboarded.
 *
 * Returns false for unknown users, during SSR, and whenever storage throws
 * (Safari private mode, disabled cookies). False is the safe answer: it means
 * "block and check", which is the old behaviour.
 */
export function hasStoredOnboardingComplete(userId: string | null | undefined): boolean {
  if (!userId || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey(userId)) === 'true';
  } catch {
    return false;
  }
}

/**
 * Records the server's verdict for this user.
 *
 * `false` clears the entry rather than storing "false": the absence of a key
 * already means "unknown, go and check", and clearing keeps a user who was
 * reset back into onboarding from being fast-pathed past it.
 */
export function setStoredOnboardingComplete(
  userId: string | null | undefined,
  complete: boolean,
): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    if (complete) {
      window.localStorage.setItem(storageKey(userId), 'true');
    } else {
      window.localStorage.removeItem(storageKey(userId));
    }
  } catch {
    // Storage unavailable — we simply lose the fast path, never correctness.
  }
}
