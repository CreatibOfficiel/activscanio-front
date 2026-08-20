import { getDateLabel } from '../formatters';

/**
 * "Cette semaine" used to mean "less than 7 days ago", which is not what the
 * label says and not how the rest of the app counts weeks.
 *
 * Everything else here runs on a Monday->Sunday cycle: betting weeks open
 * Monday and finalize Sunday, seasons are built from Monday boundaries. A
 * rolling 7-day window disagrees with all of it. Seen on a Thursday, a race
 * from the previous Friday was labelled "Cette semaine" even though it fell
 * in the week before — the group header claimed a week the race was not in.
 *
 * So the boundary is now the Monday of the current calendar week, and the
 * week just before it collapses into "Semaine derniere" rather than breaking
 * apart into one dated group per day the moment the week rolls over.
 */

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h);

// Freeze "now" so the labels are deterministic. jsdom + fake timers keep
// `new Date()` inside getDateLabel pinned to the date under test.
const labelOn = (now: Date, target: Date): string => {
  jest.useFakeTimers().setSystemTime(now);
  try {
    return getDateLabel(target.toISOString());
  } finally {
    jest.useRealTimers();
  }
};

describe('getDateLabel week boundary', () => {
  // Reference week: Monday 17 Aug 2026 -> Sunday 23 Aug 2026.
  const thursday = at(2026, 7, 20);

  it('labels days back to Monday as "Cette semaine"', () => {
    expect(labelOn(thursday, at(2026, 7, 18))).toBe('Cette semaine'); // Tue
    expect(labelOn(thursday, at(2026, 7, 17))).toBe('Cette semaine'); // Mon
  });

  it('does not claim days before Monday, even inside 7 days', () => {
    // The old rolling window called all three "Cette semaine".
    expect(labelOn(thursday, at(2026, 7, 16))).toBe('Semaine dernière'); // Sun
    expect(labelOn(thursday, at(2026, 7, 15))).toBe('Semaine dernière'); // Sat
    expect(labelOn(thursday, at(2026, 7, 14))).toBe('Semaine dernière'); // Fri
  });

  it('collapses the whole previous week into one group', () => {
    // Mon 10 Aug -> Sun 16 Aug, every day, one label.
    for (let day = 10; day <= 16; day++) {
      expect(labelOn(thursday, at(2026, 7, day))).toBe('Semaine dernière');
    }
  });

  it('stops at the week before last', () => {
    // Sun 9 Aug closes the week before that one, so it falls back to a date.
    // Asserted against the set of week labels rather than an exact date
    // string, which formatDate owns and is free to restyle.
    const weekLabels = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Semaine dernière'];
    expect(weekLabels).not.toContain(labelOn(thursday, at(2026, 7, 9)));
    expect(weekLabels).not.toContain(labelOn(thursday, at(2026, 7, 3)));
  });

  it('keeps today and yesterday ahead of the week boundary', () => {
    expect(labelOn(thursday, at(2026, 7, 20))).toBe("Aujourd'hui");
    expect(labelOn(thursday, at(2026, 7, 19))).toBe('Hier');
  });

  it('still says "Hier" on a Monday, when yesterday is last week', () => {
    // Sunday 16 Aug belongs to the previous week, but "Hier" is the more
    // useful and more precise label, so it wins over the week test.
    const monday = at(2026, 7, 17);
    expect(labelOn(monday, at(2026, 7, 16))).toBe('Hier');
    expect(labelOn(monday, at(2026, 7, 15))).toBe('Semaine dernière'); // Sat
  });

  it('treats a week straddling new year as one week', () => {
    // Mon 28 Dec 2026 -> Sun 3 Jan 2027. Computing the Monday via ISO week
    // number + getFullYear() would break here; the direct calculation does not.
    const friJan1 = at(2027, 0, 1);
    expect(labelOn(friJan1, at(2026, 11, 30))).toBe('Cette semaine'); // Wed 30 Dec
    expect(labelOn(friJan1, at(2026, 11, 28))).toBe('Cette semaine'); // Mon 28 Dec
    expect(labelOn(friJan1, at(2026, 11, 27))).toBe('Semaine dernière'); // Sun 27 Dec
    expect(labelOn(friJan1, at(2026, 11, 21))).toBe('Semaine dernière'); // Mon 21 Dec
    expect(labelOn(friJan1, at(2026, 11, 20))).not.toBe('Semaine dernière'); // Sun 20 Dec
  });
});
