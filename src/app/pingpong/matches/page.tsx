'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MdSportsTennis } from 'react-icons/md';
import { PingpongMatch, PingpongPlayer } from '../../models/Pingpong';
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
 * Two requests, one join. `GET /pingpong/matches` returns `playerAId` and
 * `playerBId` and nothing else — the controller does a bare find() with no
 * relations, so no name and no avatar ever comes back with a match. The
 * names are taken from the leaderboard and joined here on
 * `PingpongPlayer.id`.
 *
 * The alternative, one request per player per match, is N+1 on a list that
 * routinely runs to fifty rows; the leaderboard is a single response that
 * already contains every player who has ever recorded a match. Fixing the
 * controller to eager-load the relations would be better still, and would
 * let this page drop the second fetch, but the join has to exist meanwhile.
 *
 * A player absent from the leaderboard — archived after six months idle, or
 * deleted — still has matches. Those rows stay, with a placeholder name:
 * dropping them would silently shorten everyone's history.
 *
 * The layout follows /races: grouped under date separators, newest first,
 * skeletons rather than a spinner while loading.
 */
export default function PingpongMatchesPage() {
  const [matches, setMatches] = useState<PingpongMatch[]>([]);
  const [players, setPlayers] = useState<PingpongPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Both at once: they are independent, and awaiting them in sequence
      // would double the time to first paint for no gain.
      const [loadedMatches, loadedPlayers] = await Promise.all([
        pingpongRepository.fetchRecentMatches(MATCH_LIMIT),
        pingpongRepository.fetchLeaderboard(),
      ]);
      setMatches(loadedMatches);
      setPlayers(loadedPlayers);
      // Clear a previous failure, or a successful retry would render fresh
      // matches underneath a stale error.
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      // Either request failing takes the whole screen down. A match list
      // with no leaderboard is a page of "Joueur inconnu", which looks like
      // corrupted data rather than a failed request.
      setMatches([]);
      setPlayers([]);
    } finally {
      // Always, so a failure stops the skeletons. A permanent loading state
      // gives nobody anything to act on.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keyed on the player id, which is what a match carries — NOT competitorId.
  // Both are strings, so the wrong key type-checks and renders placeholders
  // for everybody.
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

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
                    <MatchCard
                      key={match.id}
                      match={match}
                      players={playersById}
                    />
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
