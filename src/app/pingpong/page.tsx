'use client';

import Link from 'next/link';
import { Skeleton } from '../components/ui';
import PingpongRow from '../components/pingpong/PingpongRow';
import PingpongMatchesSection from '../components/pingpong/PingpongMatchesSection';
import AddActivityButton from '../components/sport/AddActivityButton';
import { usePingpongLeaderboard } from '../hooks/usePingpongLeaderboard';
import { usePingpongMatches } from '../hooks/usePingpongMatches';

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
 *
 * No sport switcher. There was one, gated on `followsBoth`, and it was the
 * bug: a segmented radiogroup — the shape of an in-page filter — whose only
 * behaviour was `router.push('/')`. Nothing about it predicted leaving the
 * page, and `/` is the app home, which lands with a season countdown, streak
 * banners and a ranking animation. It was one-directional too: `/` renders
 * no switcher, so the "filter" could never be undone from the other side.
 *
 * Crossing between the two boards belongs to the bottom nav, which already
 * offers both as explicit tabs to everyone whatever their preference. Two
 * controls that look different and do the same thing is the worse failure.
 *
 * The match history lives here too, below the board. It used to be its own
 * route, `/pingpong/matches`, which nothing linked to — a fully-built page
 * reachable only by typing the URL. Merging it answers the question the owner
 * actually asked ("on aurait classement et match au meme endroit ?") and
 * fixes the cold start: a rank is withheld until eight weighted matches, so
 * early on this screen would otherwise be nothing but an empty ranking, which
 * reads as a broken feature rather than a new one.
 *
 * Two requests, deliberately not one. The matches load through their own hook
 * with their own loading and error states, so a history that fails still
 * leaves a working leaderboard behind it.
 */
export default function PingpongPage() {
  const { segmentation, loading, error } = usePingpongLeaderboard();
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    refresh: refreshMatches,
  } = usePingpongMatches();

  const { ranked, calibrating, inactive, isEmpty } = segmentation;
  // One list, in tier order: settled ratings first, then those still
  // calibrating, then the players nobody has seen for a fortnight.
  const rows = [...ranked, ...calibrating, ...inactive];

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="flex flex-col items-center mt-8 mb-6">
          <h1 className="text-title mb-2">Classement ping-pong</h1>
          {/* Suppressed on a cold start. "0 joueur classé" above an empty
              board states a fact nobody needs and makes a new feature read
              as a dead one; the empty state below says the useful thing
              instead. It returns the moment anyone is on the board. */}
          {!isEmpty && (
            <p className="text-sm text-neutral-500">
              <span data-testid="pingpong-count">{ranked.length}</span> joueur
              {ranked.length > 1 ? 's' : ''} classé{ranked.length > 1 ? 's' : ''}
              {calibrating.length > 0 &&
                ` + ${calibrating.length} en calibrage`}
              {inactive.length > 0 &&
                ` + ${inactive.length} inactif${inactive.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

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
            <p className="text-regular text-neutral-400 mb-6">
              Impossible de charger le classement. Réessaie dans un instant.
            </p>
            {/* A failed read does not break the write path. Without this, an
                unrelated server hiccup blocks recording a match that has
                already been played, which is the one thing still worth doing
                while the board is down. */}
            <Link
              href="/pingpong/add"
              className="inline-block px-5 py-3 rounded-xl bg-primary-500 text-neutral-900 font-semibold text-sm"
            >
              Enregistrer un match
            </Link>
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

        {/* Gated the same way as the races page: with an empty board the
            empty state's own call to action sits a few pixels away, and two
            prompts to do the same thing on one screen is one too many. */}
        {!loading && !error && !isEmpty && <AddActivityButton />}

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

        {/* Held back only while the board itself is loading or broken. A dead
            board means the whole screen is an error message, and matches
            below it would suggest the failure was partial when it was not.
            Otherwise the section decides for itself what to render. */}
        {!loading && !error && (
          <PingpongMatchesSection
            matches={matches}
            loading={matchesLoading}
            error={matchesError}
            onRetry={refreshMatches}
          />
        )}
      </div>
    </div>
  );
}
