import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The streak-loss wire contract.
 *
 * The API sent `bettingStreakLoss` while this client read
 * `participationStreakLoss`. The response is cast rather than parsed, so
 * TypeScript saw nothing: the property was simply always `undefined` and the
 * loss modal never appeared. No error, no log, just a feature that quietly
 * did nothing for every user.
 *
 * Nothing else can catch this. The two repositories compile separately, and
 * the boundary between them is a JSON blob and an `as` cast. So this test
 * reads the API's own interface off disk and checks the key names match.
 *
 * It is skipped when the API is not checked out alongside this repo, so a
 * frontend-only clone still runs green.
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
  'achievements',
  'services',
  'streak-tracker.service.ts',
);

function readApiSource(): string | null {
  try {
    return readFileSync(API_SERVICE, 'utf8');
  } catch {
    return null;
  }
}

/** Property names declared in an interface block. */
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

  const body = source.slice(open + 1, end);
  // Top-level properties only: nested object literals are indented deeper.
  return [...body.matchAll(/^ {2}(\w+)[?]?:/gm)].map((match) => match[1]);
}

describe('streak-loss wire contract', () => {
  const apiSource = readApiSource();

  it('reads the API service, or is skipped', () => {
    if (apiSource === null) {
      console.warn('mushroom-bet-api not found alongside; contract unchecked');
    }
    expect(true).toBe(true);
  });

  it('agrees with the API on the response keys', () => {
    if (apiSource === null) return;

    const apiKeys = keysOf(apiSource, 'UnseenStreakLosses').sort();
    const clientSource = readFileSync(
      join(__dirname, '..', 'streak-loss.ts'),
      'utf8',
    );
    const clientKeys = keysOf(clientSource, 'StreakLossesResponse').sort();

    expect(apiKeys.length).toBeGreaterThan(0);
    expect(clientKeys).toEqual(apiKeys);
  });

  it('names the participation streak, not the betting one', () => {
    // The specific regression. Pinned by name so a rename on either side
    // has to be deliberate.
    const clientSource = readFileSync(
      join(__dirname, '..', 'streak-loss.ts'),
      'utf8',
    );

    expect(clientSource).toMatch(/participationStreakLoss/);
    expect(clientSource).not.toMatch(/bettingStreakLoss/);

    if (apiSource !== null) {
      expect(apiSource).not.toMatch(/bettingStreakLoss/);
    }
  });
});
