'use client';

import { FC, useMemo } from 'react';
import { PingpongMatch, PingpongPlayer } from '../../models/Pingpong';
import { formatCompetitorName } from '../../utils/formatters';
import { UserAvatar } from '../ui';

interface HeadToHeadSectionProps {
  /** Whose profile this is. Records are read from their point of view. */
  player: PingpongPlayer;
  /**
   * Everyone on the leaderboard, used to name the other side of a match.
   * Keyed on `PingpongPlayer.id`, the same id the matches carry — not
   * `competitorId`, which is also a string and so would compile cleanly
   * while matching nothing.
   */
  opponents: PingpongPlayer[];
  /** The player's matches. One fetch, not one request per rival. */
  matches: PingpongMatch[];
  className?: string;
}

type Standing = 'leading' | 'trailing' | 'level';

/**
 * Named `HeadToHeadRecord` rather than `Record`: the latter shadows the
 * built-in utility type in this file, and `Record<Standing, string>` below
 * would then resolve to the interface and fail to compile.
 */
interface HeadToHeadRecord {
  opponent: PingpongPlayer;
  wins: number;
  losses: number;
  played: number;
  standing: Standing;
}

/**
 * Build one record per opponent actually played.
 *
 * Wins come from `winnerId` and never from counting sets: the API names a
 * winner, and a walkover recorded server-side has no sets that add up.
 *
 * An opponent missing from `opponents` is dropped rather than rendered
 * nameless — a row of placeholders carrying a real-looking record is worse
 * than no row.
 */
function buildRecords(
  player: PingpongPlayer,
  opponents: PingpongPlayer[],
  matches: PingpongMatch[],
): HeadToHeadRecord[] {
  const byId = new Map(opponents.map((o) => [o.id, o]));
  const tallies = new Map<string, { wins: number; losses: number }>();

  for (const match of matches) {
    // `playerAId` is the side as recorded, not "me" — a player entered as
    // B every time would otherwise never register a win.
    const isA = match.playerAId === player.id;
    const isB = match.playerBId === player.id;
    if (!isA && !isB) continue;

    const opponentId = isA ? match.playerBId : match.playerAId;
    if (!byId.has(opponentId)) continue;

    const tally = tallies.get(opponentId) ?? { wins: 0, losses: 0 };
    if (match.winnerId === player.id) tally.wins += 1;
    else tally.losses += 1;
    tallies.set(opponentId, tally);
  }

  return [...tallies.entries()]
    .map(([opponentId, { wins, losses }]) => ({
      // Present by construction: the id was only tallied after the lookup.
      opponent: byId.get(opponentId) as PingpongPlayer,
      wins,
      losses,
      played: wins + losses,
      standing:
        wins > losses ? 'leading' : wins < losses ? 'trailing' : ('level' as Standing),
    }))
    .sort((a, b) => b.played - a.played || b.wins - a.wins);
}

const STANDING_STYLES: Record<Standing, string> = {
  leading: 'text-success-500',
  trailing: 'text-error-500',
  level: 'text-neutral-400',
};

/**
 * Win/loss record against each opponent actually played.
 *
 * The highest-value part of a ping-pong profile. A rank is zero-sum and
 * most of a 25-player office sits in the bottom half of it, where the only
 * true thing the screen can say is discouraging. A head-to-head is not:
 * "you lead Marc 7-4" is equally true and equally satisfying for the 3rd
 * and the 20th, and almost everyone has at least one.
 *
 * Both directions are always shown. A view that surfaced only the rivalries
 * a player leads would be a trophy cabinet, and the first time someone
 * checked a record they knew they were losing, the whole screen would stop
 * being believable.
 */
const HeadToHeadSection: FC<HeadToHeadSectionProps> = ({
  player,
  opponents,
  matches,
  className = '',
}) => {
  const records = useMemo(
    () => buildRecords(player, opponents, matches),
    [player, opponents, matches],
  );

  return (
    <section
      data-testid="h2h-section"
      className={`rounded-xl border border-neutral-700 bg-neutral-800 p-4 ${className}`}
    >
      <h3 className="mb-3 text-base font-bold text-white">Face-à-face</h3>

      {records.length === 0 ? (
        // Not an error and not a blank panel: someone with no recorded
        // rivalry needs to know what to do next.
        <div data-testid="h2h-empty" className="py-6 text-center">
          <p className="mb-2 text-3xl">🏓</p>
          <p className="text-sm text-neutral-400">
            Aucun face-à-face pour l’instant
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Enregistre un match pour voir ton bilan contre chaque adversaire.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {records.map(({ opponent, wins, losses, standing }) => (
            <li
              key={opponent.id}
              data-testid={`h2h-row-${opponent.id}`}
              data-standing={standing}
              className="flex items-center gap-3 rounded-lg border border-neutral-600/60 bg-neutral-900/40 px-3 py-2"
            >
              <UserAvatar
                src={opponent.profilePictureUrl}
                name={`${opponent.firstName} ${opponent.lastName}`}
                size="sm"
                className="flex-shrink-0 border border-neutral-700"
              />

              <p className="min-w-0 flex-grow truncate text-sm font-medium text-white">
                {formatCompetitorName(opponent.firstName, opponent.lastName)}
              </p>

              {/* The record reads as one figure, with the words that say
                  which side is which — "7-4" alone is ambiguous about who
                  leads it. */}
              <p
                className={`flex-shrink-0 text-sm font-bold tabular-nums ${STANDING_STYLES[standing]}`}
              >
                <span data-testid="h2h-wins">{wins}</span>
                <span className="text-neutral-500"> V · </span>
                <span data-testid="h2h-losses">{losses}</span>
                <span className="text-neutral-500"> D</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default HeadToHeadSection;
