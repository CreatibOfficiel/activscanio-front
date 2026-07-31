import { faqSections } from '../FAQData';

/**
 * FAQ integrity.
 *
 * A help page fails silently: nothing crashes when it describes a feature
 * that no longer exists, it just tells people to do something impossible.
 * This file had 38 mentions of the betting system months after the code was
 * deleted. These tests catch the next drift of that kind.
 */
describe('faqSections', () => {
  const allText = faqSections
    .flatMap((s) => [
      s.title,
      s.summary,
      ...(s.points ?? []),
      s.technicalDetails ?? '',
    ])
    .join('\n');

  it('has no duplicate section ids', () => {
    const ids = faqSections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every section a title, a summary and an icon', () => {
    for (const section of faqSections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.summary.length).toBeGreaterThan(0);
      expect(section.icon.length).toBeGreaterThan(0);
    }
  });

  it('never describes the betting system, which no longer exists', () => {
    // Deliberately broad. "pari" also catches "parier", "pariable", "paris".
    for (const forbidden of [
      /\bparis\b/i,
      /\bparier\b/i,
      /\bpariez\b/i,
      /\bpariable\b/i,
      /\bcote[s]?\b/i,
      /boost x2/i,
      /podium parfait/i,
      /best odds/i,
    ]) {
      expect(allText).not.toMatch(forbidden);
    }
  });

  it('covers both sports', () => {
    expect(allText).toMatch(/ping-pong/i);
    expect(allText).toMatch(/mario kart/i);
  });

  it('states the ping-pong scoring rules', () => {
    const rules = faqSections.find((s) => s.id === 'pingpong-rules');
    expect(rules).toBeDefined();

    const text = [
      rules!.summary,
      ...(rules!.points ?? []),
      rules!.technicalDetails ?? '',
    ].join('\n');

    // The three facts someone actually needs before recording a match.
    expect(text).toMatch(/11/);
    expect(text).toMatch(/2 points d.écart/i);
    expect(text).toMatch(/3 sets/i);
  });

  it('quotes the real calibration threshold', () => {
    // The backend requires 8 weighted matches (PROVISIONAL_MIN_MATCHES).
    // A FAQ quoting 5 would send people looking for a rank they cannot have.
    const ranking = faqSections.find((s) => s.id === 'pingpong-ranking-rules');
    expect(ranking).toBeDefined();

    const text = [
      ranking!.summary,
      ...(ranking!.points ?? []),
      ranking!.technicalDetails ?? '',
    ].join('\n');

    expect(text).toMatch(/8 matchs/);
  });

  it('does not promise a diversity requirement that was removed', () => {
    const ranking = faqSections.find((s) => s.id === 'pingpong-ranking-rules')!;
    const points = (ranking.points ?? []).join('\n');

    // The bullet list is what most people read. It must not state that
    // facing different opponents is required — it is measured, not required.
    expect(points).not.toMatch(/4 adversaires diff/i);
  });
});
