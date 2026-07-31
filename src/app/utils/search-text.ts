/**
 * Text folding for search boxes.
 *
 * Kept apart from `formatters.ts` on purpose: everything in here is for
 * COMPARING text, never for storing it. The office roster is French — Aurèle,
 * Élisa, Léo — and typing an accent on a phone keyboard is a long-press, so
 * nobody does it in a search box. A search that only matches the accented
 * spelling returns nothing for "aurele", which reads as "he is not in the
 * app" rather than "you spelled it wrong".
 *
 * The name to store still keeps its accents. Folding a name on the way into
 * the database would persist "Aurele" for a man who writes it "Aurèle", and
 * that is not recoverable after the fact. Use `trimText` from `formatters`
 * for input destined for the API.
 */

/** Combining diacritical marks, left behind once NFD splits "é" into "e" + ´. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Strip accents and case so a query and a name can be compared as typed.
 *
 * NFD decomposes precomposed characters ("é" as one codepoint) into a base
 * letter plus a combining mark, which the regex then drops. This also makes
 * the two Unicode spellings of the same visible name compare equal — a macOS
 * paste and an Android keyboard can disagree on that for identical text.
 */
export const foldForSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim();

/**
 * Whether `haystack` contains `needle`, ignoring accents, case and
 * surrounding whitespace.
 *
 * An empty (or whitespace-only) query matches everything, so an untouched
 * search box shows the full list rather than none of it. Both roster searches
 * relied on that, and the query is trimmed because a phone keyboard's
 * autocomplete appends a space that would otherwise empty the results.
 */
export const matchesSearch = (haystack: string, needle: string): boolean => {
  const folded = foldForSearch(needle);
  if (folded === '') return true;
  return foldForSearch(haystack).includes(folded);
};
