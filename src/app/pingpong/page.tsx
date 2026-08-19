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
import AddActivityButton from '@/app/components/sport/AddActivityButton';
import BoardPanelHeading from '@/app/components/sport/BoardPanelHeading';
import { formatCompetitorName } from '../utils/formatters';
import { PingpongPlayer } from '../models/Pingpong';
import { usePingpongLeaderboard } from '../hooks/usePingpongLeaderboard';
import { usePingpongMatches } from '../hooks/usePingpongMatches';

/**
 * The ping-pong leaderboard.
 *
 * ONE ranked list, numbered from 1, with everyone on it. This reverses the
 * calibration gate the page was built around, and the reversal is the point
 * of the screen rather than a detail of it.
 *
 * WHY. Measured in production after a full rating recompute, the API's gate —
 * 5 weighted matches AND rd ≤ 200, itself already loosened from 8/150, which
 * had admitted nobody at all — ranked 2 players out of 8 in an office of 8.
 * Don Joran was one match short; Maxime was two rd points over. Six of the
 * eight rows rendered an empty rank column. A leaderboard showing a quarter of
 * its league is not a strict leaderboard, it is one that looks broken, and the
 * six it declines to place are exactly the people who most need a reason to
 * keep playing.
 *
 * So uncertainty is stated instead of used to exclude, which is Glickman's own
 * argument for RD and what Lichess ships: a provisional rating appears with a
 * `?` next to it. The list is ordered on the conservative score (rating −
 * 2×RD), so an unsettled rating is already penalised by its own deviation —
 * a one-match player sinks on the arithmetic rather than on a rule.
 *
 * `board` comes from `buildPingpongBoard`. The hook still returns
 * `segmentation` alongside it and this page no longer reads it: the TV board
 * does, and it branches its whole layout on `ranked.length`, so collapsing the
 * tiers there would have re-laid-out a screen this work was not scoped to
 * touch. See the note on `segmentPingpongLeaderboard`.
 *
 * THE PODIUM IS GATED ON POSITION, AND IT LIFTS THE CROWNED THREE OUT OF THE
 * LIST. Third rule this screen has had, so the chain is written down once:
 *
 * 1. ORIGINALLY three RANKED players, removed into `rest`. Sound while ranked
 *    and settled were one fact, both decided by the API's gate.
 * 2. THEN numbering everyone split those apart, so it was re-gated on
 *    CONFIDENCE and stopped removing anyone — the crowned three need not be
 *    the list's top three, so lifting them out would have left gaps.
 * 3. NOW position, with the removal back.
 *
 * (2) is the bug the owner reported: "on affiche les trois personnes qui sont
 * confirmés en mode podium et en dessous on les re afficher dans la liste
 * mélangés avec les gens non confirmés donc c'est ultra perturbant." The same
 * three faces rendered twice, six inches apart. No precedent was found for a
 * featured section selected on anything but position — Lichess and FIDE use
 * confidence as an entry condition for the whole list, never to split one
 * screen into two differently-sorted regions; Chess.com repeats rows in a
 * featured block but a page away, and co-located duplication reads as a bug.
 *
 * So the podium is ranks 1-3, the list runs 4-8 with true contiguous ranks,
 * and nobody appears twice. The uncertainty moved onto the card: a crowned
 * player may be provisional now, and the card carries the same `?` the rows
 * do. See `buildPingpongBoard` for why the conservative score does NOT damp
 * that risk on its own — the RD penalty is already inside the number the
 * board sorts on.
 *
 * Still no group headings. No platform surveyed renders three separately-headed
 * groups — they either exclude the uncertain entirely (Lichess, UTR, FIDE) or
 * keep everyone inline with a short marker (FICS). Three headers on a phone
 * list turns a third of the screen into chrome, and visually establishes "the
 * bottom group" as somewhere people live.
 *
 * INACTIVE PLAYERS ARE PARKED BELOW THE RANKING, in their own section, with
 * no rank. This reverses the previous rule on this screen, which kept them
 * numbered inline and let them onto the podium, and it was asked for directly:
 * "un systeme similaire qu'il y a sur mario kart qui enleve les joueurs
 * inactifs du classement au bout de x jours". The Mario Kart board has always
 * worked this way; this one now matches it.
 *
 * The old argument was that a stale rating is still the best estimate of how
 * someone plays. It is, and it is not what a leaderboard claims: the claim is
 * about who is playing well now, and someone gone two weeks is not in it.
 * Left inline they hold a position against people who turned up, and hold it
 * forever, since nothing decays the rating out from under them.
 *
 * This does NOT reopen the gap problem that killed the earlier attempt at
 * excluding people from the podium. Inactive players are removed before
 * anything is numbered rather than skipped during, so ranks 1..N stay
 * contiguous and the section below carries no numbers to contradict them.
 *
 * The section keeps the group heading the ranking still refuses, and that is
 * not a contradiction: a heading is only chrome when it labels a group people
 * cannot tell apart. "Inactifs" states the one fact that explains why those
 * rows have no rank, which is a question a reader would otherwise be left
 * with. The uncertainty marker needs no such heading — it is per-row and it is
 * already on the row.
 *
 * Calibrating players stay in the main list, which is where this board still
 * departs from Mario Kart on purpose. Splitting them out too would leave 2 of
 * 8 rows in the ranking on production data — the exact failure the one-list
 * board was built to fix. "Not sure how good you are" and "you are not here"
 * are different claims and only the second justifies withholding a rank.
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
 * and fixed the cold start: when a rank was withheld until calibration, early
 * on this screen would otherwise be nothing but an empty ranking, which reads
 * as a broken feature rather than a new one. That particular cold start no
 * longer exists — everyone is ranked from their first match — but the history
 * earns its place on the tab regardless. It sat under the
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
  const { board, loading, error } = usePingpongLeaderboard();
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

  const { rows, podiumRows, inactive, confidentCount, isEmpty } = board;

  // Everyone on the board: podium, list and the inactive section. `rows` is
  // only the list under the podium, so counting that alone would report 5 of 8
  // in the subtitle while eight people are on screen.
  const totalPlayers = podiumRows.length + rows.length + inactive.length;

  // The cold-start note is gone with the gate. It said "Personne n'est encore
  // classé, 8 matchs nécessaires", and all three of its claims are now wrong:
  // everyone is ranked, so its premise is false; the bar was 5 rather than 8,
  // so its figure was already stale; and the state it explained — a list of
  // rows with no numbers — cannot occur any more.

  const showsBoard = !loading && !error && !isEmpty;

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* NO PAGE TITLE HERE ANY MORE — same fix as the Mario Kart board,
            same reason. "Classement ping-pong" and its tier counts used to sit
            above the selector and stay there when Matchs was picked, titling a
            panel that was not rendered ("pareil sur ping pong ca change pas le
            titre en haut de la page"). Each panel names itself now; the
            reasoning for the panel-owned h1 is on `BoardPanelHeading`.

            The exception below is the three states that render no tab strip at
            all. */}

        {/* The tabs are gated on `showsBoard`, so while the board is loading,
            broken or empty there is no panel to own a heading — and a document
            with no h1 is worse than a heading that is momentarily generic. The
            board's own title stands in, without counts: there are none to
            state, and on the cold start "0 joueur classé" was already
            suppressed for making a new feature read as a dead one. */}
        {!showsBoard && (
          <BoardPanelHeading title="Classement des pongistes" className="mt-8 mb-6" />
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
        {showsBoard && <AddActivityButton variant="floating" />}

        {/* Same gate as the add button. A "Matchs" tab over an empty board
            opens a blank panel, and a control that reveals nothing reads as
            broken rather than as empty. */}
        {showsBoard && (
          <PingpongViewTabs
            value={view}
            onChange={setView}
            className="mt-8 mb-4"
          />
        )}

        {showsBoard && view === 'ranking' && (
          <div
            role="tabpanel"
            id={panelId('ranking')}
            aria-labelledby={tabId('ranking')}
            tabIndex={0}
          >
            {/* The subtitle counts the LIST, then says how much of it is
                settled. It used to count the tiers — "2 joueurs classés + 6 en
                calibrage" — which described a screen where six rows had no
                number. Over eight numbered rows that line would contradict what
                sits under it, so the first figure is everyone and the second is
                the uncertainty, stated once at the top as well as per row.

                The cold-start suppression is preserved: this panel only renders
                when `showsBoard` is true, which already excludes the empty
                board. The guard above covers that case with a title and no
                counts. */}
            <BoardPanelHeading
              title="Classement des pongistes"
              className="mb-6"
              subtitle={
                <>
                  <span data-testid="pingpong-count">{totalPlayers}</span> joueur
                  {totalPlayers > 1 ? 's' : ''}
                  {' · '}
                  <span data-testid="pingpong-confident-count">
                    {confidentCount}
                  </span>{' '}
                  niveau{confidentCount > 1 ? 'x' : ''} confirmé
                  {confidentCount > 1 ? 's' : ''}
                </>
              }
            />

            {/* Ranks 1-3, and they do NOT appear in the list below — see the
                chain at the top of this file. Empty below three players; the
                carousel renders nothing when handed nothing, and
                `buildPingpongBoard` is the one place that decides when. */}
            <PingpongPodiumCarousel
              podium={podiumRows}
              onSelect={setSelected}
              className="mb-4"
            />

            <div className="space-y-2.5">
              {rows.map((row, index) => (
                <PingpongRow
                  key={row.player.id}
                  player={row.player}
                  position={row.position}
                  onClick={() => setSelected(row.player)}
                  animationDelay={Math.min(index * 30, 300)}
                />
              ))}
            </div>

            {/* Players who have not played inside the inactivity window,
                below the ranking rather than inside it. Same shape as the
                Mario Kart board's own inactive section, down to the rules
                either side of the label.

                The heading is the exception to this screen's no-group-headings
                rule, and a narrow one. That rule is about not carving a list
                people cannot tell apart into named tiers; here the rows have
                visibly no rank, and without a word saying why, the reader is
                left to guess whether the board failed to load. One heading
                that answers a question the layout raises is not the chrome the
                rule was written against.

                No `position` passed, deliberately. The row falls back to
                `player.rank`, which the API leaves null for anyone inactive,
                so the badge slot renders empty — the ranking's numbers are not
                repeated or re-derived down here, which is what keeps 1..N the
                only numbering on the screen. */}
            {inactive.length > 0 && (
              <div className="mt-8 space-y-2.5" data-testid="pingpong-inactive">
                <div className="flex items-center gap-3 mb-3 px-1">
                  <div className="h-px flex-1 bg-neutral-700" />
                  <h2 className="text-sm text-neutral-500 uppercase tracking-wider">
                    Inactifs
                  </h2>
                  <div className="h-px flex-1 bg-neutral-700" />
                </div>

                {inactive.map((player, index) => (
                  <PingpongRow
                    key={player.id}
                    player={player}
                    onClick={() => setSelected(player)}
                    animationDelay={Math.min(index * 30, 300)}
                  />
                ))}
              </div>
            )}
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
            {/* The panel's title, matching the tab that opened it. That
                repetition was the reason this panel deliberately carried no
                heading before — but that held only while a page-level title
                sat above the tabs. With it gone, an unheaded panel leaves the
                document with no h1 at all, which is the worse trade: the tab
                is a control, the heading is a landmark. */}
            <BoardPanelHeading title="Matchs" className="mb-4" />

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
