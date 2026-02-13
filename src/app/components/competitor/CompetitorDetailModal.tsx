"use client";

import { FC, useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RecentRaceInfo } from "@/app/models/RecentRaceInfo";
import EditCompetitorButton from "./EditCompetitorButton";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";
import { formatCompetitorName, formatRelativeDate } from "@/app/utils/formatters";
import { TrendDirection } from "../leaderboard/TrendIndicator";

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

const rankBadgeVariant = (rank: number) => {
  if (rank === 1) return "gold" as const;
  if (rank === 2) return "silver" as const;
  if (rank === 3) return "bronze" as const;
  return "default" as const;
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

  const [recentRaces, setRecentRaces] = useState<RecentRaceInfo[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

  /* ---------- derived data ---------- */
  const shortName = formatCompetitorName(
    competitor.firstName,
    competitor.lastName
  );
  const variant = competitor.characterVariant;
  const baseName = variant?.baseCharacter?.name;
  const variantLabel =
    variant && variant.label !== "Default" ? variant.label : null;

  const positions = competitor.recentPositions ?? [];
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

  // Rival calculation
  const rival = useMemo(() => {
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

    let worstId: string | null = null;
    let worstRatio = 0;

    for (const [id, losses] of Object.entries(lossCount)) {
      const shared = sharedCount[id] ?? 0;
      if (shared < 3) continue;
      const ratio = losses / shared;
      if (ratio > worstRatio) {
        worstRatio = ratio;
        worstId = id;
      }
    }

    if (!worstId) return null;
    const rivalComp = allCompetitors.find((c) => c.id === worstId);
    if (!rivalComp) return null;

    return {
      name: formatCompetitorName(rivalComp.firstName, rivalComp.lastName),
      losses: lossCount[worstId],
      shared: sharedCount[worstId],
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
      {!isLoaded ? (
        <DetailSkeleton />
      ) : (
        <div className="space-y-5">
          {/* ---- HERO ---- */}
          <div
            className="bg-gradient-to-b from-neutral-800 to-neutral-900 -m-4 sm:-m-6 mb-0 p-6 pb-5 rounded-t-2xl"
          >
            {/* Close / Edit buttons */}
            <div className="flex justify-end gap-2 mb-3">
              <EditCompetitorButton competitor={competitor} />
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 transition-colors"
                aria-label="Fermer"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div
                className={`w-20 h-20 rounded-full overflow-hidden ${
                  currentRank <= 3
                    ? "ring-4 ring-offset-2 ring-offset-neutral-900"
                    : ""
                } ${
                  currentRank === 1
                    ? "ring-yellow-500"
                    : currentRank === 2
                      ? "ring-gray-400"
                      : currentRank === 3
                        ? "ring-amber-600"
                        : ""
                }`}
              >
                <Image
                  src={competitor.profilePictureUrl}
                  alt={shortName}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Name */}
              <h2 className="text-xl font-bold text-neutral-100 mt-3">
                {shortName}
              </h2>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                {/* Character badge */}
                {variant && (
                  <Badge variant="default" size="sm">
                    {baseName}
                    {variantLabel && ` – ${variantLabel}`}
                  </Badge>
                )}

                {/* Trend badge */}
                {trend && trend.direction !== "stable" && (
                  <span
                    className={`text-sm font-semibold ${
                      trend.direction === "up"
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

          {/* ---- STATS TILES ---- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[
              {
                label: "Elo",
                value: Math.round(
                  competitor.conservativeScore ?? competitor.rating
                ),
              },
              {
                label: "Rang",
                value: currentRank > 0 ? formatRankFR(currentRank) : "--",
              },
              {
                label: "Courses",
                value: totalRaces,
              },
              {
                label: "Victoires",
                value: wins,
              },
            ].map((tile, i) => (
              <div
                key={tile.label}
                className="bg-neutral-800/60 rounded-xl p-3 text-center stagger-item"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-2xl font-bold text-neutral-100">
                  {tile.value}
                </p>
                <p className="text-xs text-neutral-400 mt-1">{tile.label}</p>
              </div>
            ))}
          </div>

          {/* ---- FORME RECENTE ---- */}
          {positions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Forme récente
              </h3>
              <div className="flex gap-2">
                {positions.slice(0, 5).map((pos, i) => (
                  <Badge
                    key={i}
                    variant={rankBadgeVariant(pos)}
                    size="md"
                    className="min-w-[40px]"
                  >
                    {pos <= 3
                      ? ["🥇", "🥈", "🥉"][pos - 1]
                      : formatRankFR(pos)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                récente → ancienne
              </p>
            </div>
          )}

          {/* ---- STATS FUN ---- */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Stats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Win streak */}
              {(competitor.winStreak ?? 0) > 0 && (
                <StatCard
                  icon="🔥"
                  title="Série en cours"
                  value={`${competitor.winStreak} victoire${
                    (competitor.winStreak ?? 0) > 1 ? "s" : ""
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

              {/* Rival */}
              {rival && (
                <StatCard
                  icon="💀"
                  title="Pire ennemi"
                  value={`${rival.name} (bat ${rival.losses}/${rival.shared}x)`}
                />
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
                  value={`${competitor.currentMonthRaceCount} course${
                    competitor.currentMonthRaceCount > 1 ? "s" : ""
                  }`}
                />
              )}
            </div>
          </div>

          {/* ---- RESULTATS RECENTS ---- */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Résultats récents
            </h3>
            {recentRaces.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                Aucune course récente
              </p>
            ) : (
              <div className="space-y-2">
                {recentRaces.map((race) => (
                  <div
                    key={race.raceId}
                    className="flex items-center gap-3 bg-neutral-800/60 p-3 rounded-xl"
                  >
                    <span className="text-xs text-neutral-400 w-20 shrink-0">
                      {formatRelativeDate(race.date)}
                    </span>
                    <Badge
                      variant={rankBadgeVariant(race.rank12)}
                      size="sm"
                    >
                      {race.rank12 <= 3
                        ? ["🥇", "🥈", "🥉"][race.rank12 - 1]
                        : formatRankFR(race.rank12)}
                    </Badge>
                    <div className="flex-grow">
                      <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${(race.score / maxScore) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-neutral-200 w-12 text-right shrink-0">
                      {race.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- GLICKO-2 COLLAPSIBLE ---- */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-2">
              <span className="transition-transform group-open:rotate-90">
                ▶
              </span>
              Stats détaillées (Glicko-2)
            </summary>
            <div className="mt-3 p-4 bg-neutral-800/40 rounded-xl space-y-3">
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
  <div className="flex items-start gap-3 bg-neutral-800/40 rounded-xl p-3">
    <span className="text-lg">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-neutral-400">{title}</p>
      <p className="text-sm text-neutral-200 font-medium truncate">{value}</p>
      {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default CompetitorDetailModal;
