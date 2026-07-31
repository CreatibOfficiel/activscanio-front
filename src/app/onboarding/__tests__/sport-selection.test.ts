import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The sport question in onboarding.
 *
 * Read at source level rather than rendered: the page is 54K, pulls Clerk,
 * sonner, next/navigation and a debounce hook, and drives a five-step
 * machine. Mounting all of it to assert on which flag is sent would be a
 * disproportionate amount of scaffolding, and the assertions that matter
 * here are about which values reach the API.
 *
 * What these pin down is the decision the flow turns on: a ping-pong-only
 * player is a PLAYER who skips character selection, not a spectator. The
 * old code conflated the two, because "skips character selection" and "does
 * not compete" happened to coincide while betting existed.
 */
describe('onboarding sport selection', () => {
  const source = readFileSync(
    join(__dirname, '..', 'page.tsx'),
    'utf8',
  );

  it('asks about ping-pong, not betting', () => {
    expect(source).toMatch(/Je joue au ping-pong/);
    expect(source).not.toMatch(/Je parie/);
  });

  it('carries two independent flags, with no third "both" option', () => {
    // Two checkboxes rather than three exclusive choices: "both" is then
    // derived at the edge and the ordering question dissolves.
    expect(source).toMatch(/wantsMarioKart/);
    expect(source).toMatch(/wantsPingpong/);
    expect(source).not.toMatch(/wantsBoth/);
  });

  it('derives the preference from the two flags', () => {
    expect(source).toMatch(/const sportPreference: SportPreference =/);
    expect(source).toMatch(/'both'/);
  });

  it('sends the preference rather than the removed spectator flag', () => {
    // isSpectator no longer exists on the DTO; sending it would be dropped
    // silently and the user would be onboarded with the default.
    expect(source).not.toMatch(/isSpectator/);
    expect(source).toMatch(/sportPreference,/);
  });

  it('skips character selection for a ping-pong-only player', () => {
    // A kart character is meaningless to someone who only plays ping-pong,
    // and the API refuses to require one for them.
    expect(source).toMatch(
      /const skipsCharacter = wantsPingpong && !wantsMarioKart/,
    );
    expect(source).not.toMatch(/isBettorOnly/);
  });

  it('handles Space as well as Enter on the sport cards', () => {
    // role="checkbox" promises Space toggles. onKeyPress is deprecated in
    // React and never fires for it, so the promise was unkept.
    const cardHandlers = source.match(
      /onKeyDown=\{\(e\) => \{[\s\S]*?e\.key === ' '[\s\S]*?\}\}/g,
    );
    expect(cardHandlers).not.toBeNull();
    expect(cardHandlers!.length).toBeGreaterThanOrEqual(2);
  });

  it('prevents Space from scrolling the page', () => {
    // Without it the card toggles and the page jumps at the same time.
    expect(source).toMatch(/e\.preventDefault\(\)/);
  });

  it('bumped the saved-progress key', () => {
    // A session stored mid-flow before this change carries the old flag
    // names, so restoring it lands the user on a step whose preconditions
    // no longer exist. Bumping the key discards those blobs.
    expect(source).toMatch(/onboarding-progress-v2/);
  });

  it('no longer promises betting in its copy', () => {
    expect(source).not.toMatch(/parier/i);
    expect(source).not.toMatch(/prono/i);
  });
});
