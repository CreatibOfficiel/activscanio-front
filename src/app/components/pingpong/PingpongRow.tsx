'use client';

import { FC } from 'react';
import { PingpongPlayer } from '../../models/Pingpong';
import { calibrationProgress, winRate } from '../../utils/pingpong-leaderboard';
import { formatCompetitorName } from '../../utils/formatters';
import { UserAvatar } from '../ui';
import RankBadge from '../leaderboard/RankBadge';
import TrendIndicator from '../leaderboard/TrendIndicator';
import { rankMovement } from '../../utils/rank-movement';
import { EloGlyph, WinRateGlyph } from './StatGlyphs';

interface PingpongRowProps {
  player: PingpongPlayer;
  isCurrentUser?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

/** Weighted matches needed to leave calibration. Mirrors the API. */
const MATCHES_TO_CALIBRATE = 8;

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
 * The absence of a rank number is itself the badge, so nothing stands in
 * for it. The status label says WHY there is no rank, and calibrating and
 * inactive get different words: FICS distinguishes P from E precisely
 * because "we don't know yet" and "was settled, then drifted" are different
 * states, and the second is what someone looking for a colleague needs.
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
/** Below this, a win percentage is an artefact of a tiny sample. */
const MIN_MATCHES_FOR_RATE = 3;

const PingpongRow: FC<PingpongRowProps> = ({
  player,
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
  const isRanked = player.rank !== null;

  // Inactivity wins over calibration when both apply: "not seen for two
  // weeks" is the more useful thing to report.
  // The calibrating label names what the count is counting toward. "3/8
  // matchs" states a ratio and leaves its purpose to be guessed, and on a
  // board where the first eight matches produce no ranking at all, that
  // purpose is the one thing explaining why the row carries no rank.
  const status = player.inactive
    ? { label: 'Inactif', testId: 'pingpong-status' }
    : player.provisional
      ? {
          label: `${Math.round(
            calibrationProgress(player, MATCHES_TO_CALIBRATE) *
              MATCHES_TO_CALIBRATE,
          )} matchs sur ${MATCHES_TO_CALIBRATE} avant d'être classé`,
          testId: 'pingpong-status',
        }
      : null;

  /**
   * Three played matches, not "is ranked".
   *
   * Gating on rank meant waiting for 8 weighted matches, and with nobody
   * ranked yet that left the column empty for every row on the board — the
   * screen gave up a real number to avoid showing a fake one. Three is where
   * a percentage starts carrying information: 2/3 is a reading, 1/1 is an
   * accident. Below it the column stays empty rather than showing a figure
   * nobody should act on.
   */
  const played = player.wins + player.losses;
  const showsRate = played >= MIN_MATCHES_FOR_RATE && rate !== null;

  const content = (
    <>
      {/* A rank, or nothing at all — the gap is the signal. Stated for a
          screen reader, which gets nothing out of an empty box. */}
      {isRanked ? (
        <div data-testid="pingpong-rank" className="flex-shrink-0">
          <RankBadge rank={player.rank as number} size="md" showMedal={false} />
        </div>
      ) : (
        <div className="w-8 flex-shrink-0">
          <span className="sr-only">Non classé</span>
        </div>
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
        <div
          data-testid="pingpong-rating"
          className="flex flex-col items-center gap-1"
        >
          <EloGlyph className="h-3 w-3 text-neutral-500" />
          <span className="text-xs font-medium tabular-nums text-neutral-300">
            {Math.round(player.conservativeScore)}
          </span>
          <span className="sr-only">elo</span>
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
      className={shell}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {content}
    </div>
  );
};

export default PingpongRow;
