'use client';

import { FC } from 'react';
import { PingpongBestWin } from '../../models/Pingpong';
import { formatCompetitorName } from '../../utils/formatters';
import { UserAvatar } from '../ui';

interface BestWinCardProps {
  /** Null for a player who has never won a match. */
  bestWin: PingpongBestWin | null;
  className?: string;
}

/**
 * The strongest opponent this player has beaten.
 *
 * The medal to the leaderboard's crown. A rank is zero-sum, so half a
 * 25-person office sits in its bottom half by construction and the board
 * alone tells most people a story they cannot change. This number only ever
 * goes up, and nobody else's play can lower it.
 *
 * Not a peak rating, deliberately: a Glicko-2 rating falls as well as
 * rises, and the decay cron lowers one during a holiday. A summit you have
 * dropped below is a goal you have already failed.
 */
const BestWinCard: FC<BestWinCardProps> = ({ bestWin, className = '' }) => {
  if (!bestWin) {
    return (
      <div
        data-testid="best-win-empty"
        className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 ${className}`}
      >
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span>🗡️</span>
          <span>Meilleur adversaire battu</span>
        </h3>
        <p className="text-sm text-neutral-400">
          Ta première victoire s&apos;affichera ici. Elle ne pourra plus
          jamais t&apos;être reprise.
        </p>
      </div>
    );
  }

  // Only when the opponent was actually above: beating someone below you is
  // a win, not an upset, and a negative gap would boast about nothing.
  const gap =
    bestWin.playerRating !== null &&
    bestWin.opponentRating > bestWin.playerRating
      ? Math.round(bestWin.opponentRating - bestWin.playerRating)
      : null;

  const name = bestWin.opponent
    ? formatCompetitorName(
        bestWin.opponent.firstName,
        bestWin.opponent.lastName,
      )
    : // Someone who has left still counts — the match happened.
      'Un adversaire';

  return (
    <div
      className={`p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-gold-500 ${className}`}
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>🗡️</span>
        <span>Meilleur adversaire battu</span>
      </h3>

      <div className="flex items-center gap-3">
        <UserAvatar
          src={bestWin.opponent?.profilePictureUrl ?? ''}
          name={name}
          size="md"
          className="border border-neutral-700 flex-shrink-0"
        />

        <div className="flex-grow min-w-0">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          <p data-testid="best-win-date" className="text-xs text-neutral-500">
            {new Date(bestWin.playedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p
            data-testid="best-win-rating"
            className="text-lg font-bold text-gold-500 tabular-nums"
          >
            {Math.round(bestWin.opponentRating)}
            <span className="ml-1 text-[10px] font-medium text-neutral-500 uppercase">
              elo
            </span>
          </p>
          {gap !== null && (
            <p
              data-testid="best-win-gap"
              className="text-xs text-emerald-400 tabular-nums"
            >
              +{gap} au-dessus de toi
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestWinCard;
