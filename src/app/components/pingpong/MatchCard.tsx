'use client';

import { FC } from 'react';
import { PingpongMatch, PingpongMatchPlayer } from '../../models/Pingpong';
import { formatCompetitorName, formatRelativeDate } from '../../utils/formatters';
import { UserAvatar } from '../ui';

interface MatchCardProps {
  /**
   * The match, with both players embedded.
   *
   * `GET /pingpong/matches` eager-loads the relations, so the card needs no
   * leaderboard and no lookup table. Either side can still be null — a
   * player row the API could not resolve — and that renders a placeholder.
   */
  match: PingpongMatch;
  className?: string;
}

/** Shown in place of a name for a player the API could not return. */
const UNKNOWN_PLAYER = 'Joueur inconnu';

/**
 * Signed, rounded rating move.
 *
 * A real minus sign (U+2212) rather than a hyphen: it aligns with the plus
 * at the same optical weight, and the set scores on the same card already
 * use a hyphen as a separator.
 */
function formatDelta(before: number, after: number): string {
  const delta = Math.round(after - before);
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}

interface SideProps {
  testId: string;
  player: PingpongMatchPlayer | null;
  isWinner: boolean;
  delta: string | null;
  align: 'left' | 'right';
}

/**
 * A player's display name, or the placeholder.
 *
 * Covers two distinct absences: a null player, and a player row whose
 * competitor could not be loaded, which arrives with empty names rather than
 * as null. Both must read as "unknown" — a blank space where a name belongs
 * looks like a rendering fault.
 */
function displayName(player: PingpongMatchPlayer | null): string {
  if (!player) return UNKNOWN_PLAYER;
  // The fallback is passed explicitly: formatCompetitorName defaults to
  // "Pilote", which belongs to Mario Kart and would name a ping-pong player
  // after the wrong sport.
  return formatCompetitorName(
    player.firstName,
    player.lastName,
    UNKNOWN_PLAYER,
  );
}

const Side: FC<SideProps> = ({ testId, player, isWinner, delta, align }) => {
  const name = displayName(player);

  return (
    <div
      data-testid={testId}
      data-winner={isWinner}
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      <UserAvatar
        src={player?.profilePictureUrl}
        name={name}
        size="sm"
        className="flex-shrink-0 border border-neutral-700"
      />

      <div className="min-w-0">
        <p
          className={`truncate text-sm ${
            isWinner ? 'font-bold text-white' : 'font-medium text-neutral-400'
          }`}
        >
          {name}
        </p>

        <div
          className={`flex items-center gap-1.5 ${
            align === 'right' ? 'justify-end' : ''
          }`}
        >
          {/* The winner is named in words, not only in weight and colour —
              colour alone fails WCAG 1.4.1 and fails a screenshot. */}
          {isWinner && (
            <span
              data-testid="match-winner-mark"
              className="text-[10px] font-bold uppercase tracking-wide text-success-500"
            >
              Vainqueur
            </span>
          )}
          {delta !== null && (
            <span
              data-testid={`match-delta-${align === 'left' ? 'a' : 'b'}`}
              className={`text-xs font-semibold tabular-nums ${
                delta.startsWith('+') ? 'text-success-500' : 'text-error-500'
              }`}
            >
              {delta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * One recorded ping-pong match.
 *
 * Both players come embedded on the match, so there is no lookup here and no
 * leaderboard to fetch. The winner is still resolved from `winnerId` against
 * the flat `playerAId` / `playerBId`, which survive a null player — a match
 * whose winner could not be named is still a match with a winner.
 *
 * Always read from player A's side. The API sends `sets` in A's point of
 * view, and mirroring them for whoever is looking would make one match
 * render two different ways — a screenshot of it would then mean nothing
 * without knowing who took it. So the left column is always A, the right
 * always B, both are named beside their column, and the scoreboard carries
 * an aria-label saying so in order.
 *
 * A frozen match shows no delta at all. `ratingFrozen` means the gap was
 * wide enough that the ratings were pinned, and "+0" beside both names
 * reads as arithmetic that failed rather than a rule that applied.
 */
const MatchCard: FC<MatchCardProps> = ({ match, className = '' }) => {
  const playerA = match.playerA;
  const playerB = match.playerB;

  const nameA = displayName(playerA);
  const nameB = displayName(playerB);

  const setsA = match.sets.filter((set) => set.a > set.b).length;
  const setsB = match.sets.length - setsA;

  // The API names a winner; the set tally is not re-derived to second-guess
  // it, or a walkover recorded server-side would display as its opposite.
  const aWon = match.winnerId === match.playerAId;
  const bWon = match.winnerId === match.playerBId;

  const frozen = match.ratingFrozen;
  const deltaA = frozen
    ? null
    : formatDelta(match.ratingABefore, match.ratingAAfter);
  const deltaB = frozen
    ? null
    : formatDelta(match.ratingBBefore, match.ratingBAfter);

  // A damped match moves the rating less than a first meeting would, so the
  // small number beside it needs a reason. A frozen match already carries
  // the stronger explanation, so the two never appear together.
  const damped = !frozen && match.appliedWeight < 1;

  return (
    <article
      data-testid="match-card"
      data-match-id={match.id}
      className={`rounded-xl border border-neutral-600/60 bg-neutral-800/40 p-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <Side
          testId="match-player-a"
          player={playerA}
          isWinner={aWon}
          delta={deltaA}
          align="left"
        />

        <div
          data-testid="match-set-tally"
          className="flex-shrink-0 px-2 text-base font-bold tabular-nums text-white"
        >
          {setsA}
          <span className="mx-0.5 text-neutral-500">-</span>
          {setsB}
        </div>

        <Side
          testId="match-player-b"
          player={playerB}
          isWinner={bWon}
          delta={deltaB}
          align="right"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-neutral-700/60 pt-2">
        {/* Left-to-right is A-to-B in every set, stated for anyone who
            cannot see the column alignment. */}
        <div
          data-testid="match-sets"
          aria-label={`Sets, ${nameA} contre ${nameB}`}
          className="flex flex-wrap items-center gap-1.5"
        >
          {match.sets.map((set, index) => (
            <span
              key={index}
              data-testid="match-set"
              className="rounded bg-neutral-900/60 px-1.5 py-0.5 text-xs tabular-nums text-neutral-300"
            >
              {set.a}-{set.b}
            </span>
          ))}
        </div>

        <span
          data-testid="match-date"
          className="ml-auto text-xs text-neutral-500"
        >
          {formatRelativeDate(match.playedAt)}
        </span>
      </div>

      {frozen && (
        <p
          data-testid="match-frozen"
          className="mt-2 text-xs text-neutral-500"
        >
          Écart trop large : match non compté au classement
        </p>
      )}

      {damped && (
        <p data-testid="match-weight" className="mt-2 text-xs text-neutral-500">
          Match répété : compté à {Math.round(match.appliedWeight * 100)}%
        </p>
      )}
    </article>
  );
};

export default MatchCard;
