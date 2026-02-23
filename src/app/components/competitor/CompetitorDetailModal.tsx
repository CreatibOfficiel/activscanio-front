"use client";

import { FC, useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RecentRaceInfo } from "@/app/models/RecentRaceInfo";
import EditCompetitorButton from "./EditCompetitorButton";
import Modal from "../ui/Modal";
import Skeleton from "../ui/Skeleton";
import { formatCompetitorName, formatRelativeDate } from "@/app/utils/formatters";
import { TrendDirection } from "../leaderboard/TrendIndicator";
import DuelChallengeForm from "../duel/DuelChallengeSheet";
import { useCurrentUserData } from "@/app/hooks/useCurrentUserData";
import { BettingRepository } from "@/app/repositories/BettingRepository";
import { MdClose, MdSportsKabaddi, MdChevronRight } from "react-icons/md";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  competitor: Competitor;
  isOpen: boolean;
  onClose: () => void;
  rank?: number;
  trend?: { direction: TrendDirection; value?: number } | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatRankFR = (rank: number) => {
  if (rank <= 0) return "--";
  return rank === 1 ? "1er" : `${rank}e`;
};

const consistencyLabel = (positions?: number[]) => {
  if (!positions || positions.length < 3) return "Pas assez de données";
  const mean = positions.reduce((a, b) => a + b, 0) / positions.length;
  const variance =
    positions.reduce((sum, p) => sum + (p - mean) ** 2, 0) / positions.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev < 1.2) return "Très régulier";
  if (stdDev < 2.5) return "Régulier";
  return "Imprévisible";
};

const formatPositions = (positions: number[]) =>
  positions.map((p) => `${p}${p === 1 ? "er" : "e"}`).join(", ");

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

const DetailSkeleton: FC = () => (
  <div className="space-y-6">
    {/* Hero skeleton */}
    <div className="flex flex-col items-center gap-3 py-6">
      <Skeleton variant="circular" width={80} height={80} />
      <Skeleton variant="text" width={140} height={20} />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={70} height={24} />
        <Skeleton variant="rounded" width={70} height={24} />
      </div>
    </div>

    {/* Stats tiles skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={72} />
      ))}
    </div>

    {/* Recent form skeleton */}
    <div className="space-y-2">
      <Skeleton variant="text" width={120} height={16} />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={48} height={48} />
        ))}
      </div>
    </div>

    {/* Results skeleton */}
    <div className="space-y-2">
      <Skeleton variant="text" width={140} height={16} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={48} />
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const CompetitorDetailModal: FC<Props> = ({ competitor, isOpen, onClose, rank: rankProp, trend: trendProp }) => {
  const { getRecentRacesOfCompetitor, getBestScoreOfCompetitor, allRaces, allCompetitors } =
    useContext(AppContext);
  const { userData } = useCurrentUserData();
  const { user } = useUser();

  const [recentRaces, setRecentRaces] = useState<RecentRaceInfo[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [step, setStep] = useState<"detail" | "challenge">("detail");
  const [userPoints, setUserPoints] = useState<number | undefined>(undefined);

  const isOwnCompetitor = userData?.competitorId === competitor.id;

  /* ---------- reset step on close ---------- */
  useEffect(() => {
    if (!isOpen) setStep("detail");
  }, [isOpen]);

  /* ---------- load recent races + best score ---------- */
  useEffect(() => {
    if (!isOpen) return;
    setIsLoaded(false);
    (async () => {
      const [data, bestScoreRes] = await Promise.all([
        getRecentRacesOfCompetitor(competitor.id),
        getBestScoreOfCompetitor(competitor.id),
      ]);
      setRecentRaces(data);
      setBestScore(bestScoreRes.bestScore);
      setIsLoaded(true);
    })();
  }, [competitor.id, isOpen, getRecentRacesOfCompetitor, getBestScoreOfCompetitor]);

  /* ---------- fetch user points for duel stakes ---------- */
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    const now = new Date();
    BettingRepository.getMonthlyRankings(now.getMonth() + 1, now.getFullYear())
      .then((res) => {
        const myRanking = res.rankings.find((r) => r.userId === user.id);
        setUserPoints(myRanking?.totalPoints ?? 0);
      })
      .catch(() => setUserPoints(0));
  }, [isOpen, user?.id]);

  /* ---------- derived data ---------- */
  const shortName = formatCompetitorName(
    competitor.firstName,
    competitor.lastName
  );
  const variant = competitor.characterVariant;
  const baseName = variant?.baseCharacter?.name;
  const variantLabel =
    variant && variant.label !== "Default" ? variant.label : null;

  const positions = (competitor.recentPositions ?? []).map(Number);
  const totalRaces = competitor.totalLifetimeRaces ?? competitor.raceCount ?? 0;
  const wins = competitor.totalWins ?? positions.filter((p) => p === 1).length;

  // Rank: prefer prop from parent (computed with ties), fallback to simple sort
  const currentRank = useMemo(() => {
    if (rankProp !== undefined) return rankProp;
    const sorted = [...allCompetitors].sort(
      (a, b) =>
        (b.conservativeScore ?? b.rating) - (a.conservativeScore ?? a.rating)
    );
    return sorted.findIndex((c) => c.id === competitor.id) + 1;
  }, [rankProp, allCompetitors, competitor.id]);

  // Trend: prefer prop from parent, fallback to local calculation
  const trend = useMemo(() => {
    if (trendProp !== undefined) return trendProp;
    if (competitor.previousDayRank == null || currentRank === 0) return null;
    const diff = competitor.previousDayRank - currentRank;
    if (diff > 0) return { direction: "up" as const, value: diff };
    if (diff < 0) return { direction: "down" as const, value: Math.abs(diff) };
    return { direction: "stable" as const, value: 0 };
  }, [trendProp, competitor.previousDayRank, currentRank]);

  // Rival calculation — returns worst enemy + full ranked list
  const rivalData = useMemo(() => {
    if (!allRaces.length || !allCompetitors.length) return null;

    const lossCount: Record<string, number> = {};
    const sharedCount: Record<string, number> = {};

    for (const race of allRaces) {
      const myResult = race.results.find(
        (r) => r.competitorId === competitor.id
      );
      if (!myResult) continue;

      for (const result of race.results) {
        if (result.competitorId === competitor.id) continue;
        const key = result.competitorId;
        sharedCount[key] = (sharedCount[key] ?? 0) + 1;
        if (result.rank12 < myResult.rank12) {
          lossCount[key] = (lossCount[key] ?? 0) + 1;
        }
      }
    }

    const allRivals = Object.entries(lossCount)
      .map(([id, losses]) => {
        const shared = sharedCount[id] ?? 0;
        if (shared < 3) return null;
        const comp = allCompetitors.find((c) => c.id === id);
        if (!comp) return null;
        return {
          id,
          name: formatCompetitorName(comp.firstName, comp.lastName),
          losses,
          shared,
          ratio: losses / shared,
        };
      })
      .filter(
        (r): r is { id: string; name: string; losses: number; shared: number; ratio: number } =>
          r !== null
      )
      .sort((a, b) => b.ratio - a.ratio || b.losses - a.losses);

    if (allRivals.length === 0) return null;

    return {
      worst: allRivals[0],
      all: allRivals,
    };
  }, [allRaces, allCompetitors, competitor.id]);

  // Podium count
  const podiumCount = positions.filter((p) => p <= 3).length;

  // Max score for progress bar
  const maxScore = 60;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      size="xl"
      className="!max-w-2xl"
    >
      {step === "challenge" ? (
        <DuelChallengeForm
          competitorId={competitor.id}
          competitorName={shortName}
          competitorAvatar={competitor.profilePictureUrl}
          userPoints={userPoints}
          onSuccess={onClose}
          onCancel={() => setStep("detail")}
        />
      ) : !isLoaded ? (
        <DetailSkeleton />
      ) : (
        <div className="space-y-5">
          {/* ---- HERO ---- */}
          <div
            className="-m-4 sm:-m-6 mb-0 p-6 pb-5 rounded-t-2xl"
          >
            {/* Close / Edit / Duel buttons */}
            <div className="flex justify-end gap-2 mb-3">
              {!isOwnCompetitor && (
                <button
                  onClick={() => setStep("challenge")}
                  className="p-2 rounded-xl text-primary-400 hover:text-primary-300 bg-primary-500/10 border border-primary-500/30 hover:bg-primary-500/20 transition-all duration-200 shadow-sm group"
                  aria-label="Défier"
                  title="Défier ce pilote"
                >
                  <MdSportsKabaddi className="text-xl transition-transform duration-200 group-hover:scale-110" />
                </button>
              )}
              <EditCompetitorButton competitor={competitor} />
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-900/50 border border-neutral-700 hover:bg-neutral-800/80 hover:border-neutral-600 transition-all duration-200 shadow-sm group"
                aria-label="Fermer"
              >
                <MdClose className="text-xl transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* Avatar with Metallic Ring */}
              <div
                className={`
                  w-[88px] h-[88px] rounded-full flex items-center justify-center p-[5px]
                  ${currentRank === 1 ? 'bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-700 shadow-[0_0_15px_rgba(255,215,0,0.3)]' : ''}
                  ${currentRank === 2 ? 'bg-gradient-to-br from-slate-100 via-slate-400 to-slate-500 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''}
                  ${currentRank === 3 ? 'bg-gradient-to-br from-orange-200 via-orange-600 to-orange-800 shadow-[0_0_15px_rgba(205,127,50,0.3)]' : ''}
                  ${currentRank > 3 ? 'bg-neutral-700/50' : ''}
                `}
              >
                <div className="w-full h-full rounded-full bg-neutral-900 p-1 overflow-hidden">
                  <Image
                    src={competitor.profilePictureUrl}
                    alt={shortName}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full rounded-full"
                  />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-xl font-bold text-neutral-100 mt-3">
                {shortName}
              </h2>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                {/* Character display: Round photo + Pill */}
                {variant && (
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full border border-neutral-600 overflow-hidden z-10 bg-neutral-900 shadow-sm flex-shrink-0">
                      <Image
                        src={variant.imageUrl}
                        alt={baseName || "Character"}
                        width={36}
                        height={36}
                        className="object-contain w-full h-full p-1"
                      />
                    </div>
                    <div className="bg-neutral-700/40 backdrop-blur-sm border border-neutral-600/50 pl-6 pr-4 py-1 rounded-full -ml-4 z-0 text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <span className="truncate">{baseName}</span>
                      {variantLabel && (
                        <span className="text-neutral-400 font-medium border-l border-neutral-600 pl-1.5">
                          {variantLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Trend badge */}
                {trend && trend.direction !== "stable" && (
                  <span
                    className={`text-sm font-semibold ${trend.direction === "up"
                      ? "text-green-400"
                      : "text-red-400"
                      }`}
                  >
                    {trend.direction === "up" ? "↑" : "↓"}
                    {trend.value}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ---- STATS TILES (4 Quadrants) ---- */}
          <div className="bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl mt-2 overflow-hidden">
            {/* Top Row: Elo & Rank */}
            <div className="grid grid-cols-2 divide-x divide-neutral-700/50 py-2.5">
              <div className="flex items-baseline justify-center gap-2">
                <span className={`text-2xl font-black ${currentRank === 1 ? 'text-yellow-400' : currentRank === 2 ? 'text-slate-300' : currentRank === 3 ? 'text-orange-500' : 'text-neutral-100'}`}>
                  {Math.round(competitor.conservativeScore ?? competitor.rating)}
                </span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Elo</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className={`text-2xl font-black ${currentRank === 1 ? 'text-yellow-400' : currentRank === 2 ? 'text-slate-300' : currentRank === 3 ? 'text-orange-500' : 'text-neutral-100'}`}>
                  {currentRank > 0 ? formatRankFR(currentRank) : "--"}
                </span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Rang</span>
              </div>
            </div>

            {/* Horizontal Divider */}
            <div className="h-px bg-neutral-700/50 w-full" />

            {/* Bottom Row: Races & Wins */}
            <div className="grid grid-cols-2 divide-x divide-neutral-700/50 py-2.5">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl font-black text-neutral-100">{totalRaces}</span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Courses</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl font-black text-neutral-100">{wins}</span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Victoires</span>
              </div>
            </div>
          </div>

          {/* ---- FORME RECENTE ---- */}
          {positions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">
                Forme récente
              </h3>

              <div className="bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl p-4 flex justify-between items-center w-full">
                {positions.slice(0, 5).map((pos, i) => {
                  const isPodium = pos <= 3;
                  const illustration = isPodium
                    ? `/illustrations/${pos === 1 ? 'gold' : pos === 2 ? 'silver' : 'bronze'}-medal.png`
                    : '/illustrations/flag.webp';

                  return (
                    <div key={i} className="relative flex flex-col items-center group">
                      <div className="relative w-12 h-12 transition-transform duration-200 group-hover:scale-110">
                        <Image
                          src={illustration}
                          alt={`Position ${pos}`}
                          fill
                          className="object-contain"
                        />
                        {!isPodium && (
                          <div className="absolute inset-0 flex items-center justify-center pt-1">
                            <span className="text-white font-black text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                              {pos}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 mt-1 uppercase">
                        {pos === 1 ? '1er' : `${pos}e`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- STATS FUN ---- */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">
              Stats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Win streak */}
              {(competitor.winStreak ?? 0) > 0 && (
                <StatCard
                  icon="🔥"
                  title="Série en cours"
                  value={`${competitor.winStreak} victoire${(competitor.winStreak ?? 0) > 1 ? "s" : ""
                    } d'affilée${(competitor.bestWinStreak ?? 0) > 0 ? ` (record : ${competitor.bestWinStreak}v)` : ""}`}
                />
              )}

              {/* Play streak */}
              {(competitor.playStreak ?? 0) > 0 && (
                <StatCard
                  icon="📆"
                  title="Streak de jeu"
                  value={`${competitor.playStreak}j consécutifs (record : ${competitor.bestPlayStreak}j)`}
                />
              )}

              {/* Rival — expandable */}
              {rivalData && (
                <details className="group col-span-1 sm:col-span-2">
                  <summary className="flex items-start gap-3 bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl p-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-lg">💀</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">Pire ennemi</p>
                      <p className="text-sm text-neutral-100 font-bold truncate">
                        {rivalData.worst.name} (bat {rivalData.worst.losses}/{rivalData.worst.shared}x)
                      </p>
                    </div>
                    <MdChevronRight className="text-neutral-500 text-xl mt-1 transition-transform group-open:rotate-90" />
                  </summary>

                  <div className="mt-2 p-4 bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl space-y-3 shadow-inner">
                    <p className="text-xs text-neutral-400">
                      Le compétiteur qui te bat le plus souvent (min. 3 courses communes).
                      Basé sur le ratio victoires/courses partagées.
                    </p>

                    <div className="space-y-1.5">
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        Classement des rivaux
                      </p>
                      {rivalData.all.map((r, i) => {
                        const pct = Math.round(r.ratio * 100);
                        return (
                          <div key={r.id} className="flex items-center gap-2 text-sm">
                            <span className="text-neutral-500 w-5 text-right shrink-0">
                              {i + 1}.
                            </span>
                            {i === 0 && <span className="shrink-0">💀</span>}
                            <span className={`truncate ${i === 0 ? "text-neutral-100 font-semibold" : "text-neutral-300"}`} style={{ minWidth: 0, flex: "1 1 0" }}>
                              {r.name}
                            </span>
                            <span className="text-neutral-400 shrink-0 w-10 text-right tabular-nums">
                              {r.losses}/{r.shared}
                            </span>
                            <span className="text-neutral-500 shrink-0 w-10 text-right tabular-nums">
                              {pct}%
                            </span>
                            <div className="w-16 h-2 bg-neutral-700 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              )}

              {/* Best score (all-time record) */}
              {bestScore != null && (
                <StatCard
                  icon="🎯"
                  title="Record"
                  value={`${bestScore} pts`}
                />
              )}

              {/* Consistency */}
              {positions.length >= 3 && (
                <StatCard
                  icon="📊"
                  title="Régularité"
                  value={consistencyLabel(positions)}
                  subtitle={`Positions : ${formatPositions(positions)}`}
                />
              )}

              {/* Podiums */}
              {positions.length > 0 && (
                <StatCard
                  icon="🏆"
                  title="Podiums"
                  value={`${podiumCount} top-3 sur ${positions.length} courses`}
                />
              )}

              {/* Activity this month */}
              {competitor.currentMonthRaceCount != null && (
                <StatCard
                  icon="📅"
                  title="Activité ce mois"
                  value={`${competitor.currentMonthRaceCount} course${competitor.currentMonthRaceCount > 1 ? "s" : ""
                    }`}
                />
              )}
            </div>
          </div>

          {/* ---- RESULTATS RECENTS ---- */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-[0.2em] text-center">
              Résultats récents
            </h3>
            {recentRaces.length === 0 ? (
              <div className="bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl p-6 text-center">
                <p className="text-neutral-500 text-sm">Aucune course récente</p>
              </div>
            ) : (
              <div className="bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl overflow-hidden divide-y divide-neutral-700/30">
                {recentRaces.map((race) => {
                  const isPodium = race.rank12 <= 3;
                  const illustration = isPodium
                    ? `/illustrations/${race.rank12 === 1 ? 'gold' : race.rank12 === 2 ? 'silver' : 'bronze'}-medal.png`
                    : '/illustrations/flag.webp';

                  return (
                    <div
                      key={race.raceId}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-white/5"
                    >
                      <span className="text-[10px] font-bold text-neutral-500 w-16 shrink-0 uppercase tracking-tighter">
                        {formatRelativeDate(race.date)}
                      </span>

                      <div className="relative w-9 h-9 shrink-0">
                        <Image
                          src={illustration}
                          alt={`Position ${race.rank12}`}
                          fill
                          className="object-contain"
                        />
                        {!isPodium && (
                          <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                            <span className="text-white font-black text-xs drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                              {race.rank12}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="h-1.5 bg-neutral-800/80 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-primary-600/60 to-primary-400/60 rounded-full"
                            style={{
                              width: `${(race.score / maxScore) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="text-xs font-black text-neutral-200 w-12 text-right shrink-0">
                        {race.score}<span className="text-[8px] ml-0.5 text-neutral-500">PT</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ---- GLICKO-2 COLLAPSIBLE ---- */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-bold text-neutral-500 uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center gap-2 list-none">
              <MdChevronRight className="transition-transform group-open:rotate-90 text-lg" />
              Stats détaillées (Glicko-2)
            </summary>
            <div className="mt-3 p-4 bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Rating</span>
                <span className="text-neutral-200 font-medium">
                  {competitor.rating.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">RD (incertitude)</span>
                <span className="text-neutral-200 font-medium">
                  {competitor.rd.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Volatilité</span>
                <span className="text-neutral-200 font-medium">
                  {competitor.vol.toFixed(3)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 pt-1 border-t border-neutral-700">
                {competitor.rd > 100
                  ? "Niveau encore incertain — plus de courses nécessaires."
                  : competitor.rd > 50
                    ? "Niveau se stabilise."
                    : "Niveau très fiable."}
              </p>
            </div>
          </details>
        </div>
      )}

    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/*  StatCard sub-component                                             */
/* ------------------------------------------------------------------ */

const StatCard: FC<{ icon: string; title: string; value: string; subtitle?: string }> = ({
  icon,
  title,
  value,
  subtitle,
}) => (
  <div className="bg-neutral-900/40 border-2 border-neutral-700 rounded-2xl p-3 flex items-start gap-3">
    <span className="text-xl mt-0.5">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-neutral-500 uppercase">{title}</p>
      <p className="text-sm font-bold text-neutral-100 leading-snug">{value}</p>
      {subtitle && <p className="text-[10px] text-neutral-500 mt-0.5 italic">{subtitle}</p>}
    </div>
  </div>
);

export default CompetitorDetailModal;
