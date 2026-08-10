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

  /**
   * The podium as the board hands it over: a player, a position and a
   * confidence flag per card.
   *
   * The carousel takes rows rather than bare players now that the podium is
   * gated on POSITION. A crowned player may be provisional, so `player.rank`
   * is null for them and the card can no longer read it — the badge draws
   * from `position`, and `uncertain` drives the `?`. See PingpongPodiumCard.
   */
  const rows = podium.map((p, i) => ({
    player: p,
    position: i + 1,
    uncertain: false,
  }));

  it('renders a card per podium player', () => {
    render(<PingpongPodiumCarousel podium={rows} />);

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
    render(<PingpongPodiumCarousel podium={rows} />);

    expect(screen.getByRole('group', { name: /podium/i })).toBeInTheDocument();
  });

  it('makes every card a button', () => {
    // Not a div with an onClick: the cards open a detail modal and must be
    // reachable by keyboard.
    render(<PingpongPodiumCarousel podium={rows} />);

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('names a card with everything the visuals convey', () => {
    // The rank is a coloured badge and the stats are icon glyphs. A screen
    // reader landing on "Matéo 1124 63" learns nothing.
    render(<PingpongPodiumCarousel podium={rows} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

    await userEvent.click(screen.getAllByRole('button')[1]);

    expect(onSelect).toHaveBeenCalledWith(podium[1]);
  });

  it('hands back the card that peeks off the edge', async () => {
    // The third card is clipped to ~45 px by design. Clipped is not
    // disabled.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

    await userEvent.click(screen.getAllByRole('button')[2]);

    expect(onSelect).toHaveBeenCalledWith(podium[2]);
  });

  it('activates a card with Enter', async () => {
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

    screen.getAllByRole('button')[1].focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(podium[1]);
  });

  it('activates a card with Space', async () => {
    // Free with a real <button>, and lost the moment it becomes a div.
    const onSelect = jest.fn();
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

    screen.getAllByRole('button')[2].focus();
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith(podium[2]);
  });

  it('reaches every card by keyboard, including the clipped one', async () => {
    // The scroller itself must not be a tab stop — a stop that does nothing
    // is a stop nobody wants — but each card must be reachable, and the
    // browser scrolls a focused card into view for free.
    render(<PingpongPodiumCarousel podium={rows} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} onSelect={onSelect} />);

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
    render(<PingpongPodiumCarousel podium={rows} />);

    const track = screen.getByRole('group', { name: /podium/i });
    expect(track.className).toMatch(/touch-pan-x/);
  });

  it('shows the rank digit, not a medal', () => {
    // The owner's actual complaint: 🥇🥈🥉 where a number was expected.
    render(<PingpongPodiumCarousel podium={rows} />);

    const badges = screen.getAllByTestId('podium-rank-badge');
    expect(badges.map((b) => b.textContent)).toEqual(['1', '2', '3']);
  });

  it('numbers the badge from the board position, not the API rank', () => {
    // The podium is gated on POSITION now, so a crowned player may well be
    // provisional — and the API sends rank: null for every one of those. A
    // card reading `player.rank` would render the fallback badge, which is a
    // grey 0 where a gold 1 belongs. Every rank here is null and disagrees
    // with the position it is handed.
    render(
      <PingpongPodiumCarousel
        podium={podium.map((p, i) => ({
          player: { ...p, rank: null },
          position: i + 1,
          uncertain: true,
        }))}
      />,
    );

    expect(
      screen.getAllByTestId('podium-rank-badge').map((b) => b.textContent),
    ).toEqual(['1', '2', '3']);
  });

  /**
   * THE UNCERTAINTY MARKER ON THE CARD.
   *
   * New, and it is what makes gating the podium on position defensible. The
   * podium used to wait for three SETTLED ratings, so a crowned player was
   * confident by construction and the card had nothing to qualify. Now the
   * top three are crowned whatever their confidence — on the real production
   * data that means Valentin, with ONE match played, is crowned second.
   *
   * So the card states it, using the convention the rows already use and
   * Lichess ships: a `?` after the rating and a muted weight. The card crowns
   * a position and says in the same breath how far to trust it. Without this
   * the podium would make a confident claim the data does not support.
   */
  describe('an uncertain crowned player', () => {
    function uncertainPodium() {
      return [
        { player: podium[0], position: 1, uncertain: false },
        { player: podium[1], position: 2, uncertain: true },
        { player: podium[2], position: 3, uncertain: false },
      ];
    }

    it('marks their rating with a question mark', () => {
      render(<PingpongPodiumCarousel podium={uncertainPodium()} />);

      const cards = screen.getAllByTestId('pingpong-podium-card');
      expect(cards[1]).toHaveTextContent('1090?');
    });

    it('leaves a settled crowned rating unmarked', () => {
      // The other half. A blanket `?` would satisfy the test above and tell
      // everyone their rating is a guess.
      render(<PingpongPodiumCarousel podium={uncertainPodium()} />);

      const cards = screen.getAllByTestId('pingpong-podium-card');
      expect(cards[0]).toHaveTextContent('1124');
      expect(cards[0]).not.toHaveTextContent('?');
    });

    it('says in words what the question mark means', () => {
      // A `?` is a glyph: a screen reader reads it as punctuation or skips
      // it, and someone who has not been told the convention gets nothing
      // from it either.
      //
      // Asserted on the ACCESSIBLE NAME rather than on an sr-only span, which
      // is where the row puts the same wording. This card conveys everything
      // through `aria-label` already — the rank is a coloured badge and both
      // stats are icon glyphs — so an sr-only span here would be a second
      // channel saying the same thing twice into one announcement.
      render(<PingpongPodiumCarousel podium={uncertainPodium()} />);

      const names = screen
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label') ?? '');
      expect(names[1]).toMatch(/estimation/i);
      expect(names[0]).not.toMatch(/estimation/i);
    });
  });

  /**
   * THE DESKTOP LAYOUT.
   *
   * The carousel is mobile-only now. NN/g is explicit that horizontal scroll
   * on a wide viewport is poorly discovered — "users often have no idea that
   * they can discover content by 'swiping' on large screens" — and acceptable
   * only for secondary content. Three cards is not overload, so the
   * carousel's justification simply does not exist on desktop, where it also
   * sat left-aligned and read as broken ("sur pc, il faut centrer le podium
   * sur la page").
   *
   * Above the breakpoint it becomes a static 3-up grid in a max-width box
   * with `margin-inline: auto`, which is centred by construction — the
   * reported misalignment is fixed as a side effect rather than by nudging a
   * margin. The card design is identical across breakpoints; only the
   * container changes.
   *
   * JSDOM CAVEAT, stated plainly: jsdom does not evaluate media queries,
   * compute layout, or resolve Tailwind's `sm:` variants into anything. These
   * assert that the container carries the classes that produce the two
   * layouts and that the mobile scroll behaviour is confined behind a
   * breakpoint prefix. Whether the result is actually centred, actually three
   * across, or actually unscrollable on a wide screen can only be seen in a
   * browser. Nothing below is evidence of the visual outcome.
   */
  describe('the desktop layout', () => {
    function trackClasses() {
      return screen.getByRole('group', { name: /podium/i }).className;
    }

    it('scrolls horizontally only below the breakpoint', () => {
      // `overflow-x-auto` unprefixed would keep the scroller alive on
      // desktop; it has to be switched off above the breakpoint.
      render(<PingpongPodiumCarousel podium={rows} />);

      expect(trackClasses()).toMatch(/(^|\s)overflow-x-auto/);
      expect(trackClasses()).toMatch(/sm:overflow-visible/);
    });

    it('drops the snap and pan behaviour above the breakpoint', () => {
      // Scroll-snap and touch-pan-x describe a scroller. Left on a static
      // grid they are dead declarations that mislead the next reader.
      render(<PingpongPodiumCarousel podium={rows} />);

      expect(trackClasses()).toMatch(/sm:snap-none/);
      expect(trackClasses()).toMatch(/sm:touch-auto/);
    });

    it('lays the cards out as a centred grid above the breakpoint', () => {
      // The fix for the reported misalignment. A max-width box with
      // margin-inline auto is centred by construction, so there is no
      // separate "centre it" rule to fall out of sync.
      render(<PingpongPodiumCarousel podium={rows} />);

      const track = screen.getByRole('group', { name: /podium/i });
      const cardTrack = track.firstElementChild as HTMLElement;
      expect(cardTrack.className).toMatch(/sm:grid/);
      expect(cardTrack.className).toMatch(/sm:grid-cols-3/);
      expect(cardTrack.className).toMatch(/sm:mx-auto/);
      expect(cardTrack.className).toMatch(/sm:max-w-/);
    });

    it('keeps the flex row for the mobile carousel', () => {
      // The other half: the grid must be the desktop variant, not a
      // replacement. On a phone the cards stay a flex row that overflows,
      // which is what produces the honest clipped third card.
      render(<PingpongPodiumCarousel podium={rows} />);

      const track = screen.getByRole('group', { name: /podium/i });
      const cardTrack = track.firstElementChild as HTMLElement;
      expect(cardTrack.className).toMatch(/(^|\s)flex(\s|$)/);
    });

    it('lets a card fill its grid cell rather than staying 132 px', () => {
      // A fixed-width card in a 3-column grid leaves the row visually
      // left-packed inside a centred container, which is the reported bug
      // wearing a different hat. The width is released above the breakpoint.
      render(<PingpongPodiumCarousel podium={rows} />);

      const card = screen.getAllByTestId('pingpong-podium-card')[0];
      expect(card.className).toMatch(/sm:w-full/);
    });
  });

  it('shows the first name only', () => {
    // A 132 px card cannot hold "Matéo Durand" on one line, and the
    // reference shows first names.
    render(<PingpongPodiumCarousel podium={rows} />);

    const card = screen.getAllByTestId('pingpong-podium-card')[0];
    expect(card).toHaveTextContent('Matéo');
    expect(card).not.toHaveTextContent('Durand');
  });

  it('shows the rating and the win rate', () => {
    render(<PingpongPodiumCarousel podium={rows} />);

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
          {
            player: player({ id: 'z', rank: 1, wins: 0, losses: 0 }),
            position: 1,
            uncertain: false,
          },
          rows[1],
          rows[2],
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
    render(<PingpongPodiumCarousel podium={rows} />);

    const floor = screen.getAllByTestId('podium-text-floor')[0];
    expect(floor.className).toMatch(/bg-black\//);
  });
});
