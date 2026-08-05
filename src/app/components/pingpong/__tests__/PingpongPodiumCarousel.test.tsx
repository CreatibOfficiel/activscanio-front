import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PingpongPodiumCarousel from '../PingpongPodiumCarousel';
import { PingpongPlayer } from '../../../models/Pingpong';

/**
 * The top three, as cards.
 *
 * `segmentPingpongLeaderboard` has returned `podium` and `rest` since it was
 * written and nothing read them: the page flattened every tier into one list.
 * This is the component that finally consumes the podium half.
 *
 * The segmentation guarantees `podium` is either empty or exactly three —
 * `minPodiumSize` is 3 — so this renders whatever it is handed and returns
 * null when handed nothing. Deciding again here would give two places an
 * opinion on when a podium is warranted, and they would drift.
 *
 * Every card is a button, not a div: the cards open a detail modal, and a
 * div with an onClick is unreachable by keyboard. The accessible name has to
 * carry the rank, the name and both stats, because on screen all three are
 * conveyed by a coloured badge and two icon glyphs.
 */
describe('PingpongPodiumCarousel', () => {
  // The tap guard reads a clock, so the tests that exercise its duration rule
  // need one they control. Only Date is faked: userEvent drives its own
  // timers for the pointer sequences above and stalls against a faked
  // setTimeout.
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'setInterval', 'queueMicrotask', 'nextTick'] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Dispatch a pointer event that actually carries coordinates.
   *
   * JSDOM has no PointerEvent, so `fireEvent.pointerDown(el, { clientX })`
   * builds an Event whose clientX reads back as null — every distance the
   * guard computes from it comes out NaN, and every comparison against NaN is
   * false, so a guard that were broken would still look green. A MouseEvent
   * typed as a pointer event populates the coordinates and React routes it to
   * the matching onPointer* handler.
   */
  function pointer(
    el: Element,
    type: 'pointerdown' | 'pointermove' | 'pointercancel',
    coords: { x: number; y: number },
  ) {
    fireEvent(
      el,
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: coords.x,
        clientY: coords.y,
      }),
    );
  }

  function player(overrides: Partial<PingpongPlayer> = {}): PingpongPlayer {
    return {
      id: 'p1',
      competitorId: 'c1',
      firstName: 'Matéo',
      lastName: 'Durand',
      profilePictureUrl: '',
      rating: 1620,
      rd: 55,
      vol: 0.06,
      conservativeScore: 1124,
      matchCount: 24,
      weightedMatchCount: 20,
      wins: 15,
      losses: 9,
      setsWon: 38,
      setsLost: 27,
      currentStreak: 3,
      bestStreak: 6,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 5,
      diversityScore21d: 0.9,
      rank: 1,
      ...overrides,
    };
  }

  const podium = [
    player({ id: 'a', firstName: 'Matéo', rank: 1, conservativeScore: 1124 }),
    player({ id: 'b', firstName: 'Michael', rank: 2, conservativeScore: 1090 }),
    player({ id: 'c', firstName: 'Sofia', rank: 3, conservativeScore: 1042 }),
  ];

  it('renders a card per podium player', () => {
    render(<PingpongPodiumCarousel podium={podium} />);

    expect(screen.getAllByTestId('pingpong-podium-card')).toHaveLength(3);
  });

  it('renders nothing at all when there is no podium', () => {
    // Below three ranked players the segmentation hands back an empty
    // podium, and a one-card carousel is a pedestal with a scroll hint that
    // scrolls nowhere.
    const { container } = render(<PingpongPodiumCarousel podium={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('groups the cards under one label rather than a list', () => {
    // role="list" would announce "list, 3 items" over three buttons, which
    // is the wrong shape. A labelled group says what the cluster is.
    render(<PingpongPodiumCarousel podium={podium} />);

    expect(screen.getByRole('group', { name: /podium/i })).toBeInTheDocument();
  });

  it('makes every card a button', () => {
    // Not a div with an onClick: the cards open a detail modal and must be
    // reachable by keyboard.
    render(<PingpongPodiumCarousel podium={podium} />);

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('names a card with everything the visuals convey', () => {
    // The rank is a coloured badge and the stats are icon glyphs. A screen
    // reader landing on "Matéo 1124 63" learns nothing.
    render(<PingpongPodiumCarousel podium={podium} />);

    const name = screen.getAllByRole('button')[0].getAttribute('aria-label');
    expect(name).toMatch(/rang 1/i);
    expect(name).toMatch(/Matéo/);
    expect(name).toMatch(/1124/);
    expect(name).toMatch(/elo/i);
    expect(name).toMatch(/63/); // 15 wins of 24 matches
  });

  it('hands the pressed player back', async () => {
    // Card 2, not card 1: an index bug that always reported the first player
    // would pass against card 1.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    await userEvent.click(screen.getAllByRole('button')[1]);

    expect(onSelect).toHaveBeenCalledWith(podium[1]);
  });

  it('hands back the card that peeks off the edge', async () => {
    // The third card is clipped to ~45 px by design. Clipped is not
    // disabled.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    await userEvent.click(screen.getAllByRole('button')[2]);

    expect(onSelect).toHaveBeenCalledWith(podium[2]);
  });

  it('activates a card with Enter', async () => {
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    screen.getAllByRole('button')[1].focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(podium[1]);
  });

  it('activates a card with Space', async () => {
    // Free with a real <button>, and lost the moment it becomes a div.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    screen.getAllByRole('button')[2].focus();
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith(podium[2]);
  });

  it('reaches every card by keyboard, including the clipped one', async () => {
    // The scroller itself must not be a tab stop — a stop that does nothing
    // is a stop nobody wants — but each card must be reachable, and the
    // browser scrolls a focused card into view for free.
    render(<PingpongPodiumCarousel podium={podium} />);

    const cards = screen.getAllByRole('button');
    await userEvent.tab();
    expect(cards[0]).toHaveFocus();
    await userEvent.tab();
    expect(cards[1]).toHaveFocus();
    await userEvent.tab();
    expect(cards[2]).toHaveFocus();
  });

  it('does not fire while the carousel is being swiped', async () => {
    // A horizontal drag that ends on a card must scroll, not open a modal.
    // Without this the carousel opens a dialog every time someone flicks it,
    // which on a phone is every single interaction.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[0];
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { x: 200, y: 50 } },
      { target: card, coords: { x: 140, y: 52 } },
      { keys: '[/MouseLeft]', target: card, coords: { x: 140, y: 52 } },
    ]);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('still fires on a tap that barely moves', async () => {
    // The other half of the rule: a finger is never perfectly still, so the
    // drag guard has to tolerate a few pixels or it eats real taps.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[0];
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { x: 200, y: 50 } },
      { target: card, coords: { x: 202, y: 51 } },
      { keys: '[/MouseLeft]', target: card, coords: { x: 202, y: 51 } },
    ]);

    expect(onSelect).toHaveBeenCalledWith(podium[0]);
  });

  it('does not fire after the browser cancels the gesture as a scroll', () => {
    // The failure the down→up comparison cannot see. On a real touch device
    // the browser decides mid-gesture that a drag is a scroll: it fires
    // pointercancel, stops sending pointermove, and takes the gesture over.
    // A flick handled that way can still end in a click whose coordinates sit
    // near the press — the finger left before travelling far under the JS's
    // own reckoning — so a distance test alone lets it through.
    //
    // JSDOM CAVEAT: userEvent has no pointercancel, so this dispatches raw
    // events. The sequencing is modelled on the spec, not observed from a
    // device: what this proves is that the handler honours a cancel it is
    // given, not that a real browser cancels where we assume it does.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[0];
    pointer(card, 'pointerdown', { x: 200, y: 50 });
    pointer(card, 'pointercancel', { x: 198, y: 51 });
    fireEvent.click(card, { clientX: 198, clientY: 51 });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not fire on a drag that wanders and comes back', () => {
    // Down→up alone measures zero here: the finger travels 60 px out and
    // returns to where it started. That is a scrub of the carousel, not a
    // tap, and only the running maximum sees it.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[0];
    pointer(card, 'pointerdown', { x: 200, y: 50 });
    pointer(card, 'pointermove', { x: 140, y: 50 });
    pointer(card, 'pointermove', { x: 200, y: 50 });
    fireEvent.click(card, { clientX: 200, clientY: 50 });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not fire on a press held long enough to be a hold', () => {
    // A finger resting on a card for a second and lifting without moving is
    // not a tap either — it is the gesture that precedes a long-press menu,
    // and treating it as a tap opens a modal the user did not ask for.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[0];
    pointer(card, 'pointerdown', { x: 200, y: 50 });
    jest.advanceTimersByTime(900);
    fireEvent.click(card, { clientX: 200, clientY: 50 });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('fires on a brisk tap well inside the hold threshold', () => {
    // The guard against the guard: a normal tap takes on the order of 100 ms
    // and must not be caught by the duration rule.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[0];
    pointer(card, 'pointerdown', { x: 200, y: 50 });
    jest.advanceTimersByTime(120);
    fireEvent.click(card, { clientX: 201, clientY: 50 });

    expect(onSelect).toHaveBeenCalledWith(podium[0]);
  });

  it('lets a keyboard activation through however long the key was held', () => {
    // A keyboard click reports no press origin at all, so neither the
    // distance rule nor the duration rule may apply to it. Holding Enter for
    // a second must still open the modal — and a stale origin left behind by
    // an earlier aborted gesture must not leak into the next activation.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={podium} onSelect={onSelect} />);

    const card = screen.getAllByRole('button')[1];
    pointer(card, 'pointerdown', { x: 200, y: 50 });
    pointer(card, 'pointercancel', { x: 200, y: 50 });

    card.focus();
    jest.advanceTimersByTime(1000);
    // clientX/clientY are 0 on a keyboard-generated click, which is exactly
    // why the guard keys off the press origin rather than the coordinates.
    fireEvent.click(card, { clientX: 0, clientY: 0, detail: 0 });

    expect(onSelect).toHaveBeenCalledWith(podium[1]);
  });

  it('keeps the track scrolling horizontally rather than guessing', () => {
    // Without touch-action the browser applies its own disambiguation and can
    // start a vertical page scroll from a gesture the guard is treating as a
    // horizontal swipe. pan-x pins the axis so the two agree.
    //
    // JSDOM CAVEAT: this asserts the class is present, nothing more. JSDOM
    // does not compute touch-action or act on it; only a device shows whether
    // the axis behaves.
    render(<PingpongPodiumCarousel podium={podium} />);

    const track = screen.getByRole('group', { name: /podium/i });
    expect(track.className).toMatch(/touch-pan-x/);
  });

  it('shows the rank digit, not a medal', () => {
    // The owner's actual complaint: 🥇🥈🥉 where a number was expected.
    render(<PingpongPodiumCarousel podium={podium} />);

    const badges = screen.getAllByTestId('podium-rank-badge');
    expect(badges.map((b) => b.textContent)).toEqual(['1', '2', '3']);
  });

  it('shows the first name only', () => {
    // A 132 px card cannot hold "Matéo Durand" on one line, and the
    // reference shows first names.
    render(<PingpongPodiumCarousel podium={podium} />);

    const card = screen.getAllByTestId('pingpong-podium-card')[0];
    expect(card).toHaveTextContent('Matéo');
    expect(card).not.toHaveTextContent('Durand');
  });

  it('shows the rating and the win rate', () => {
    render(<PingpongPodiumCarousel podium={podium} />);

    const card = screen.getAllByTestId('pingpong-podium-card')[0];
    expect(card).toHaveTextContent('1124');
    // The unit lives in the label, so the value is a bare number.
    expect(card).toHaveTextContent('63');
  });

  it('shows a dash rather than a zero for a player with no matches', () => {
    // A podium player with no matches cannot happen today, but 0% would
    // read as having lost every game if it ever did.
    render(
      <PingpongPodiumCarousel
        podium={[
          player({ id: 'z', rank: 1, wins: 0, losses: 0 }),
          podium[1],
          podium[2],
        ]}
      />,
    );

    const card = screen.getAllByTestId('pingpong-podium-card')[0];
    expect(card).toHaveTextContent('—');
  });

  it('floors the text block against a bright photo', () => {
    // The reference's own gradient measures 1.68:1 where white text lands on
    // a pale sky — a real failure, not a hypothetical. A gradient cannot
    // guarantee a ratio because it does not know the photo; a flat scrim
    // under the text block can.
    render(<PingpongPodiumCarousel podium={podium} />);

    const floor = screen.getAllByTestId('podium-text-floor')[0];
    expect(floor.className).toMatch(/bg-black\//);
  });
});
