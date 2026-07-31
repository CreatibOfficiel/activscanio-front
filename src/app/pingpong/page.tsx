'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../components/ui';
import PingpongRow from '../components/pingpong/PingpongRow';
import SportSwitcher from '../components/sport/SportSwitcher';
import { usePingpongLeaderboard } from '../hooks/usePingpongLeaderboard';
import { useSportPreference } from '../hooks/useSportPreference';

/**
 * The ping-pong leaderboard.
 *
 * One flat list. No platform surveyed renders three separately-headed
 * groups — they either exclude the uncertain entirely (Lichess, UTR, FIDE)
 * or keep everyone inline with a short marker (FICS). Three headers on a
 * 25-row phone list turns a third of the screen into chrome, and visually
 * establishes "the bottom group" as somewhere people live.
 *
 * Everyone the API returned appears. Someone who cannot find themselves
 * assumes the app forgot them, which is worse than seeing themselves
 * unranked — and the row itself says why they carry no rank.
 *
 * A separate route from the Mario Kart board rather than a branch inside
 * it: that page runs a four-phase ranking animation over `Competitor`-typed
 * components, and a source-text guard test asserts on its contents.
 */
export default function PingpongPage() {
  const router = useRouter();
  const { segmentation, loading, error } = usePingpongLeaderboard();
  const { followsBoth } = useSportPreference();

  const { ranked, calibrating, inactive, isEmpty } = segmentation;
  // One list, in tier order: settled ratings first, then those still
  // calibrating, then the players nobody has seen for a fortnight.
  const rows = [...ranked, ...calibrating, ...inactive];

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="flex flex-col items-center mt-8 mb-6">
          <h1 className="text-title mb-2">Classement ping-pong</h1>
          <p className="text-sm text-neutral-500">
            <span data-testid="pingpong-count">{ranked.length}</span> joueur
            {ranked.length > 1 ? 's' : ''} classé{ranked.length > 1 ? 's' : ''}
            {calibrating.length > 0 &&
              ` + ${calibrating.length} en calibrage`}
            {inactive.length > 0 &&
              ` + ${inactive.length} inactif${inactive.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Only rendered for someone who follows both sports: a control
            offering a single choice conveys nothing. */}
        {followsBoth && (
          <div className="flex justify-center mb-6">
            <SportSwitcher
              value="ping-pong"
              onChange={(sport) => {
                if (sport === 'mario-kart') router.push('/');
              }}
            />
          </div>
        )}

        {loading && (
          <div data-testid="pingpong-loading" className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {/* An empty list after a failed request reads as "nobody plays",
            which is a lie. The two states are kept apart. */}
        {!loading && error && (
          <div
            data-testid="pingpong-error"
            className="text-center py-12 px-4"
          >
            <p className="text-4xl mb-4">🏓</p>
            <h2 className="text-heading text-white mb-2">
              Classement indisponible
            </h2>
            <p className="text-regular text-neutral-400">
              Impossible de charger le classement. Réessaie dans un instant.
            </p>
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div
            data-testid="pingpong-empty"
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <p className="text-5xl mb-4">🏓</p>
            <h2 className="text-heading text-white mb-2">
              La table est libre !
            </h2>
            <p className="text-regular text-neutral-400 mb-6 max-w-sm">
              Personne n&apos;a encore joué. Enregistre le premier match pour
              lancer le classement.
            </p>
            <Link
              href="/pingpong/add"
              className="px-5 py-3 rounded-xl bg-primary-500 text-neutral-900 font-semibold text-sm"
            >
              Enregistrer un match
            </Link>
          </div>
        )}

        {!loading && !error && !isEmpty && (
          <div className="space-y-2">
            {rows.map((player, index) => (
              <PingpongRow
                key={player.id}
                player={player}
                animationDelay={Math.min(index * 30, 300)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
