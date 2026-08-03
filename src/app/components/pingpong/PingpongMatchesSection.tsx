'use client';

import { FC, useMemo } from 'react';
import { MdSportsTennis } from 'react-icons/md';
import { PingpongMatch } from '../../models/Pingpong';
import { getDateLabel } from '../../utils/formatters';
import MatchCard from './MatchCard';
import DateSeparator from '../race/DateSeparator';
import { Button, Skeleton } from '../ui';

interface PingpongMatchesSectionProps {
  matches: PingpongMatch[];
  loading: boolean;
  error: Error | null;
  /** Re-runs the matches request alone. The board is not refetched. */
  onRetry: () => void;
}

/**
 * The ping-pong match history, below the leaderboard.
 *
 * This used to be its own route, `/pingpong/matches`, which nothing in the
 * app ever linked to — reachable only by typing the URL, so in practice it
 * did not exist. The route is gone and its rendering lives here, where the
 * one screen anyone actually opens can show it.
 *
 * It earns its place most on a cold start. A rank is withheld until eight
 * weighted matches, so the opening weeks of the sport produce a leaderboard
 * that is legitimately empty while matches are being played. A screen whose
 * only content is an empty ranking reads as a feature that is broken; the
 * same screen listing yesterday's matches reads as one that is young. So the
 * section appears from the first recorded match, whether or not the board
 * above it has anyone on it yet.
 *
 * Its loading and error states are its own. The leaderboard is a separate
 * request and must render regardless of what happened to this one.
 *
 * The layout follows /races: grouped under date separators, newest first,
 * skeletons rather than a spinner.
 */
const PingpongMatchesSection: FC<PingpongMatchesSectionProps> = ({
  matches,
  loading,
  error,
  onRetry,
}) => {
  // The API sorts newest first; grouping preserves the order it sent rather
  // than re-sorting, so the two cannot disagree.
  const groups = useMemo(() => {
    const ordered: { label: string; matches: PingpongMatch[] }[] = [];
    for (const match of matches) {
      const label = getDateLabel(match.playedAt);
      const last = ordered[ordered.length - 1];
      if (last && last.label === label) last.matches.push(match);
      else ordered.push({ label, matches: [match] });
    }
    return ordered;
  }, [matches]);

  if (loading) {
    return (
      <div data-testid="pingpong-matches-loading" className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="pingpong-matches-error"
        className="mt-8 flex flex-col items-center rounded-xl border border-neutral-700/60 bg-neutral-800/30 px-4 py-8 text-center"
      >
        <MdSportsTennis className="mb-3 text-3xl text-neutral-600" />
        <p className="text-regular mb-4 max-w-sm text-neutral-400">
          Les derniers matchs n&apos;ont pas pu être chargés. Ils sont bien
          enregistrés, seul cet affichage a échoué.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    );
  }

  // Nothing to show and nothing to explain. The board's own empty state
  // already asks for a first match a few pixels above, and an "aucun match"
  // panel underneath it would be the same sentence twice.
  if (matches.length === 0) return null;

  return (
    <section data-testid="pingpong-matches" className="mt-8">
      <h2 className="text-heading px-1 text-white">Derniers matchs</h2>

      {groups.map((group) => (
        <section key={group.label}>
          <DateSeparator label={group.label} count={group.matches.length} />
          <div className="space-y-3">
            {group.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
};

export default PingpongMatchesSection;
