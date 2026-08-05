'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Modal, Skeleton } from '../components/ui';
import PingpongRow from '../components/pingpong/PingpongRow';
import PingpongMatchesSection from '../components/pingpong/PingpongMatchesSection';
import PingpongPodiumCarousel from '../components/pingpong/PingpongPodiumCarousel';
import PingpongViewTabs, {
  PingpongView,
  panelId,
  tabId,
} from '../components/pingpong/PingpongViewTabs';
import PingpongTab from '../components/profile/PingpongTab';
import { AddActivitySlot } from '../context/AddActivitySlotContext';
import { formatCompetitorName } from '../utils/formatters';
import { PingpongPlayer } from '../models/Pingpong';
import { usePingpongLeaderboard } from '../hooks/usePingpongLeaderboard';
import { usePingpongMatches } from '../hooks/usePingpongMatches';

/**
 * The ping-pong leaderboard.
 *
 * The top three sit in a carousel above the list; everyone else is one flat
 * list below it. `segmentPingpongLeaderboard` has returned `podium` and
 * `rest` since it was written and this page never read them — it flattened
 * every tier into a single array, so the podium half was dead code. It is
 * read now, including its `minPodiumSize` guard: below three ranked players
 * there is no podium at all, because a carousel of one is a pedestal with a
 * scroll hint that scrolls nowhere.
 *
 * Below the podium, still one flat list. No platform surveyed renders three
 * separately-headed groups — they either exclude the uncertain entirely
 * (Lichess, UTR, FIDE) or keep everyone inline with a short marker (FICS).
 * Three headers on a 25-row phone list turns a third of the screen into
 * chrome, and visually establishes "the bottom group" as somewhere people
 * live.
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
 * THE TAB BAR IS NOT THAT CONTROL COMING BACK. The switcher that was deleted
 * navigated: it looked like a filter and pushed a route. This one stays on
 * the page and swaps a rendered panel, which is the behaviour its shape
 * promises. It is a `tablist` rather than a `radiogroup` for the same
 * reason — a ranking and a match history are two different things sharing a
 * screen, not one thing filtered — and it writes nothing to the URL, so the
 * back button still leaves the page rather than unwinding a toggle. A guard
 * test clicks every tab and asserts the router stayed untouched.
 *
 * The match history lives here too, behind that second tab. It used to be
 * its own route, `/pingpong/matches`, which nothing linked to — a fully-built
 * page reachable only by typing the URL. Merging it answers the question the
 * owner actually asked ("on aurait classement et match au meme endroit ?")
 * and fixes the cold start: a rank is withheld until eight weighted matches,
 * so early on this screen would otherwise be nothing but an empty ranking,
 * which reads as a broken feature rather than a new one. It sat under the
 * board before the tabs; on a phone that put the history below however many
 * rows the office had grown to, which is a scroll nobody performs.
 *
 * Both fetches stay eager and parallel. The tab swaps a rendered panel, it
 * does not gate a request, so opening the history is instant rather than the
 * start of a spinner.
 *
 * Two requests, deliberately not one. The matches load through their own hook
 * with their own loading and error states, so a history that fails still
 * leaves a working leaderboard behind it.
 *
 * The tab bar is gated on `!isEmpty`, the same condition as the add button.
 * With nobody on the board a "Matchs" tab leads to a blank panel, and a
 * control that reveals nothing reads as broken rather than as empty.
 *
 * One `selectedPlayer` for the detail sheet, on the page rather than one
 * modal per row. `LeaderboardRow` does it per row and pays an O(rows ×
 * races) `useMemo` on every render for it; a row here also mounts a
 * component that fires four requests, so a modal per row would put a hundred
 * of them behind a list nobody has tapped.
 */
export default function PingpongPage() {
  const { segmentation, loading, error } = usePingpongLeaderboard();
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    refresh: refreshMatches,
    loadingMore: matchesLoadingMore,
    loadMoreError: matchesLoadMoreError,
    hasMore: matchesHasMore,
    loadMore: loadMoreMatches,
  } = usePingpongMatches();

  const [view, setView] = useState<PingpongView>('ranking');
  const [selected, setSelected] = useState<PingpongPlayer | null>(null);

  const { ranked, calibrating, inactive, podium, rest, isEmpty } = segmentation;
  // Below the podium, in tier order: the ranked players the podium did not
  // take, then those still calibrating, then the players nobody has seen for
  // a fortnight. `rest` is every ranked player when there is no podium, so
  // this is the whole board in that case.
  const rows = [...rest, ...calibrating, ...inactive];

  // The realistic first week: people have played, the API has ranked nobody,
  // and a board of unnumbered rows with no explanation reads as broken.
  const nobodyRanked = !isEmpty && ranked.length === 0;

  const showsBoard = !loading && !error && !isEmpty;

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

        {/* Gated exactly as before: with an empty board the empty state's own
            call to action sits a few pixels away, and two prompts to do the
            same thing on one screen is one too many.

            What changed is only where the control lands. It used to be a FAB
            floating bottom-right over the list, permanently covering the end
            of a row; it now portals into the bottom bar's centre. The gate is
            page knowledge — no route can tell whether a board came back
            empty — so it stays here rather than moving into the nav. */}
        {showsBoard && <AddActivitySlot />}

        {/* Same gate as the add button. A "Matchs" tab over an empty board
            opens a blank panel, and a control that reveals nothing reads as
            broken rather than as empty. */}
        {showsBoard && (
          <PingpongViewTabs
            value={view}
            onChange={setView}
            className="mb-4"
          />
        )}

        {showsBoard && view === 'ranking' && (
          <div
            role="tabpanel"
            id={panelId('ranking')}
            aria-labelledby={tabId('ranking')}
            tabIndex={0}
          >
            <PingpongPodiumCarousel
              podium={podium}
              onSelect={setSelected}
              className="mb-4"
            />

            {/* Not an error, and not silence. Everyone is calibrating during
                the first week and a list of unnumbered rows with nothing
                explaining it reads as a board that failed to load. */}
            {nobodyRanked && (
              <p
                data-testid="pingpong-nobody-ranked"
                className="mb-3 text-sm text-neutral-500"
              >
                Personne n&apos;est encore classé — 8 matchs nécessaires.
              </p>
            )}

            <div className="space-y-2.5">
              {rows.map((player, index) => (
                <PingpongRow
                  key={player.id}
                  player={player}
                  onClick={() => setSelected(player)}
                  animationDelay={Math.min(index * 30, 300)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Held back only while the board itself is loading or broken. A dead
            board means the whole screen is an error message, and matches
            below it would suggest the failure was partial when it was not.
            Otherwise the section decides for itself what to render. */}
        {showsBoard && view === 'matches' && (
          <div
            role="tabpanel"
            id={panelId('matches')}
            aria-labelledby={tabId('matches')}
            tabIndex={0}
          >
            <PingpongMatchesSection
              matches={matches}
              loading={matchesLoading}
              error={matchesError}
              onRetry={refreshMatches}
              loadingMore={matchesLoadingMore}
              loadMoreError={matchesLoadMoreError}
              hasMore={matchesHasMore}
              onLoadMore={loadMoreMatches}
            />
          </div>
        )}
      </div>

      {/* A sheet rather than a route: the board is a scroll position someone
          worked to reach, and pushing a page throws it away for a glance at
          one player. Mounted only once something is selected, because the
          sheet's contents fetch on mount. */}
      {selected && (
        <Modal
          isOpen
          onClose={() => setSelected(null)}
          placement="sheet"
          title={formatCompetitorName(selected.firstName, selected.lastName)}
        >
          <PingpongTab
            competitorId={selected.competitorId}
            perspective="other"
          />
        </Modal>
      )}
    </div>
  );
}
