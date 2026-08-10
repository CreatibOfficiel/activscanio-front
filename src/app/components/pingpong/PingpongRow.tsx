'use client';

import { FC } from 'react';
import { PingpongPlayer } from '../../models/Pingpong';
import {
  MATCHES_TO_CALIBRATE,
  calibrationProgress,
  isConfident,
  winRate,
} from '../../utils/pingpong-leaderboard';
import { formatCompetitorName } from '../../utils/formatters';
import { UserAvatar } from '../ui';
import RankBadge from '../leaderboard/RankBadge';
import TrendIndicator from '../leaderboard/TrendIndicator';
import { rankMovement } from '../../utils/rank-movement';
import { EloGlyph, WinRateGlyph } from './StatGlyphs';

interface PingpongRowProps {
  player: PingpongPlayer;
  /**
   * Where this player sits on the board, from 1. Comes from
   * `buildPingpongBoard`, NOT from `player.rank` — the API's rank is null for
   * anyone its gate excluded, and ordinal among the few it admitted.
   *
   * Optional, and the row falls back to `player.rank`, because two callers
   * outside this board render a row from a bare player with no list around
   * them to take a position from.
   */
  position?: number;
  isCurrentUser?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

/**
 * One player on the ping-pong leaderboard.
 *
 * Everyone appears in a single list. No platform surveyed renders three
 * separately-headed groups — they either exclude the uncertain entirely
 * (Lichess, UTR, FIDE) or keep everyone inline with a short marker (FICS).
 * Three headers on a 25-row phone list turns a third of the screen into
 * chrome, and visually establishes "the bottom group" as somewhere people
 * live.
 *
 * THE ABSENCE OF A RANK NUMBER USED TO BE THE BADGE, AND IS NOT ANY MORE.
 * That was this component's stated design and it is deliberately reversed. It
 * was right while unranked players were a minority: a gap in a numbered column
 * is loud precisely because the column is otherwise full, and it needed no
 * decoration of its own.
 *
 * Measured in production it was 6 rows of 8. The API's gate — 5 weighted
 * matches AND rd ≤ 200, itself already loosened from 8/150, which had admitted
 * nobody at all — passed Charles and Thibaud and stopped Don Joran at 4
 * matches and Maxime at rd 202. Six blank cells out of eight is not an
 * exception being flagged, it is a ranking that appears not to have loaded,
 * and the readers it fails hardest are the six it silently declines to place.
 *
 * So every row carries a position, and the uncertainty moved onto the rating,
 * where it belongs: Glickman's case for RD is that it lets you publish a
 * number and state how far to trust it, rather than withhold it. An unsettled
 * rating is muted and takes a `?` — Lichess's convention exactly — while a
 * settled one is stated plainly.
 *
 * The mark is therefore on the MINORITY, whichever way the league tips, and
 * today that means the confident rows are the ones that stand out. Badging the
 * uncertain would have put a pill on three rows in four, where it stops being
 * a signal and starts being the background, and would have made the two
 * settled rows read as the ones missing something.
 *
 * The status label says why the rating is unsettled, and calibrating and
 * inactive still get different words: FICS distinguishes P from E precisely
 * because "we don't know yet" and "was settled, then drifted" are different
 * states, and the second is what someone looking for a colleague needs. An
 * inactive player's rating is trusted — they keep an unmarked number and are
 * dimmed instead.
 *
 * The rank is a digit at every position, including the top three. It used to
 * be a medal there — `RankBadge` renders 🥇🥈🥉 by default — and that was the
 * reported bug: the three rows a reader is most likely to be looking for
 * were the only three carrying no readable rank, and a medal cannot be
 * compared against the "4" underneath it. `showMedal={false}` restores the
 * number. The top three also have a podium of their own above this list now,
 * which is where the ceremony belongs.
 *
 * Two stats down the right edge, icon over value, rather than one rating
 * with the word "elo" spelled out beside it. The word moved into an
 * `sr-only` label: it was there because "1510" alone means nothing, and that
 * is still true, but it is true for anyone reading the column header rather
 * than every row. The win/loss tally that used to sit under the name is
 * gone — the win rate says the same thing in the space the sub-line needs.
 *
 * The trend arrow stays on the row, immediately left of the stats. The
 * design spec proposed moving it into the detail sheet; it is the only mark
 * on the board that says anything changed today, and behind a tap nobody
 * would see it.
 */
const PingpongRow: FC<PingpongRowProps> = ({
  player,
  position,
  isCurrentUser = false,
  onClick,
  animationDelay = 0,
}) => {
  const name = formatCompetitorName(player.firstName, player.lastName);

  // Only for someone who played: roughly half of all rank changes in a
  // pool this size happen to people who were not there, and an arrow on
  // their row would blame them for someone else's match. See rank-movement
  // for the full reasoning.
  const movement = rankMovement({
    rank: player.rank,
    previousRank: player.previousDayRank,
    lastActiveAt: player.lastMatchAt,
  });
  const rate = winRate(player);

  // The board's position, falling back to the API rank for the callers that
  // render a row outside a list. Null only when neither exists, which is a
  // bare player rendered standalone.
  const shownPosition = position ?? player.rank;

  /**
   * Is the number next to this row's name a fact or an estimate?
   *
   * Read from the shared helper, not from `player.rank === null`, which is
   * what this used to key off. Those two answered the same question only while
   * the API's gate decided both; now that the board numbers everyone, "has no
   * rank from the API" and "we are unsure of this rating" have come apart, and
   * only the second one belongs on screen.
   */
  const uncertain = !isConfident(player);

  /**
   * Weighted matches played, rounded for display.
   *
   * The weighted count is a sum of applied weights, not a tally — a player who
   * replayed one opponent all week sits on something like 2.6 — and "2.6
   * matchs" reads as a bug.
   */
  const playedTowardCalibration = Math.round(
    calibrationProgress(player) * MATCHES_TO_CALIBRATE,
  );

  // Inactivity wins over calibration when both apply: "not seen for two
  // weeks" is the more useful thing to report.
  //
  // The calibrating label names what the count is counting toward. It used to
  // end "avant d'être classé", which described a row with no number. The row
  // has one now, so that sentence would contradict what sits beside it — the
  // count leads to a CONFIRMED rating instead, which is the thing that
  // actually changes at the bar, and always was.
  //
  // Five, not eight, and read from the shared constant rather than a local
  // copy. The API moved `PROVISIONAL_MIN_MATCHES` from 8 to 5; the local copies
  // here and on the TV board were left behind, so both told players they owed
  // more matches than they did, and disagreed with each other once one was
  // fixed. One constant, imported, is what stops that recurring.
  //
  // `matchs` only past one: "1 matchs" reads as a typo, and this label is the
  // first thing a new player sees written about themselves.
  const status = player.inactive
    ? { label: 'Inactif', testId: 'pingpong-status' }
    : player.provisional
      ? {
          label: `${playedTowardCalibration} match${
            playedTowardCalibration > 1 ? 's' : ''
          } sur ${MATCHES_TO_CALIBRATE} avant d'être confirmé`,
          testId: 'pingpong-status',
        }
      : null;

  /**
   * NO THRESHOLD. The rate shows whenever there is one to show.
   *
   * Third position on this question, so the chain is here rather than in
   * three places:
   *
   * 1. ORIGINALLY gated on being RANKED — 8 weighted matches — which with
   *    nobody ranked emptied the column for the whole board.
   * 2. THEN gated on 3 played matches: "2/3 is a reading, 1/1 is an
   *    accident."
   * 3. NOW ungated.
   *
   * (2) went because 3 is not a defensible line and it cost real data. The
   * status label two elements to the left already states the match count for
   * exactly the players the threshold used to blank — anyone still
   * calibrating reads "1 match sur 5 avant d'être confirmé" — so "100%" is
   * qualified on screen rather than floating free, and hiding the numerator
   * while showing the denominator is strictly less information for the same
   * pixels. (A settled player carries no such label, but they are also past
   * any sample-size worry by definition.) The
   * stabilisation literature puts a reliable win rate at 50-100+ games, so a
   * bar at 3 is nowhere near significance yet still high enough to blank 3 of
   * the 8 production players, the newest among them, at exactly the moment
   * the app should feel responsive to a new player. And it contradicted this
   * row's own convention two elements to the left, where an unsettled RATING
   * is shown with a `?` rather than withheld. Uncertainty is stated on this
   * board; it is not a reason to hide a number.
   *
   * `rate !== null` is not a threshold in disguise. `winRate` returns null
   * only when nobody has played at all, and there is genuinely no rate then —
   * "0 %" would read as having lost every game.
   */
  const showsRate = rate !== null;

  const content = (
    <>
      {/* A position on every row. The blank box that used to sit here for
          unranked players — and the "Non classé" it announced — is gone with
          the gate; see the reversal at the top of this file. The fallback
          remains only for a row rendered outside a list, which has no position
          to be given. */}
      {shownPosition !== null && shownPosition !== undefined ? (
        <div data-testid="pingpong-rank" className="flex-shrink-0">
          <RankBadge rank={shownPosition} size="md" showMedal={false} />
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <UserAvatar
        src={player.profilePictureUrl}
        name={`${player.firstName} ${player.lastName}`}
        size="sm"
        className="flex-shrink-0"
      />

      <div className="min-w-0 flex-grow text-left">
        <p className="truncate text-lg font-normal text-neutral-300">{name}</p>

        {status && (
          <p
            data-testid={status.testId}
            className="truncate text-[11px] text-neutral-500"
          >
            {status.label}
          </p>
        )}
      </div>

      {movement && (
        <div
          data-testid="pingpong-trend"
          data-direction={movement.direction}
          className="flex-shrink-0"
        >
          <TrendIndicator
            direction={movement.direction}
            value={movement.places}
            size="sm"
          />
        </div>
      )}

      <div
        data-testid="pingpong-stats"
        className="flex flex-shrink-0 items-start gap-4"
      >
        {/* The uncertainty marker, and the whole of it: a `?` after the number
            and a muted weight, which is Lichess's convention for a provisional
            rating. Nothing is added to the row's layout — no pill, no extra
            line — because on this board the marker lands on most rows, and
            anything with its own footprint would turn the list into chrome.

            The `?` is decorative to a screen reader, which would read it as a
            question or skip it; the sr-only word carries the meaning. */}
        <div
          data-testid="pingpong-rating"
          className="flex flex-col items-center gap-1"
        >
          <EloGlyph className="h-3 w-3 text-neutral-500" />
          <span
            className={`text-xs font-medium tabular-nums ${
              uncertain ? 'text-neutral-500' : 'text-neutral-300'
            }`}
          >
            {Math.round(player.conservativeScore)}
            {uncertain && <span aria-hidden="true">?</span>}
          </span>
          <span className="sr-only">
            {uncertain ? 'elo, estimation en cours' : 'elo'}
          </span>
        </div>

        {showsRate && (
          <div
            data-testid="pingpong-winrate"
            className="flex flex-col items-center gap-1"
          >
            <WinRateGlyph className="h-3 w-3 text-neutral-500" />
            <span className="text-xs font-medium tabular-nums text-neutral-300">
              {rate}
            </span>
            <span className="sr-only">% de victoires</span>
          </div>
        )}
      </div>
    </>
  );

  const shell = `
    group relative flex w-full items-center gap-2.5 rounded-2xl bg-neutral-800 px-3
    ${status ? 'py-2' : 'h-[3.375rem]'}
    transition-colors duration-200
    ${isCurrentUser ? 'ring-1 ring-primary-500/30' : ''}
    ${player.inactive ? 'opacity-50' : ''}
  `;

  // A real button only when there is something to press. A button that does
  // nothing is a tab stop that wastes a press, and on a 25-row board that is
  // 25 of them.
  if (onClick) {
    return (
      <button
        type="button"
        data-testid="pingpong-row"
        data-current-user={isCurrentUser}
        data-inactive={player.inactive}
        data-uncertain={uncertain}
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label={`Voir la fiche de ${name}`}
        className={`${shell} cursor-pointer text-left hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      data-testid="pingpong-row"
      data-current-user={isCurrentUser}
      data-inactive={player.inactive}
      data-uncertain={uncertain}
      className={shell}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {content}
    </div>
  );
};

export default PingpongRow;
