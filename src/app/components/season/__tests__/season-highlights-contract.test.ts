import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The season highlights contract.
 *
 * The recap crashed the whole app on its highlights slide. The frontend
 * type declared eight fields; the API sends three. The recap read
 * `highlights.perfectScores.length` — `.length` on `undefined` — and the
 * exception took the page down with it.
 *
 * TypeScript could not see it: the response is cast, not parsed, so the
 * type said the fields were there and nothing checked. The five missing
 * ones were all betting highlights that went away with the feature.
 *
 * This reads the API's own interface off disk and compares the field names,
 * the same technique used for the streak-loss contract. It is skipped when
 * the API is not checked out alongside, so a frontend-only clone stays
 * green.
 */
const API_SERVICE = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'mushroom-bet-api',
  'src',
  'seasons',
  'seasons.service.ts',
);

function readApiSource(): string | null {
  try {
    return readFileSync(API_SERVICE, 'utf8');
  } catch {
    return null;
  }
}

/** Top-level property names of an interface block. */
function keysOf(source: string, interfaceName: string): string[] {
  const start = source.indexOf(`interface ${interfaceName} {`);
  if (start === -1) return [];
  const open = source.indexOf('{', start);

  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  return [...source.slice(open + 1, end).matchAll(/^ {2}(\w+)[?]?:/gm)].map(
    (match) => match[1],
  );
}

describe('season highlights contract', () => {
  const apiSource = readApiSource();
  const clientSource = readFileSync(
    join(__dirname, '..', '..', '..', 'repositories', 'SeasonsRepository.ts'),
    'utf8',
  );

  it('agrees with the API on the field names', () => {
    if (apiSource === null) {
      console.warn('mushroom-bet-api not found alongside; contract unchecked');
      return;
    }

    const apiKeys = keysOf(apiSource, 'SeasonHighlights').sort();
    const clientKeys = keysOf(clientSource, 'SeasonHighlights').sort();

    expect(apiKeys.length).toBeGreaterThan(0);
    expect(clientKeys).toEqual(apiKeys);
  });

  it('declares no betting highlight', () => {
    // The specific five that crashed it. Pinned by name so reintroducing
    // one has to be deliberate.
    for (const field of [
      'perfectScores',
      'perfectPodiums',
      'highestBetScore',
      'biggestUpset',
      'longestParticipationStreak',
    ]) {
      expect(clientSource).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('does not read a removed field in the recap', () => {
    // The type is only half the guard: the component could still reach for
    // a field through a cast or an any.
    const recap = readFileSync(
      join(__dirname, '..', 'SeasonRecapModal.tsx'),
      'utf8',
    );

    for (const field of [
      'perfectScores',
      'perfectPodiums',
      'highestBetScore',
      'biggestUpset',
      'longestParticipationStreak',
    ]) {
      expect(recap).not.toMatch(new RegExp(`highlights\\.${field}`));
    }
  });
});
