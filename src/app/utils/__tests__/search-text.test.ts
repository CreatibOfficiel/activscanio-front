import { foldForSearch, matchesSearch } from '../search-text';

/**
 * Accent folding for search boxes.
 *
 * The office roster is French: Aurèle, Élisa, Léo. Typing an accent on a
 * phone keyboard is a long-press, so nobody does it in a search box. A
 * search that only matches the accented spelling misses those people
 * entirely — you type "aurele" and the list comes back empty, which reads
 * as "this person is not in the app" rather than "you spelled it wrong".
 *
 * This lives apart from `trimText` (formerly `normalizeText`) on purpose.
 * Folding is for comparing, never for storing: the name saved to the
 * database keeps its accents, because "Aurele" is not how he writes it.
 */
describe('foldForSearch', () => {
  it('folds the accents in the names actually on the roster', () => {
    expect(foldForSearch('Aurèle')).toBe('aurele');
    expect(foldForSearch('Élisa')).toBe('elisa');
    expect(foldForSearch('Léo')).toBe('leo');
  });

  it('folds case at the same time as accents', () => {
    expect(foldForSearch('ÉLISA')).toBe('elisa');
    expect(foldForSearch('AuRèLe')).toBe('aurele');
  });

  it('handles the rest of the French accent set', () => {
    expect(foldForSearch('Françoise')).toBe('francoise');
    expect(foldForSearch('Chloë')).toBe('chloe');
    expect(foldForSearch('Anaïs')).toBe('anais');
    expect(foldForSearch('Jérôme')).toBe('jerome');
    expect(foldForSearch('Gaëtan')).toBe('gaetan');
  });

  it('trims surrounding whitespace, like the old inline helpers did', () => {
    expect(foldForSearch('  Léo  ')).toBe('leo');
  });

  it('leaves unaccented text alone', () => {
    expect(foldForSearch('Thomas')).toBe('thomas');
    expect(foldForSearch('')).toBe('');
  });

  it('folds a precomposed and a decomposed accent to the same thing', () => {
    // "é" typed as one codepoint vs "e" + combining acute. A macOS paste and
    // an Android keyboard can disagree on this for the same visible name.
    expect(foldForSearch('é')).toBe(foldForSearch('é'));
  });
});

/**
 * `matchesSearch` is the substring test both search boxes run. It exists so
 * the race entry page and the ping-pong picker cannot drift apart: one
 * function, one behaviour, two call sites.
 */
describe('matchesSearch', () => {
  it('matches an accented name from an unaccented query', () => {
    expect(matchesSearch('Aurèle Dupont', 'aurele')).toBe(true);
    expect(matchesSearch('Élisa Martin', 'elisa')).toBe(true);
    expect(matchesSearch('Léo Bernard', 'leo')).toBe(true);
  });

  it('matches an unaccented name from an accented query', () => {
    // The reverse direction: someone with an accent-capable keyboard types
    // "Aurèle" while the stored name was entered without the accent.
    expect(matchesSearch('Aurele Dupont', 'Aurèle')).toBe(true);
  });

  it('matches regardless of case', () => {
    expect(matchesSearch('Élisa Martin', 'ELISA')).toBe(true);
    expect(matchesSearch('élisa martin', 'Élisa')).toBe(true);
  });

  it('matches on the last name and mid-string', () => {
    expect(matchesSearch('Léo Bernard', 'bernard')).toBe(true);
    expect(matchesSearch('Jérôme Lefèvre', 'fev')).toBe(true);
  });

  it('treats an empty query as matching everything', () => {
    // Both call sites relied on this: an empty search box shows the full list.
    expect(matchesSearch('Aurèle Dupont', '')).toBe(true);
    expect(matchesSearch('Aurèle Dupont', '   ')).toBe(true);
  });

  it('still says no when the name genuinely does not match', () => {
    expect(matchesSearch('Aurèle Dupont', 'thomas')).toBe(false);
    expect(matchesSearch('Élisa Martin', 'zzz')).toBe(false);
  });

  it('ignores whitespace around the query', () => {
    expect(matchesSearch('Léo Bernard', '  leo  ')).toBe(true);
  });
});
