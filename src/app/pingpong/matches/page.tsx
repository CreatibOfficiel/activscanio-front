'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MdSportsTennis } from 'react-icons/md';
import { PingpongMatch } from '../../models/Pingpong';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import { getDateLabel } from '../../utils/formatters';
import MatchCard from '../../components/pingpong/MatchCard';
import DateSeparator from '../../components/race/DateSeparator';
import { Button, Skeleton } from '../../components/ui';

/** How many matches the history shows. Matches the races list's first page. */
const MATCH_LIMIT = 50;

/**
 * The ping-pong match history.
 *
 * One request. `GET /pingpong/matches` eager-loads the player relations and
 * embeds both sides on every match, so the page reads names straight off the
 * rows it already has. It used to fetch the leaderboard as well and join on
 * `PingpongPlayer.id` here — two responses for one screen, and the same join
 * rewritten in every consumer of the endpoint.
 *
 * A player the API could not resolve — archived after six months idle, or
 * deleted — comes back null while their matches remain. Those rows stay,
 * with a placeholder name: dropping them would silently shorten everyone's
 * history.
 *
 * The layout follows /races: grouped under date separators, newest first,
 * skeletons rather than a spinner while loading.
 */
export default function PingpongMatchesPage() {
  const [matches, setMatches] = useState<PingpongMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loadedMatches =
        await pingpongRepository.fetchRecentMatches(MATCH_LIMIT);
      setMatches(loadedMatches);
      // Clear a previous failure, or a successful retry would render fresh
      // matches underneath a stale error.
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      setMatches([]);
    } finally {
      // Always, so a failure stops the skeletons. A permanent loading state
      // gives nobody anything to act on.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <div className="min-h-screen bg-neutral-900 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-2xl">
        <div className="mt-8 mb-6 flex flex-col items-center px-4">
          <h1 className="text-title mb-2">Matchs de ping-pong</h1>
          {!loading && !error && matches.length > 0 && (
            <p className="text-sm text-neutral-500">
              {matches.length} match{matches.length > 1 ? 's' : ''} récent
              {matches.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading && (
          <div data-testid="matches-loading" className="space-y-3 px-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            data-testid="matches-error"
            className="flex flex-col items-center px-4 py-12 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800">
              <MdSportsTennis className="text-4xl text-neutral-600" />
            </div>
            <h2 className="text-heading mb-2 text-white">
              Impossible de charger les matchs
            </h2>
            <p className="text-regular mb-6 max-w-sm text-neutral-400">
              La connexion au serveur a échoué. Les matchs sont bien
              enregistrés, seul cet affichage n&apos;a pas pu les récupérer.
            </p>
            <Button variant="primary" onClick={() => void load()}>
              Réessayer
            </Button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div
            data-testid="matches-empty"
            className="flex flex-col items-center px-4 py-12 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800">
              <MdSportsTennis className="text-4xl text-neutral-600" />
            </div>
            <h2 className="text-heading mb-2 text-white">
              Aucun match pour le moment
            </h2>
            <p className="text-regular mb-6 max-w-sm text-neutral-400">
              Le premier match enregistré lancera le classement. Deux joueurs,
              deux sets gagnants, et c&apos;est parti.
            </p>
            <Link href="/pingpong">
              <Button variant="secondary">Voir le classement</Button>
            </Link>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="pb-4">
            {groups.map((group) => (
              <section key={group.label}>
                <DateSeparator
                  label={group.label}
                  count={group.matches.length}
                />
                <div className="space-y-3 px-4">
                  {group.matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
