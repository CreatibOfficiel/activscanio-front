'use client';

import { FC } from 'react';
import { PingpongPlayer } from '../../models/Pingpong';
import { calibrationProgress, winRate } from '../../utils/pingpong-leaderboard';
import { formatCompetitorName } from '../../utils/formatters';
import { UserAvatar } from '../ui';
import RankBadge from '../leaderboard/RankBadge';

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
 * The rating carries the word "elo" beside it. "1510" alone means nothing
 * to a casual player, and that explanation is vital to reading the row —
 * NN/g is explicit that vital information does not belong in a tooltip.
 */
const PingpongRow: FC<PingpongRowProps> = ({
  player,
  isCurrentUser = false,
  onClick,
  animationDelay = 0,
}) => {
  const name = formatCompetitorName(player.firstName, player.lastName);
  const rate = winRate(player);

  // Inactivity wins over calibration when both apply: "not seen for two
  // weeks" is the more useful thing to report.
  const status = player.inactive
    ? { label: 'Inactif', testId: 'pingpong-status' }
    : player.provisional
      ? {
          label: `${Math.round(
            calibrationProgress(player, MATCHES_TO_CALIBRATE) *
              MATCHES_TO_CALIBRATE,
          )}/${MATCHES_TO_CALIBRATE} matchs`,
          testId: 'pingpong-status',
        }
      : null;

  return (
    <div
      data-testid="pingpong-row"
      data-current-user={isCurrentUser}
      data-inactive={player.inactive}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 py-2 px-3 rounded-xl
        bg-neutral-800/40 border border-neutral-600/60
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:bg-neutral-800/60 hover:border-neutral-500/60' : ''}
        ${isCurrentUser ? 'ring-1 ring-primary-500/30' : ''}
        ${player.inactive ? 'opacity-50' : ''}
      `}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* A rank, or nothing at all — the gap is the signal. */}
      {player.rank !== null ? (
        <div data-testid="pingpong-rank" className="flex-shrink-0">
          <RankBadge rank={player.rank} size="md" />
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" aria-hidden="true" />
      )}

      <UserAvatar
        src={player.profilePictureUrl}
        name={`${player.firstName} ${player.lastName}`}
        size="md"
        className="border border-neutral-700 flex-shrink-0"
      />

      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-white truncate">{name}</p>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          {status ? (
            <span data-testid={status.testId} className="text-neutral-500">
              {status.label}
            </span>
          ) : (
            <>
              <span data-testid="pingpong-record" className="tabular-nums">
                {player.wins}V · {player.losses}D
              </span>
              {rate !== null && (
                <span data-testid="pingpong-winrate" className="tabular-nums">
                  {rate}%
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          data-testid="pingpong-rating"
          className="text-sm font-bold text-primary-500 tabular-nums"
        >
          {Math.round(player.conservativeScore)}
          <span className="ml-1 text-[10px] font-medium text-neutral-500 uppercase">
            elo
          </span>
        </p>
      </div>
    </div>
  );
};

export default PingpongRow;
