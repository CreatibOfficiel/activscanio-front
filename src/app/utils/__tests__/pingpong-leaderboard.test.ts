import {
  MATCHES_TO_CALIBRATE,
  buildPingpongBoard,
  calibrationProgress,
  isConfident,
  segmentPingpongLeaderboard,
  winRate,
} from '../pingpong-leaderboard';
import { PingpongPlayer } from '../../models/Pingpong';

/**
 * Grouping the leaderboard for display.
 *
 * The property that matters most: everyone the API returned ends up
 * somewhere on screen. A player who cannot find themselves assumes the app
 * forgot them, which is worse than seeing themselves unranked.
 */
describe('segmentPingpongLeaderboard', () => {
  function player(overrides: Partial<PingpongPlayer>): PingpongPlayer {
    return {
      id: 'p',
      competitorId: 'c',
      firstName: 'Test',
      lastName: 'Player',
      profilePictureUrl: '',
      rating: 1500,
      rd: 60,
      vol: 0.06,
      conservativeScore: 1380,
      matchCount: 20,
      weightedMatchCount: 20,
      wins: 10,
      losses: 10,
      setsWon: 25,
      setsLost: 25,
      currentStreak: 0,
      bestStreak: 3,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 4,
      diversityScore21d: 0.9,
      rank: 1,
      ...overrides,
    };
  }

  it('places every player somewhere', () => {
    const players = [
      player({ id: 'ranked', rank: 1 }),
      player({ id: 'calibrating', rank: null, provisional: true }),
      player({ id: 'away', rank: null, inactive: true }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    const placed = [...seg.ranked, ...seg.calibrating, ...seg.inactive];
    expect(placed.map((p) => p.id).sort()).toEqual([
      'away',
      'calibrating',
      'ranked',
    ]);
  });

  it('orders ranked players by their rank, not by score', () => {
    // The API computes the rank; re-deriving an order here would give two
    // sources of truth that drift the first time a rule changes.
    const players = [
      player({ id: 'third', rank: 3, conservativeScore: 9999 }),
      player({ id: 'first', rank: 1, conservativeScore: 1 }),
      player({ id: 'second', rank: 2, conservativeScore: 500 }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    expect(seg.ranked.map((p) => p.id)).toEqual(['first', 'second', 'third']);
  });

  it('labels an inactive calibrating player as inactive', () => {
    // Both flags can be true. "Not seen for two weeks" is the more useful
    // thing to tell someone looking for them.
    const players = [
      player({ id: 'both', rank: null, provisional: true, inactive: true }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    expect(seg.inactive.map((p) => p.id)).toEqual(['both']);
    expect(seg.calibrating).toHaveLength(0);
  });

  it('sorts the unranked by conservative score', () => {
    const players = [
      player({ id: 'weak', rank: null, provisional: true, conservativeScore: 900 }),
      player({ id: 'strong', rank: null, provisional: true, conservativeScore: 1400 }),
    ];

    const seg = segmentPingpongLeaderboard(players);

    expect(seg.calibrating.map((p) => p.id)).toEqual(['strong', 'weak']);
  });

  describe('podium', () => {
    it('builds one from the top three ranked players', () => {
      const players = [1, 2, 3, 4].map((rank) =>
        player({ id: `p${rank}`, rank }),
      );

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.podium.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      expect(seg.rest.map((p) => p.id)).toEqual(['p4']);
    });

    it('shows no podium with only two ranked players', () => {
      // A podium of one or two is a pedestal. Below the threshold the list
      // reads better flat.
      const players = [1, 2].map((rank) => player({ id: `p${rank}`, rank }));

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.podium).toHaveLength(0);
      expect(seg.rest.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('keeps every ranked player when there is no podium', () => {
      const players = [1, 2].map((rank) => player({ id: `p${rank}`, rank }));

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.rest).toHaveLength(seg.ranked.length);
    });
  });

  describe('archived players', () => {
    it('hides them by default', () => {
      const players = [
        player({ id: 'active', rank: 1 }),
        player({ id: 'gone', rank: null, archived: true, inactive: true }),
      ];

      const seg = segmentPingpongLeaderboard(players);

      expect(seg.inactive).toHaveLength(0);
      expect(seg.ranked).toHaveLength(1);
    });

    it('includes them when asked', () => {
      const players = [
        player({ id: 'gone', rank: null, archived: true, inactive: true }),
      ];

      const seg = segmentPingpongLeaderboard(players, {
        includeArchived: true,
      });

      expect(seg.inactive.map((p) => p.id)).toEqual(['gone']);
    });
  });

  it('reports an empty board', () => {
    const seg = segmentPingpongLeaderboard([]);

    expect(seg.isEmpty).toBe(true);
    expect(seg.ranked).toHaveLength(0);
  });

  it('does not call a board with only calibrating players empty', () => {
    // The likely state in the first weeks. The screen should show those
    // players, not an empty state telling them nobody has played.
    const seg = segmentPingpongLeaderboard([
      player({ id: 'newcomer', rank: null, provisional: true }),
    ]);

    expect(seg.isEmpty).toBe(false);
  });
});

/**
 * The one-list board, which replaces the gate on the phone.
 *
 * `segmentPingpongLeaderboard` above is untouched and still returns the three
 * tiers — the TV board reads them, and its own layout branches on
 * `ranked.length`. This is the additive shape the phone board opts into, so
 * that reversing the gate on one surface does not silently re-lay-out the
 * other.
 */
describe('buildPingpongBoard', () => {
  function player(overrides: Partial<PingpongPlayer>): PingpongPlayer {
    return {
      id: 'p',
      competitorId: 'c',
      firstName: 'Test',
      lastName: 'Player',
      profilePictureUrl: '',
      rating: 1500,
      rd: 60,
      vol: 0.06,
      conservativeScore: 1380,
      matchCount: 20,
      weightedMatchCount: 20,
      wins: 10,
      losses: 10,
      setsWon: 25,
      setsLost: 25,
      currentStreak: 0,
      bestStreak: 3,
      lastMatchAt: '2026-03-14T12:00:00Z',
      previousDayRank: null,
      provisional: false,
      inactive: false,
      archived: false,
      isRankingEligible: true,
      distinctOpponents21d: 4,
      diversityScore21d: 0.9,
      rank: 1,
      ...overrides,
    };
  }

  /**
   * The real league, measured in production after a full rating recompute.
   *
   * The gate admitted Charles and Thibaud and nobody else: 2 of 8, in an
   * office of 8. Don Joran and Maxime miss it by a hair — 4 weighted matches
   * against a bar of 5, rd 202 against a ceiling of 200. These are the exact
   * figures, kept as figures rather than rounded into "a provisional player",
   * because the near-misses are the whole reason the gate is going.
   */
  const PRODUCTION_LEAGUE = [
    player({ id: 'charles', firstName: 'Charles', conservativeScore: 1808, rd: 180, weightedMatchCount: 8, rank: 1, provisional: false }),
    player({ id: 'valentin', firstName: 'Valentin', conservativeScore: 1617, rd: 287, weightedMatchCount: 1, rank: null, provisional: true }),
    player({ id: 'joran', firstName: 'Don Joran', conservativeScore: 1611, rd: 202, weightedMatchCount: 4, rank: null, provisional: true }),
    player({ id: 'florian', firstName: 'Florian', conservativeScore: 1593, rd: 290, weightedMatchCount: 1, rank: null, provisional: true }),
    player({ id: 'maxime', firstName: 'Maxime', conservativeScore: 1592, rd: 203, weightedMatchCount: 4, rank: null, provisional: true }),
    player({ id: 'thibaud', firstName: 'Thibaud', conservativeScore: 1381, rd: 166, weightedMatchCount: 7, rank: 2, provisional: false }),
    player({ id: 'ness', firstName: 'Ness', conservativeScore: 1278, rd: 251, weightedMatchCount: 2, rank: null, provisional: true }),
    player({ id: 'clotilde', firstName: 'Clotilde', conservativeScore: 1191, rd: 235, weightedMatchCount: 3, rank: null, provisional: true }),
  ];

  it('numbers every player in the real league', () => {
    // The failure this whole change exists for. The API ranked 2 of these 8;
    // all 8 are on the board and all 8 carry a position.
    //
    // Read across BOTH surfaces now that the podium takes ranks 1-3 out of
    // the list. The property under test was never "rows holds everyone" — it
    // was "everyone is placed and numbered contiguously" — so it is asserted
    // that way rather than against `rows` alone, which would now pass with a
    // player silently dropped between the two.
    const board = buildPingpongBoard(PRODUCTION_LEAGUE);

    const positions = [...board.podiumRows, ...board.rows].map(
      (row) => row.position,
    );
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('orders the real league by rating rather than by the API rank', () => {
    // Thibaud is rank 2 of the API's two ranked players and sixth by rating.
    // Sorting on the API rank would float him over four stronger players
    // purely because they were gated out.
    const board = buildPingpongBoard(PRODUCTION_LEAGUE);

    const everyone = [...board.podiumRows, ...board.rows].map(
      (row) => row.player.id,
    );
    expect(everyone).toEqual([
      'charles',
      'valentin',
      'joran',
      'florian',
      'maxime',
      'thibaud',
      'ness',
      'clotilde',
    ]);
  });

  it('numbers contiguously from 1 even when the API ranked nobody', () => {
    const board = buildPingpongBoard([
      player({ id: 'a', rank: null, provisional: true, conservativeScore: 1200 }),
      player({ id: 'b', rank: null, provisional: true, conservativeScore: 1100 }),
    ]);

    expect(board.rows.map((row) => row.position)).toEqual([1, 2]);
  });

  it('keeps every player on the board, inactive included', () => {
    // Nobody is dropped. Someone who cannot find themselves assumes the app
    // forgot them.
    //
    // Across both surfaces: with exactly three players the podium takes all
    // of them, so asserting on `rows` alone would now be asserting on an
    // empty list and passing for the wrong reason.
    const board = buildPingpongBoard([
      player({ id: 'settled', rank: 1, conservativeScore: 1500 }),
      player({ id: 'new', rank: null, provisional: true, conservativeScore: 1400 }),
      player({ id: 'away', rank: null, inactive: true, conservativeScore: 1300 }),
    ]);

    expect(
      [...board.podiumRows, ...board.rows].map((row) => row.player.id),
    ).toEqual(['settled', 'new', 'away']);
  });

  /**
   * Inactive players stay in the ranking, DELIBERATELY unlike the calibrating
   * ones this change is about.
   *
   * They are two different states and the old code collapsed them into one
   * bucket of "no number". An inactive player has a SETTLED rating that is
   * merely stale: 1592 measured three weeks ago is still the best estimate of
   * how they play, and a rating is what this list sorts on. Withholding their
   * position would be claiming not to know something we do know.
   *
   * What is uncertain about them is whether they still play, not how well —
   * so they keep their number and are dimmed, which is the signal the row
   * already carried.
   */
  it('ranks an inactive player on their settled rating', () => {
    const board = buildPingpongBoard([
      player({ id: 'active', rank: 1, conservativeScore: 1400 }),
      player({ id: 'away', rank: null, inactive: true, conservativeScore: 1600 }),
    ]);

    // Ahead, not parked at the bottom: their rating is higher and it is a
    // rating we trust.
    expect(board.rows[0].player.id).toBe('away');
    expect(board.rows[0].position).toBe(1);
  });

  it('does not call an inactive player uncertain', () => {
    // The distinction the tiers used to make and the row must keep making:
    // "settled, then drifted" is not "we do not know yet".
    const board = buildPingpongBoard([
      player({ id: 'away', rank: null, inactive: true, provisional: false }),
    ]);

    expect(board.rows[0].uncertain).toBe(false);
  });

  it('marks a provisional player uncertain and a settled one not', () => {
    const board = buildPingpongBoard([
      player({ id: 'settled', rank: 1, provisional: false, conservativeScore: 1500 }),
      player({ id: 'new', rank: null, provisional: true, conservativeScore: 1400 }),
    ]);

    expect(board.rows[0].uncertain).toBe(false);
    expect(board.rows[1].uncertain).toBe(true);
  });

  it('hides archived players by default and includes them when asked', () => {
    const players = [
      player({ id: 'here', rank: 1 }),
      player({ id: 'gone', rank: null, archived: true, inactive: true }),
    ];

    expect(buildPingpongBoard(players).rows.map((r) => r.player.id)).toEqual([
      'here',
    ]);
    expect(
      buildPingpongBoard(players, { includeArchived: true }).rows,
    ).toHaveLength(2);
  });

  it('reports an empty board', () => {
    const board = buildPingpongBoard([]);

    expect(board.isEmpty).toBe(true);
    expect(board.rows).toHaveLength(0);
    expect(board.podium).toHaveLength(0);
  });

  /**
   * THE PODIUM IS GATED ON POSITION, AND THE CROWNED THREE LEAVE THE LIST.
   *
   * Third rule in this file's history, so the whole chain is written down
   * once here rather than reconstructed from three half-comments.
   *
   * 1. ORIGINALLY: podium = top three RANKED players, lifted out of the list
   *    into `rest`. Sound while "ranked" and "settled" were the same fact,
   *    because the API's gate decided both.
   * 2. THEN: numbering everyone split those apart, so the podium was re-gated
   *    on CONFIDENCE — three settled ratings — and stopped removing anyone,
   *    on the reasoning that the crowned three need not be the list's top
   *    three and pulling them out would leave gaps in a contiguous ranking.
   * 3. NOW: back to position, and the removal comes back with it.
   *
   * What killed (2) is what it did on screen. Gating on confidence while
   * removing nobody means the same three faces render twice, six inches
   * apart — as cards, then again as rows 1-2-3 shuffled among players the
   * podium skipped. The owner reported exactly that: "on affiche les trois
   * personnes qui sont confirmés en mode podium et en dessous on les re
   * afficher dans la liste mélangés avec les gens non confirmés donc c'est
   * ultra perturbant."
   *
   * Research found no precedent for a featured section selected on anything
   * other than position. Lichess and FIDE use confidence as an entry
   * condition for the WHOLE list, never to split one screen into two
   * differently-sorted regions. Chess.com does repeat rows in a featured
   * block, but a page away — co-located duplication reads as a bug, which is
   * precisely how it was reported.
   *
   * Gating on position makes the removal trivial and the numbering correct by
   * construction: the podium is rows 1-3, so the list resumes at 4 and stays
   * contiguous with no renumbering anywhere.
   *
   * THE COST, STATED PLAINLY BECAUSE IT IS REAL AND THE BRIEF FOR THIS CHANGE
   * GOT IT BACKWARDS. The reasoning handed down was that the conservative
   * score damps the fluke risk on its own — that Valentin (1 match) and
   * Florian (1 match) sink below the podium once RD is charged against them.
   * They do not. `conservativeScore` IS rating − 2×RD; the penalty is already
   * inside the number the board sorts on, and charging it again would be
   * double-counting. On the measured production data the podium is Charles,
   * VALENTIN and Don Joran — a one-match player is crowned second. That is
   * the trade this rule accepts, and it is why the `?` marker on the podium
   * card is load-bearing rather than decorative: the card crowns a position
   * and says in the same breath how much to trust it.
   */
  describe('the podium', () => {
    it('crowns the top three by position, whatever their confidence', () => {
      // The reversal itself. Two of these three are provisional, and the old
      // confidence gate returned an empty podium for exactly this input.
      const board = buildPingpongBoard([
        player({ id: 'a', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', provisional: true, conservativeScore: 1400 }),
        player({ id: 'c', provisional: true, conservativeScore: 1300 }),
      ]);

      expect(board.podium.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    });

    it('crowns the production league’s top three, one-match player included', () => {
      // The honest consequence, pinned on the measured data rather than a
      // tidy fixture. Valentin has ONE match and rd 287 and is crowned
      // second, because 1617 is his conservative score — the deviation is
      // already charged against it. The card says `?`; see PingpongPodiumCard.
      const board = buildPingpongBoard(PRODUCTION_LEAGUE);

      expect(board.podium.map((p) => p.id)).toEqual([
        'charles',
        'valentin',
        'joran',
      ]);
    });

    it('removes the crowned three from the list', () => {
      // The defect. They used to appear as cards AND as rows 1-2-3.
      const board = buildPingpongBoard([
        player({ id: 'a', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', provisional: false, conservativeScore: 1300 }),
        player({ id: 'd', provisional: false, conservativeScore: 1200 }),
      ]);

      expect(board.podium.map((p) => p.id)).toEqual(['a', 'b', 'c']);
      expect(board.rows.map((r) => r.player.id)).toEqual(['d']);
    });

    it('puts nobody in both the podium and the list', () => {
      // Stated as the property rather than as two lists, so it holds however
      // the sizes change.
      const board = buildPingpongBoard(PRODUCTION_LEAGUE);

      const crowned = board.podium.map((p) => p.id);
      const listed = board.rows.map((r) => r.player.id);
      expect(listed.filter((id) => crowned.includes(id))).toEqual([]);
    });

    it('starts the list at position 4 when a podium is drawn', () => {
      // TRUE ranks, not a renumbering. The row under the podium is the 4th
      // best player and says so — which is what makes removal safe here and
      // unsafe under the confidence gate.
      const board = buildPingpongBoard(PRODUCTION_LEAGUE);

      expect(board.rows.map((r) => r.position)).toEqual([4, 5, 6, 7, 8]);
      expect(board.rows[0].player.id).toBe('florian');
    });

    it('splits the production league three on the podium, five in the list', () => {
      const board = buildPingpongBoard(PRODUCTION_LEAGUE);

      expect(board.podium).toHaveLength(3);
      expect(board.rows).toHaveLength(5);
    });

    it('still marks an uncertain crowned player as uncertain', () => {
      // The podium no longer filters on confidence, so `uncertain` is the
      // only thing left carrying that fact — and the card reads it.
      const board = buildPingpongBoard(PRODUCTION_LEAGUE);

      expect(board.podiumRows.map((r) => r.uncertain)).toEqual([
        false,
        true,
        true,
      ]);
    });

    it('numbers the podium rows 1, 2, 3', () => {
      // The card badge draws from this, not from `player.rank`, which is null
      // for every provisional player and would render a 0 medal.
      const board = buildPingpongBoard(PRODUCTION_LEAGUE);

      expect(board.podiumRows.map((r) => r.position)).toEqual([1, 2, 3]);
    });

    it('draws no podium below three players', () => {
      // A podium of one or two is a pedestal, and removing them would leave a
      // list of nothing at all.
      const board = buildPingpongBoard([
        player({ id: 'a', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', provisional: false, conservativeScore: 1400 }),
      ]);

      expect(board.podium).toHaveLength(0);
      // And with no podium the list keeps everyone, numbered from 1.
      expect(board.rows.map((r) => r.position)).toEqual([1, 2]);
      expect(board.rows.map((r) => r.player.id)).toEqual(['a', 'b']);
    });

    it('crowns an inactive player who is in the top three', () => {
      // DELIBERATELY REVERSED. The confidence gate excluded them, reasoning
      // that a podium is a claim about the present. Position does not admit
      // that exception without reintroducing the exact hole this change
      // closes: skip an inactive player and the podium is no longer ranks
      // 1-2-3, so the list can no longer resume at 4. The row's dimming and
      // the card's own stats still say they are away.
      const board = buildPingpongBoard([
        player({ id: 'away', provisional: false, inactive: true, conservativeScore: 1900 }),
        player({ id: 'a', provisional: false, conservativeScore: 1500 }),
        player({ id: 'b', provisional: false, conservativeScore: 1400 }),
        player({ id: 'c', provisional: false, conservativeScore: 1300 }),
      ]);

      expect(board.podium.map((p) => p.id)).toEqual(['away', 'a', 'b']);
      expect(board.rows.map((r) => r.player.id)).toEqual(['c']);
      expect(board.rows[0].position).toBe(4);
    });
  });

  it('counts how many ratings are settled', () => {
    // What the page says instead of "N joueurs classés". The old count was
    // the size of the gated group; this is the size of the confident group,
    // and on the production league it is 2 of 8.
    //
    // Counted over every VISIBLE player, not over `rows` — the podium takes
    // three of them out of `rows`, and Charles is one of the two settled
    // ratings. Counting `rows` would report 1 and the subtitle would
    // contradict the board above it.
    const board = buildPingpongBoard(PRODUCTION_LEAGUE);

    expect(board.confidentCount).toBe(2);
    expect(board.podiumRows.length + board.rows.length).toBe(8);
  });
});

describe('isConfident', () => {
  function p(overrides: Partial<PingpongPlayer>): PingpongPlayer {
    return { provisional: false, inactive: false, ...overrides } as PingpongPlayer;
  }

  it('is true for a settled active rating', () => {
    expect(isConfident(p({}))).toBe(true);
  });

  it('is false while calibrating', () => {
    expect(isConfident(p({ provisional: true }))).toBe(false);
  });

  it('is true for an inactive player whose rating settled', () => {
    // The rating is trustworthy; only its freshness is not. That is why
    // inactive players keep a position while provisional ones are marked.
    expect(isConfident(p({ inactive: true }))).toBe(true);
  });
});

describe('winRate', () => {
  function withRecord(wins: number, losses: number): PingpongPlayer {
    return { wins, losses } as PingpongPlayer;
  }

  it('rounds to a whole percentage', () => {
    expect(winRate(withRecord(2, 1))).toBe(67);
  });

  it('returns null for a player who has never played', () => {
    // Not 0: "0%" reads as having lost every game.
    expect(winRate(withRecord(0, 0))).toBeNull();
  });

  it('returns 0 for a player who has only lost', () => {
    expect(winRate(withRecord(0, 5))).toBe(0);
  });

  it('returns 100 for an unbeaten player', () => {
    expect(winRate(withRecord(5, 0))).toBe(100);
  });
});

describe('calibrationProgress', () => {
  function withCounts(weighted: number, raw: number): PingpongPlayer {
    return { weightedMatchCount: weighted, matchCount: raw } as PingpongPlayer;
  }

  /**
   * The default was 8 and the API's bar is 5. It had been 8 on both sides, the
   * API's was lowered to 5, and this default was left behind — so every screen
   * reading it told players "3 matchs sur 8" while the server was settling
   * their rating at 5. The copy was not merely stale, it was wrong in the
   * direction that matters: it overstated the work left.
   *
   * The constant is exported now rather than redeclared in each component, so
   * the next time the API moves its bar there is one place to follow it.
   */
  it('measures against the API’s bar, not the old one', () => {
    expect(MATCHES_TO_CALIBRATE).toBe(5);
  });

  it('reports progress toward the five-match bar', () => {
    expect(calibrationProgress(withCounts(4, 4))).toBe(0.8);
  });

  it('reads the weighted count, not the raw one', () => {
    // Someone who played twelve matches against one opponent has a raw count
    // of 12 and a weighted count of 4. Showing 100% while the API still calls
    // them provisional would read as a bug.
    expect(calibrationProgress(withCounts(4, 12))).toBeLessThan(1);
  });

  it('caps at 1 once calibration is complete', () => {
    expect(calibrationProgress(withCounts(20, 20))).toBe(1);
  });

  it('starts at 0', () => {
    expect(calibrationProgress(withCounts(0, 0))).toBe(0);
  });

  it('still accepts an explicit bar', () => {
    expect(calibrationProgress(withCounts(4, 4), 8)).toBe(0.5);
  });
});
