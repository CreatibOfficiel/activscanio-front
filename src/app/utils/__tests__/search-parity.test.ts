import { readFileSync } from 'fs';
import { join } from 'path';
import { matchesSearch } from '../search-text';

const SRC = join(__dirname, '..', '..', '..');

/**
 * The race entry search and the ping-pong player picker must behave
 * identically.
 *
 * They did not. Both filtered a roster of French names by a typed query, and
 * both had independently discovered that `normalizeText` from formatters only
 * trimmed. Each then wrote its own folder — one called `fold`, one called
 * `normalizeText` again, shadowing the import — and the two disagreed in
 * detail: the race page's version never trimmed the query, so a trailing
 * space from a phone keyboard's autocomplete silently emptied the list.
 *
 * Two copies of one rule is one copy too many. These tests assert both that
 * the shared helper gives the right answer, and — structurally — that neither
 * call site has quietly grown its own again.
 */
describe('search parity between the two roster searches', () => {
  /** The names that motivated the fix, as they appear in the office. */
  const ROSTER = ['Aurèle Dupont', 'Élisa Martin', 'Léo Bernard', 'Thomas Petit'];

  function filterRoster(query: string): string[] {
    return ROSTER.filter((name) => matchesSearch(name, query));
  }

  it('finds each accented pilote from its unaccented spelling', () => {
    expect(filterRoster('aurele')).toEqual(['Aurèle Dupont']);
    expect(filterRoster('elisa')).toEqual(['Élisa Martin']);
    expect(filterRoster('leo')).toEqual(['Léo Bernard']);
  });

  it('shows the whole roster for an empty query', () => {
    expect(filterRoster('')).toEqual(ROSTER);
  });

  it('survives the trailing space a phone keyboard appends', () => {
    // The bug the race page had on its own: "leo " matched nothing.
    expect(filterRoster('leo ')).toEqual(['Léo Bernard']);
  });

  describe('neither call site keeps a private copy of the rule', () => {
    const CALL_SITES = [
      join(SRC, 'app', 'races', 'add', 'page.tsx'),
      join(SRC, 'app', 'components', 'pingpong', 'PlayerPicker.tsx'),
    ];

    it.each(CALL_SITES)('%s folds via the shared helper, not inline', (file) => {
      const source = readFileSync(file, 'utf8');

      // The two tells of a hand-rolled accent folder.
      expect(source).not.toMatch(/normalize\(\s*['"]NFD['"]\s*\)/);
      expect(source).not.toMatch(/\\u0300-\\u036f/);

      // And it does import the shared one.
      expect(source).toMatch(/matchesSearch/);
    });
  });
});
