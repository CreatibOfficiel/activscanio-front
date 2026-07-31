import { trimText } from '../formatters';

/**
 * `trimText` was called `normalizeText`, and the name was the trap.
 *
 * "Normalize" in a French-language app reads as "fold the accents" — that is
 * what Unicode normalization means, and it is what two separate call sites
 * assumed it did. It only ever called `.trim()`. Both sites, on finding it
 * did not fold, wrote their own inline folder rather than fixing the shared
 * one, so the app carried three spellings of the same idea.
 *
 * The fix was NOT to make it fold. Its one real caller is the add-pilote
 * form, which passes the result straight to the API to be stored. Folding
 * there would persist "Aurele" for a man who writes his name "Aurèle" —
 * silent data corruption, and unrecoverable once saved. So it keeps
 * trim-only behaviour and takes a name that admits it, and search folding
 * lives in `search-text.ts` where nothing is ever written to the database.
 */
describe('trimText', () => {
  it('trims surrounding whitespace', () => {
    expect(trimText('  Aurèle  ')).toBe('Aurèle');
    expect(trimText('Léo\n')).toBe('Léo');
    expect(trimText('\t Élisa \t')).toBe('Élisa');
  });

  it('KEEPS accents — this is a name on its way to the database', () => {
    // The whole reason this function did not become an accent folder.
    expect(trimText('Aurèle')).toBe('Aurèle');
    expect(trimText('Élisa')).toBe('Élisa');
    expect(trimText('Jérôme')).toBe('Jérôme');
  });

  it('KEEPS case — "Dupont" must not be stored as "dupont"', () => {
    expect(trimText('Dupont')).toBe('Dupont');
    expect(trimText('  McGregor ')).toBe('McGregor');
  });

  it('leaves inner whitespace alone', () => {
    expect(trimText('  Jean Pierre  ')).toBe('Jean Pierre');
  });

  it('handles an empty or all-whitespace string', () => {
    expect(trimText('')).toBe('');
    expect(trimText('   ')).toBe('');
  });
});
