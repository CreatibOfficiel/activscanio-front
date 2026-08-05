import { renderHook, act } from '@testing-library/react';
import { RefObject } from 'react';
import {
  useAutoScroll,
  deriveScrollSpeed,
  MIN_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
  SCROLL_END_PAUSE,
} from '../useAutoScroll';

/**
 * Auto-scroll on the office TV.
 *
 * The failure this guards against is silent and only shows up at a roster
 * size nobody tests at: the list is still scrolling when the view rotates
 * away, so a passer-by sees motion start, get halfway, and vanish. A fixed
 * 150 px/s crossed that line somewhere around 25 rows; the office is at 21
 * and growing.
 *
 * So the arithmetic, not the rendering, is what these tests pin down.
 * `deriveScrollSpeed` is exported precisely so the decision can be asserted
 * on directly — jsdom reports every element as 0x0, which makes overflow
 * unobservable through the hook alone.
 */
describe('deriveScrollSpeed', () => {
  // 15s dwell, 5s before the scroll starts, 1.5s resting at the bottom
  const budget = 15000;
  const delay = 5000;

  it('speeds up so a long list finishes inside the dwell budget', () => {
    // 35 rows x ~72px, minus a ~900px viewport => ~1620px to travel
    const overflow = 1620;

    const speed = deriveScrollSpeed(overflow, { budget, delay })!;

    // The whole point: travel time must fit in what's left of the dwell
    const travelMs = (overflow / speed) * 1000;
    expect(travelMs).toBeLessThanOrEqual(budget - delay - SCROLL_END_PAUSE);
    // ...and it must have actually sped up past the old fixed rate
    expect(speed).toBeGreaterThan(150);
  });

  it('does not crawl when the list barely overflows', () => {
    // The realistic ping-pong case: 7 players, a sliver past the fold
    const speed = deriveScrollSpeed(60, { budget, delay });

    expect(speed).toBeGreaterThanOrEqual(MIN_SCROLL_SPEED);
  });

  it('returns null when there is nothing to scroll', () => {
    expect(deriveScrollSpeed(0, { budget, delay })).toBeNull();
    expect(deriveScrollSpeed(-40, { budget, delay })).toBeNull();
  });

  it('stops speeding up at the readability ceiling', () => {
    // Absurd roster: 200 rows. Fitting this in 8.5s would need ~1100px/s.
    const speed = deriveScrollSpeed(9000, { budget, delay });

    expect(speed).toBe(MAX_SCROLL_SPEED);
  });

  it('a longer ?interval= dwell yields a gentler speed for the same list', () => {
    const overflow = 1620;

    const at15s = deriveScrollSpeed(overflow, { budget: 15000, delay });
    const at30s = deriveScrollSpeed(overflow, { budget: 30000, delay });

    expect(at30s!).toBeLessThan(at15s!);
    // 30s of dwell is enough that this list no longer needs to hurry
    expect(at30s!).toBe(MIN_SCROLL_SPEED);
  });

  it('leaves the list resting at the bottom before the view rotates', () => {
    /*
     * Pinned independently of SCROLL_END_PAUSE on purpose. The other tests
     * derive their expectations from the constant, so zeroing it would slip
     * past them all while quietly restoring the "arrives and vanishes"
     * behaviour this whole change exists to fix.
     */
    expect(SCROLL_END_PAUSE).toBeGreaterThanOrEqual(1000);

    // A list that needs the ceiling to fit must still stop short of the
    // rotation, not scroll into it.
    const overflow = 1620;
    const speed = deriveScrollSpeed(overflow, { budget, delay })!;
    const travelMs = (overflow / speed) * 1000;

    expect(budget - delay - travelMs).toBeGreaterThanOrEqual(1000);
  });

  it('keeps the legacy fixed speed when no budget is supplied', () => {
    // Existing callers pass only `speed`; they must not start deriving.
    expect(deriveScrollSpeed(1620, { speed: 150 })).toBe(150);
    expect(deriveScrollSpeed(60, { speed: 150 })).toBe(150);
  });
});

/**
 * Hook-level behaviour. jsdom gives every element zero height, so these
 * tests drive `scrollHeight`/`clientHeight` explicitly to make overflow
 * observable at all.
 */
describe('useAutoScroll', () => {
  let rafCallbacks: FrameRequestCallback[];

  function makeElement(scrollHeight: number, clientHeight: number) {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
    el.scrollTop = 0;
    return el;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    rafCallbacks = [];
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('never animates a list that fits entirely', () => {
    const el = makeElement(500, 900);
    const ref = { current: el } as RefObject<HTMLElement | null>;

    renderHook(() => useAutoScroll(ref, 0, { budget: 15000 }));
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // No frame was ever requested: a fitting list must sit perfectly still
    expect(rafCallbacks).toHaveLength(0);
    expect(el.scrollTop).toBe(0);
  });

  it('reaches the bottom before the view rotates away', () => {
    const overflow = 1620;
    const el = makeElement(2520, 900);
    const ref = { current: el } as RefObject<HTMLElement | null>;
    const budget = 15000;

    const nowSpy = jest.spyOn(performance, 'now');
    nowSpy.mockReturnValue(0);

    renderHook(() => useAutoScroll(ref, 0, { budget, delay: 5000 }));
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Drive the animation to the last instant the view is still on screen
    const lastVisibleMs = budget - 5000 - SCROLL_END_PAUSE;
    nowSpy.mockReturnValue(lastVisibleMs);
    act(() => {
      rafCallbacks.shift()?.(lastVisibleMs);
    });

    expect(el.scrollTop).toBe(overflow);
  });
});
