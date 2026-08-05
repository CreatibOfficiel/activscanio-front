"use client";

import { useContext, useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { AppContext } from "./context/AppContext";
import { StreakWarningStatus } from "./models/Achievement";
import { AchievementsRepository } from "./repositories/AchievementsRepository";
import { Button, Countdown } from "./components/ui";
import { MdFlag } from "react-icons/md";
import { getRaceSeasonEndDate } from "./tv/display/utils/deadlines";
import { StreakWarningBanner } from "./components/achievements";
import {
  ElevatedPodium,
  LeaderboardRow,
  LeagueDivider,
} from "./components/leaderboard";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import { useRankingAnimation } from "./hooks/useRankingAnimation";
import RankingAnimationOverlay from "./components/leaderboard/RankingAnimationOverlay";
import { useLeaderboardSegmentation } from "./hooks/useLeaderboardSegmentation";
import MarioKartViewTabs, {
  MarioKartView,
  panelId,
  tabId,
} from "./components/race/MarioKartViewTabs";
import RaceHistory from "./components/race/RaceHistory";
import { AddActivitySlot } from "./context/AddActivitySlotContext";

const SEGMENTATION_OPTIONS = { excludePodiumFromLeagues: true };

/**
 * The Mario Kart board: the ranking, and behind a second tab, the race
 * history.
 *
 * The history used to be its own bottom-nav tab (`/races`), which meant Mario
 * Kart held two of the bar's four entries while ping-pong made the same
 * ranking-versus-history choice with an in-page tablist. One architecture,
 * two expressions. Both sports now work the same way: one tab in the bar, one
 * selector on the board.
 *
 * `/races` is untouched as a URL and renders the very same `RaceHistory`
 * component this page's Courses panel does. One implementation, two entry
 * points — nobody's bookmark broke, and the filters and infinite scroll are
 * not maintained twice.
 *
 * The tabs write nothing to the URL, matching ping-pong. The board is the
 * app's home screen; a toggle that pushed history entries would make the back
 * button unwind a tab press instead of leaving the app, and `/races` already
 * provides the shareable address for the history.
 *
 * The ranking is the default and that is not arbitrary: `/` is what the app
 * opens to and the ranking is what people open it for. The panels are swapped,
 * not stacked — leaving the podium above a 474-race list would make the
 * selector read as a filter that did nothing.
 */
export default function Home() {
  const { isLoading, allCompetitors, refreshCompetitors } = useContext(AppContext);
  const { isSignedIn, getToken } = useAuth();
  const [now, setNow] = useState<Date | null>(null);
  const [view, setView] = useState<MarioKartView>('ranking');
  const [streakWarnings, setStreakWarnings] = useState<StreakWarningStatus | null>(null);
  const seasonEndDate = useMemo(() => getRaceSeasonEndDate(), []);

  const onPullRefresh = useCallback(async () => {
    await refreshCompetitors();
  }, [refreshCompetitors]);

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: onPullRefresh,
  });

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Fetch streak warnings for signed-in users (non-blocking)
  useEffect(() => {
    if (!isSignedIn) return;
    const fetchWarnings = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const warnings = await AchievementsRepository.getStreakWarnings(token);
        setStreakWarnings(warnings);
      } catch {
        // Non-blocking — silently ignore
      }
    };
    fetchWarnings();
  }, [isSignedIn, getToken]);

  const {
    confirmed, inactive, calibrating, topThree,
    leagueGroups, trends, confirmedRanks, inactiveRanks, calibratingRanks,
  } = useLeaderboardSegmentation(allCompetitors, SEGMENTATION_OPTIONS);

  const {
    animationPhase,
    displayOrder,
    showUniformCards,
    changedIds,
    onTransitionComplete,
  } = useRankingAnimation({
    mode: 'homepage',
    competitors: confirmed,
    enabled: !isLoading && !!now,
  });

  if (isLoading || !now) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24 relative overflow-x-hidden">
      {/* Top Header Glow - Intensified */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none z-0 opacity-40 blur-[100px]"
        style={{
          background: 'radial-gradient(circle at center, var(--color-primary-500) 0%, transparent 70%)',
          width: '150%',
        }}
      />

      {/* Test Checkered Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, white 25%, transparent 25%), 
            linear-gradient(-45deg, white 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, white 75%), 
            linear-gradient(-45deg, transparent 75%, white 75%)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px 20px, 20px 0'
        }}
      />

      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
          style={{ top: isPulling ? pullDistance - 40 : 8 }}
        >
          <div
            className={`w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full ${isRefreshing || pullDistance >= 80 ? "animate-spin" : ""
              }`}
            style={
              !isRefreshing && pullDistance < 80
                ? { transform: `rotate(${pullDistance * 3.6}deg)`, opacity: pullDistance / 80 }
                : undefined
            }
          />
        </div>
      )}

      {/* Content wrapper with pull offset */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mt-8 mb-8">
          <h1 className="text-title mb-2">Classement des pilotes</h1>

          <p className="text-sm text-neutral-500">
            {confirmed.length} pilote
            {confirmed.length > 1 ? "s" : ""}
            {inactive.length > 0 && ` + ${inactive.length} inactif${inactive.length > 1 ? "s" : ""}`}
            {calibrating.length > 0 && ` + ${calibrating.length} en calibrage`}
          </p>
        </div>

        {/* Season countdown. Above the selector because it belongs to the
            season rather than to either view — the deadline is the same fact
            whether you are reading the board or the history, and RaceHistory
            is told to suppress its own copy here. */}
        <Countdown
          label="Fin de saison"
          targetDate={seasonEndDate}
          thresholds={{ warningSeconds: 259200, criticalSeconds: 86400 }}
          expiredLabel="Saison terminée"
          className="mx-4 mb-4"
        />

        {/* Streak Warning Banners. Also above the selector: a warning that the
            streak is about to lapse is the reason to open the app at all, and
            hiding it behind whichever tab happens to be showing would bury
            the one thing that is time-critical. */}
        {streakWarnings && <StreakWarningBanner warnings={streakWarnings} className="mb-4" />}

        <div className="flex justify-center mb-4">
          <MarioKartViewTabs value={view} onChange={setView} />
        </div>

        {view === 'races' && (
          <div
            role="tabpanel"
            id={panelId('races')}
            aria-labelledby={tabId('races')}
            tabIndex={0}
          >
            {/* The same component `/races` renders. The countdown is
                suppressed because this page already shows one above. */}
            <RaceHistory
              showCountdown={false}
              renderAddControl={() => <AddActivitySlot />}
            />
          </div>
        )}

        {view === 'ranking' && (
        <div
          role="tabpanel"
          id={panelId('ranking')}
          aria-labelledby={tabId('ranking')}
          tabIndex={0}
        >
        {/* Ranking animation overlay + Podium + Leagues */}
        <RankingAnimationOverlay
          phase={animationPhase}
          displayOrder={displayOrder}
          changedIds={changedIds}
          variant="mobile"
          onTransitionComplete={onTransitionComplete}
        >
          {/* Podium or empty state */}
          {topThree.length > 0 ? (
            <div className="mb-8">
              <ElevatedPodium
                topThree={topThree}
                trends={trends}
                disableEntryAnimation={showUniformCards}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="mb-6">
                <Image
                  src="/illustrations/empty-podium.svg"
                  alt="Podium vide"
                  width={240}
                  height={200}
                  priority
                />
              </div>

              <div className="text-center max-w-sm">
                <h2 className="text-heading text-white mb-2">
                  Le podium vous attend !
                </h2>
                <p className="text-regular text-neutral-400 mb-6">
                  Aucune course n&apos;a encore été enregistrée. Ajoutez votre première course pour voir le classement !
                </p>

                <Link href="/races/add">
                  <Button variant="primary" className="gap-2">
                    <MdFlag className="text-lg" />
                    Ajouter une course
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* League sections (below podium) */}
          {leagueGroups.map((group, groupIndex) => (
            <div key={group.league.id} className={`space-y-2 ${groupIndex === 0 ? "" : "mt-6"}`}>
              <LeagueDivider league={group.league} variant="mobile" className="mb-3 px-1" />
              {group.items.map((competitor, index) => (
                <LeaderboardRow
                  key={competitor.id}
                  competitor={competitor}
                  rank={confirmedRanks.get(competitor.id) ?? index + 4}
                  trend={trends.get(competitor.id)}
                  animationDelay={index * 50}
                  disableEntryAnimation={showUniformCards}
                />
              ))}
            </div>
          ))}
        </RankingAnimationOverlay>

        {/* Inactive confirmed competitors */}
        {inactive.length > 0 && (
          <div className="mt-8 space-y-2">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="h-px flex-1 bg-neutral-700" />
              <h2 className="text-sm text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <div className="relative w-5 h-5">
                  <Image
                    src="/mk-icons/bob-omb.webp"
                    alt="Inactive"
                    fill
                    className="object-contain"
                  />
                </div>
                Inactifs
              </h2>
              <div className="h-px flex-1 bg-neutral-700" />
            </div>

            {inactive.map((competitor, index) => (
              <div key={competitor.id} className="opacity-50">
                <LeaderboardRow
                  competitor={competitor}
                  rank={inactiveRanks.get(competitor.id) ?? confirmed.length + index + 1}
                  animationDelay={index * 50}
                />
              </div>
            ))}
          </div>
        )}

        {/* Calibrating competitors */}
        {calibrating.length > 0 && (
          <div className="mt-8 space-y-2">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="h-px flex-1 bg-neutral-700" />
              <h2 className="text-sm text-neutral-500 uppercase tracking-wider">
                En calibrage
              </h2>
              <div className="h-px flex-1 bg-neutral-700" />
            </div>

            {calibrating.map((competitor, index) => (
              <LeaderboardRow
                key={competitor.id}
                competitor={competitor}
                rank={calibratingRanks.get(competitor.id) ?? confirmed.length + index + 1}
                animationDelay={index * 50}
              />
            ))}
          </div>
        )}
        </div>
        )}{/* end ranking panel */}
      </div>{/* end content wrapper */}
    </div>
  );
}
