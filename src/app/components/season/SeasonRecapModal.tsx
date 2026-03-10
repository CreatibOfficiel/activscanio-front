"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import CountUp from "react-countup";
import Badge from "@/app/components/ui/Badge";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { Button } from "@/app/components/ui";
import { getLeagueForRank } from "@/app/utils/leagues";
import {
  SeasonsRepository,
  type SeasonArchive,
  type ArchivedCompetitorRanking,
  type ArchivedBettorRanking,
  type SeasonHighlights,
} from "@/app/repositories/SeasonsRepository";
import { formatSeasonDateRange } from "@/app/utils/season-utils";
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdEmojiEvents,
  MdStar,
  MdTrendingUp,
  MdSportsScore,
  MdPerson,
  MdFlag,
  MdAutorenew,
} from "react-icons/md";

interface SeasonRecapModalProps {
  year: number;
  month: number;
  onClose: () => void;
}

const TOTAL_SLIDES = 7;

function getRankBadgeVariant(
  rank: number | null
): "gold" | "silver" | "bronze" | "default" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}

// ─── Progress Bar (Instagram Stories pattern) ────────

function ProgressBar({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex gap-1 flex-1 min-w-0" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: i < current ? "100%" : i === current ? "100%" : "0%" }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton Loading ────────────────────────────────

function SlidesSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
      <div className="w-16 h-16 rounded-full bg-neutral-700/50 animate-shimmer" />
      <div className="w-48 h-8 rounded-lg bg-neutral-700/50 animate-shimmer" />
      <div className="w-32 h-4 rounded bg-neutral-700/50 animate-shimmer" />
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-neutral-700/50 animate-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Slide components ────────────────────────────────

function SlideTitleStats({
  season,
  reducedMotion,
}: {
  season: SeasonArchive;
  reducedMotion: boolean;
}) {
  const motionProps = (delay: number) =>
    reducedMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4 } };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: -20 }}
        animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
        transition={reducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 200, damping: 12 }}
        className="text-6xl"
      >
        🏆
      </motion.div>

      <motion.h2
        {...motionProps(0.2)}
        className="text-title text-white text-center"
      >
        Saison {season.seasonNumber}
      </motion.h2>

      <motion.p
        {...motionProps(0.35)}
        className="text-regular text-neutral-400 text-center"
      >
        {formatSeasonDateRange(season.seasonNumber)}
      </motion.p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
        {[
          { label: "Pilotes", value: season.totalCompetitors, icon: <MdFlag className="text-primary-400" /> },
          { label: "Courses", value: season.totalRaces, icon: <MdSportsScore className="text-emerald-400" /> },
          { label: "Paris", value: season.totalBets, icon: <MdStar className="text-yellow-400" /> },
          { label: "Parieurs", value: season.totalBettors, icon: <MdPerson className="text-blue-400" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            {...motionProps(0.45 + i * 0.08)}
            className="bg-neutral-800 rounded-xl p-3 text-center border border-neutral-700"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {stat.icon}
              <span className="text-sub text-neutral-400">{stat.label}</span>
            </div>
            <div className="text-statistic text-white">
              {reducedMotion ? stat.value : <CountUp end={stat.value} duration={1.5} separator=" " />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PodiumSlide({
  title,
  items,
  type,
  reducedMotion,
}: {
  title: string;
  items: {
    name: string;
    rank: number;
    score: number;
    scoreLabel: string;
    races?: number;
    winStreak?: number;
    imageUrl?: string | null;
    characterUrl?: string | null;
  }[];
  type: "competitor" | "bettor";
  reducedMotion: boolean;
}) {
  // Reorder: 2nd, 1st, 3rd
  const podiumOrder = [
    items.find((c) => c.rank === 2),
    items.find((c) => c.rank === 1),
    items.find((c) => c.rank === 3),
  ].filter(Boolean) as typeof items;

  const colHeights = ["h-[88px]", "h-[120px]", "h-[72px]"];
  const delays = [0.3, 0.15, 0.45];
  const borderColors = ["border-gray-300/40", "border-yellow-500/50", "border-amber-600/40"];
  const glows = ["", "shadow-[0_0_24px_rgba(235,170,30,0.15)]", ""];
  const avatarBorders = ["border-gray-300", "border-yellow-500", "border-amber-600"];
  const charSizes = ["w-5 h-5", "w-6 h-6", "w-5 h-5"];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-3">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-heading text-white text-center"
      >
        {title}
      </motion.h2>

      <div className="flex items-end justify-center gap-3 w-full max-w-xs mt-1">
        {podiumOrder.map((item, i) => {
          return (
            <motion.div
              key={item.name}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 50, scaleY: 0.4 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scaleY: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.15 }
                  : { delay: delays[i], type: "spring", stiffness: 150, damping: 14 }
              }
              className="flex-1 flex flex-col items-center min-w-0"
              style={{ transformOrigin: "bottom" }}
            >
              {/* Avatar + Character overlay */}
              <div className="relative mb-1.5">
                <UserAvatar
                  src={item.imageUrl}
                  name={item.name}
                  size={i === 1 ? "lg" : "md"}
                  className={`border-2 ${avatarBorders[i]}`}
                />
                {item.characterUrl && (
                  <img
                    src={item.characterUrl}
                    alt=""
                    className={`absolute -bottom-1 -right-1 ${charSizes[i]} object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
                  />
                )}
              </div>

              {/* Badge */}
              <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="mb-1">
                #{item.rank}
              </Badge>

              {/* Name */}
              <p className="font-semibold text-white text-center truncate w-full text-xs leading-tight">
                {item.name}
              </p>

              {/* Podium column with stats inside */}
              <div
                className={`w-full ${colHeights[i]} rounded-t-xl bg-gradient-to-t from-neutral-800 to-neutral-700 border border-b-0 ${borderColors[i]} ${glows[i]} flex flex-col items-center justify-center gap-0.5 mt-1`}
              >
                <p className="text-lg font-bold text-white leading-tight">
                  {Math.round(item.score)}
                </p>
                <p className="text-[10px] text-neutral-400">{item.scoreLabel}</p>
                {item.races !== undefined && (
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {item.races} {type === "competitor" ? `course${item.races > 1 ? "s" : ""}` : `pari${item.races > 1 ? "s" : ""}`}
                  </p>
                )}
                {(item.winStreak ?? 0) > 0 && (
                  <p className="text-[10px] text-yellow-400/80">
                    {item.winStreak} 🔥 d&apos;affilée
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RankingListSlide({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden px-3">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-heading text-white text-center mb-3 shrink-0"
      >
        {title}
      </motion.h2>
      <div className="overflow-y-auto flex-1 min-h-0 space-y-1.5 pb-4 overscroll-contain">
        {children}
      </div>
    </div>
  );
}

function CompetitorRow({
  item,
  index,
  reducedMotion,
}: {
  item: ArchivedCompetitorRanking;
  index: number;
  reducedMotion: boolean;
}) {
  const league = item.rank ? getLeagueForRank(item.rank) : null;

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.5), duration: 0.3 }}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-neutral-800 rounded-lg border border-neutral-700/50"
    >
      {/* Rank badge */}
      <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="shrink-0">
        {item.provisional ? "~" : `#${item.rank}`}
      </Badge>

      {/* Avatar */}
      <UserAvatar src={item.profilePictureUrl} name={item.competitorName} size="sm" />

      {/* Name + stats */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white truncate">{item.competitorName}</p>
          {league && <span className="text-xs shrink-0">{league.emoji}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span>{item.totalRaces} course{item.totalRaces > 1 ? "s" : ""}</span>
          {item.winStreak > 0 && (
            <>
              <span className="text-neutral-600">·</span>
              <span className="text-yellow-400/80">{item.winStreak} victoire{item.winStreak > 1 ? "s" : ""} d&apos;affilée 🔥</span>
            </>
          )}
        </div>
      </div>

      {/* ELO (conservative score = rating - 2*RD) */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary-500">{Math.round(item.finalRating - 2 * item.finalRd)}</p>
        <p className="text-[10px] text-neutral-500">ELO</p>
      </div>
    </motion.div>
  );
}

function BettorRow({
  item,
  index,
  reducedMotion,
}: {
  item: ArchivedBettorRanking;
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.5), duration: 0.3 }}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-neutral-800 rounded-lg border border-neutral-700/50"
    >
      {/* Rank badge */}
      <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="shrink-0">
        #{item.rank}
      </Badge>

      {/* Avatar */}
      <UserAvatar src={item.profilePictureUrl} name={item.userName} size="sm" />

      {/* Name + paris count */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{item.userName}</p>
        <p className="text-xs text-neutral-400">
          {item.betsPlaced} pari{item.betsPlaced > 1 ? "s" : ""}
        </p>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary-500">{item.totalPoints.toFixed(1)}</p>
        <p className="text-[10px] text-neutral-500">pts</p>
      </div>
    </motion.div>
  );
}

function HighlightCard({
  icon,
  title,
  children,
  delay,
  glowClass,
  reducedMotion,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay: number;
  glowClass?: string;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : { delay, type: "spring", stiffness: 200, damping: 18 }
      }
      className={`bg-neutral-800 rounded-xl p-4 border border-neutral-700 ${glowClass ?? ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-bold text-neutral-300">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function formatEstimatedTime(totalRaces: number): string {
  const totalMinutes = Math.round(totalRaces * 2.5);
  if (totalMinutes < 60) return `~${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `~${hours}h ${String(mins).padStart(2, '0')}min` : `~${hours}h`;
}

function SlideHighlights({
  highlights,
  season,
  reducedMotion,
}: {
  highlights: SeasonHighlights;
  season: SeasonArchive;
  reducedMotion: boolean;
}) {
  const hasContent =
    highlights.perfectScores.length > 0 ||
    highlights.perfectPodiums.length > 0 ||
    highlights.highestBetScore ||
    highlights.biggestUpset ||
    highlights.longestParticipationStreak ||
    highlights.longestWinStreak ||
    highlights.mostRaces ||
    (highlights.bestRaceScorers && highlights.bestRaceScorers.length > 0) ||
    season.totalRaces > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-6xl mb-4">🔮</p>
          <h2 className="text-heading text-white mb-2">Moments Forts</h2>
          <p className="text-regular text-neutral-400">
            Pas encore de highlights pour cette saison.
          </p>
        </motion.div>
      </div>
    );
  }

  let delayIdx = 0;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden px-4">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-heading text-white text-center mb-4 shrink-0"
      >
        Moments Forts
      </motion.h2>

      <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pb-4 overscroll-contain">
        {/* Perfect Scores (60 pts) */}
        {highlights.perfectScores.length > 0 && (
          <HighlightCard
            icon={<span className="text-xl">💯</span>}
            title={`Score${highlights.perfectScores.length > 1 ? 's' : ''} Parfait${highlights.perfectScores.length > 1 ? 's' : ''} (60 pts)`}
            delay={(delayIdx++) * 0.1 + 0.1}
            glowClass="animate-glow"
            reducedMotion={reducedMotion}
          >
            <div className="space-y-1.5">
              {highlights.perfectScores.map((ps, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-linear-to-r from-gold-500/15 to-transparent rounded-lg px-3 py-2 border-l-2 border-gold-500"
                >
                  <span className="text-bold text-yellow-300">{ps.userName}</span>
                  <span className="text-sub text-neutral-400">
                    Semaine {ps.week} — {ps.points} pts
                  </span>
                </div>
              ))}
            </div>
          </HighlightCard>
        )}

        {/* Perfect Podiums */}
        {highlights.perfectPodiums.length > 0 && (() => {
          const grouped = new Map<string, { userName: string; weeks: number[]; count: number }>();
          for (const pp of highlights.perfectPodiums) {
            const existing = grouped.get(pp.userName);
            if (existing) {
              existing.weeks.push(pp.week);
              existing.count++;
            } else {
              grouped.set(pp.userName, { userName: pp.userName, weeks: [pp.week], count: 1 });
            }
          }
          const entries = Array.from(grouped.values());
          return (
            <HighlightCard
              icon={<MdEmojiEvents className="text-xl text-yellow-400" />}
              title={`Podium${highlights.perfectPodiums.length > 1 ? 's' : ''} Parfait${highlights.perfectPodiums.length > 1 ? 's' : ''}`}
              delay={(delayIdx++) * 0.1 + 0.1}
              reducedMotion={reducedMotion}
            >
              <p className="text-regular text-neutral-300 mb-2">
                {highlights.perfectPodiums.length} podium
                {highlights.perfectPodiums.length > 1 ? "s" : ""} parfait
                {highlights.perfectPodiums.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {entries.map((entry, i) => (
                  <span
                    key={i}
                    className="bg-neutral-700 text-sub text-white px-2.5 py-1 rounded-full border border-neutral-600"
                  >
                    {entry.count > 1
                      ? `${entry.userName} ×${entry.count}`
                      : `${entry.userName} (S${entry.weeks[0]})`}
                  </span>
                ))}
              </div>
            </HighlightCard>
          );
        })()}

        {/* Highest Bet Score */}
        {highlights.highestBetScore && (
          <HighlightCard
            icon={<MdTrendingUp className="text-xl text-emerald-400" />}
            title="Plus gros score"
            delay={(delayIdx++) * 0.1 + 0.1}
            reducedMotion={reducedMotion}
          >
            <div className="flex items-center justify-between">
              <span className="text-bold text-white">
                {highlights.highestBetScore.userName}
              </span>
              <div className="text-right">
                <span className="text-statistic text-emerald-400">
                  {highlights.highestBetScore.points} pts
                </span>
                <p className="text-sub text-neutral-500">
                  Semaine {highlights.highestBetScore.week}
                </p>
              </div>
            </div>
          </HighlightCard>
        )}

        {/* Biggest Upset */}
        {highlights.biggestUpset && (
          <HighlightCard
            icon={<span className="text-xl">🎲</span>}
            title="Plus gros upset"
            delay={(delayIdx++) * 0.1 + 0.1}
            reducedMotion={reducedMotion}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-bold text-white">
                  {highlights.biggestUpset.userName}
                </span>
                <span className="text-statistic text-orange-400">
                  x{highlights.biggestUpset.odd.toFixed(1)}
                </span>
              </div>
              <p className="text-sub text-neutral-400">
                A misé correctement sur{" "}
                <span className="text-neutral-200">
                  {highlights.biggestUpset.competitorName}
                </span>{" "}
                (Semaine {highlights.biggestUpset.week})
              </p>
            </div>
          </HighlightCard>
        )}

        {/* Best Race Scorers (Perfect 60 pts races) */}
        {highlights.bestRaceScorers && highlights.bestRaceScorers.length > 0 && (
          <HighlightCard
            icon={<span className="text-xl">🏎️</span>}
            title="Courses Parfaites (60 pts)"
            delay={(delayIdx++) * 0.1 + 0.1}
            glowClass="animate-glow"
            reducedMotion={reducedMotion}
          >
            <div className="space-y-1.5">
              {highlights.bestRaceScorers.map((scorer, i) => (
                <div key={i} className="flex items-center justify-between bg-neutral-700/30 rounded-lg px-3 py-2">
                  <span className="text-bold text-white">{scorer.competitorName}</span>
                  <span className="text-sub text-neutral-400">
                    {scorer.perfectCount} fois
                  </span>
                </div>
              ))}
            </div>
          </HighlightCard>
        )}

        {/* Streaks */}
        {(highlights.longestParticipationStreak ||
          highlights.longestWinStreak ||
          highlights.mostRaces ||
          season.totalRaces > 0) && (
          <HighlightCard
            icon={<span className="text-xl">🔥</span>}
            title="Séries & Records"
            delay={(delayIdx++) * 0.1 + 0.1}
            reducedMotion={reducedMotion}
          >
            <div className="space-y-2.5">
              {highlights.longestParticipationStreak && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sub text-neutral-400">Participations consécutives</span>
                  <span className="text-bold text-white shrink-0">
                    {highlights.longestParticipationStreak.userName} —{" "}
                    <span className="text-primary-400">
                      {highlights.longestParticipationStreak.streak} sem.
                    </span>
                  </span>
                </div>
              )}
              {highlights.longestWinStreak && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sub text-neutral-400">Victoires consécutives (pilote)</span>
                  <span className="text-bold text-white shrink-0">
                    {highlights.longestWinStreak.competitorName} —{" "}
                    <span className="text-yellow-400">
                      {highlights.longestWinStreak.streak}🔥
                    </span>
                  </span>
                </div>
              )}
              {highlights.mostRaces && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sub text-neutral-400">Plus de courses</span>
                  <span className="text-bold text-white shrink-0">
                    {highlights.mostRaces.competitorName} —{" "}
                    <span className="text-blue-400">{highlights.mostRaces.count}</span>
                  </span>
                </div>
              )}
              {season.totalRaces > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sub text-neutral-400">Temps de jeu estimé</span>
                  <span className="text-bold text-emerald-400 shrink-0">
                    {formatEstimatedTime(season.totalRaces)}
                  </span>
                </div>
              )}
            </div>
          </HighlightCard>
        )}
      </div>
    </div>
  );
}

// ─── Slide ELO Reset ─────────────────────────────────

function SlideEloReset({
  competitors,
  reducedMotion,
}: {
  competitors: ArchivedCompetitorRanking[];
  reducedMotion: boolean;
}) {
  const [phase, setPhase] = useState(0);

  const resetData = useMemo(
    () =>
      competitors
        .filter((c) => !c.provisional && c.totalRaces > 0)
        .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
        .slice(0, 8)
        .map((c) => {
          const oldRating = Math.round(c.finalRating);
          const newRating = Math.round(0.75 * c.finalRating + 0.25 * 1500);
          return {
            name: c.competitorName,
            imageUrl: c.profilePictureUrl,
            characterUrl: c.characterImageUrl,
            oldRating,
            newRating,
            delta: newRating - oldRating,
          };
        }),
    [competitors]
  );

  useEffect(() => {
    if (reducedMotion) {
      setPhase(3);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion]);

  return (
    <div className="flex flex-col h-full px-4">
      {/* Header */}
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.4 }}
        className="text-center mb-4 shrink-0"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <MdAutorenew className="text-xl text-primary-400" />
          <h2 className="text-heading text-white">Reset ELO</h2>
        </div>
        <p className="text-sub text-neutral-400 leading-snug">
          Les ELO sont rapprochés de 1500
          <br />
          pour relancer la compétition.
        </p>
      </motion.div>

      {/* Rows */}
      <div className="overflow-y-auto flex-1 space-y-1.5 pb-2 overscroll-contain">
        {resetData.map((item, i) => (
          <motion.div
            key={item.name}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: reducedMotion ? 0 : Math.min(i * 0.06, 0.5),
              duration: reducedMotion ? 0 : 0.35,
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-neutral-800 rounded-lg border border-neutral-700/50"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <UserAvatar src={item.imageUrl} name={item.name} size="sm" />
              {item.characterUrl && (
                <img
                  src={item.characterUrl}
                  alt=""
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                />
              )}
            </div>

            {/* Name */}
            <p className="text-sm font-semibold text-white truncate min-w-0 flex-1">
              {item.name}
            </p>

            {/* ELO value */}
            <div className="text-right shrink-0 flex items-center gap-2">
              <span className="text-sm font-bold text-primary-500 tabular-nums">
                {phase >= 1 && !reducedMotion ? (
                  <CountUp
                    start={item.oldRating}
                    end={item.newRating}
                    duration={1.2}
                    separator=" "
                  />
                ) : reducedMotion ? (
                  item.newRating
                ) : (
                  item.oldRating
                )}
              </span>

              {/* Delta badge */}
              {phase >= 3 && (
                <motion.span
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 300, damping: 15 }
                  }
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    item.delta < 0
                      ? "bg-error-500/10 text-error-400"
                      : item.delta > 0
                        ? "bg-success-500/10 text-success-400"
                        : "bg-neutral-700 text-neutral-400"
                  }`}
                >
                  {item.delta > 0 ? "▲" : item.delta < 0 ? "▼" : "="}{" "}
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </motion.span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Formula */}
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 1, duration: 0.5 }}
        className="text-[11px] text-neutral-500 text-center font-mono mt-2 shrink-0"
      >
        Nouvel ELO = 75% ancien + 25% × 1500
      </motion.p>
    </div>
  );
}

// ─── Main Modal Component ────────────────────────────

export default function SeasonRecapModal({
  year,
  month,
  onClose,
}: SeasonRecapModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [season, setSeason] = useState<SeasonArchive | null>(null);
  const [competitors, setCompetitors] = useState<ArchivedCompetitorRanking[]>([]);
  const [bettors, setBettors] = useState<ArchivedBettorRanking[]>([]);
  const [highlights, setHighlights] = useState<SeasonHighlights | null>(null);
  const [direction, setDirection] = useState(0);
  const touchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const confettiFired = useRef(false);
  const scrollYRef = useRef(0);
  const reducedMotion = useReducedMotion() ?? false;

  // Wrap onClose to ensure scroll lock is always cleaned up
  const handleClose = useCallback(() => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollYRef.current);
    onClose();
  }, [onClose]);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    SeasonsRepository.getSeasonRecapData(year, month)
      .then((data) => {
        if (!data) return;
        setSeason(data.season);
        setCompetitors(data.competitors);
        setBettors(data.bettors);
        setHighlights(data.highlights);
      })
      .catch((err) => {
        console.error("Failed to load season recap data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [year, month]);

  // Confetti on first slide
  useEffect(() => {
    if (!isLoading && season && !confettiFired.current && !reducedMotion) {
      confettiFired.current = true;
      const timer = setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 }, zIndex: 9999 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, season, reducedMotion]);

  // Scroll lock (iOS Safari compatible: position-fixed approach)
  useEffect(() => {
    scrollYRef.current = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollYRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev >= TOTAL_SLIDES - 1) return prev;
      setDirection(1);
      return prev + 1;
    });
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev <= 0) return prev;
      setDirection(-1);
      return prev - 1;
    });
  }, []);

  // Touch handlers — diagonal-aware swipe detection
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      // Only trigger horizontal swipe if deltaX dominates and threshold met
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  // Build podium items
  const competitorPodiumItems = useMemo(
    () =>
      competitors
        .filter((c) => c.rank !== null && c.rank <= 3)
        .map((c) => ({
          name: c.competitorName,
          rank: c.rank!,
          score: c.finalRating - 2 * c.finalRd,
          scoreLabel: "ELO",
          races: c.totalRaces,
          winStreak: c.winStreak,
          imageUrl: c.profilePictureUrl,
          characterUrl: c.characterImageUrl,
        })),
    [competitors]
  );

  const bettorPodiumItems = useMemo(
    () =>
      bettors
        .filter((b) => b.rank <= 3)
        .map((b) => ({
          name: b.userName,
          rank: b.rank,
          score: b.totalPoints,
          scoreLabel: "pts",
          races: b.betsPlaced,
          imageUrl: b.profilePictureUrl,
        })),
    [bettors]
  );

  const slideVariants = reducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: number) => ({ x: dir >= 0 ? 250 : -250, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir >= 0 ? -250 : 250, opacity: 0 }),
      };

  const renderSlide = () => {
    if (!season || !highlights) return null;

    switch (currentSlide) {
      case 0:
        return <SlideTitleStats season={season} reducedMotion={reducedMotion} />;
      case 1:
        return <PodiumSlide title="Ligue des Champions" items={competitorPodiumItems} type="competitor" reducedMotion={reducedMotion} />;
      case 2: {
        const activeCompetitors = competitors.filter((c) => c.totalRaces > 0);
        const confirmed = activeCompetitors.filter((c) => !c.provisional);
        const provisional = activeCompetitors.filter((c) => c.provisional);
        return (
          <RankingListSlide title="Classement Pilotes">
            {confirmed.map((c, i) => (
              <CompetitorRow key={c.id} item={c} index={i} reducedMotion={reducedMotion} />
            ))}
            {provisional.length > 0 && (
              <>
                <p className="text-xs text-neutral-500 uppercase tracking-wider pt-2 pb-1 px-1">
                  Non classés
                </p>
                {provisional.map((c, i) => (
                  <CompetitorRow key={c.id} item={c} index={confirmed.length + i} reducedMotion={reducedMotion} />
                ))}
              </>
            )}
          </RankingListSlide>
        );
      }
      case 3:
        return <PodiumSlide title="Podium Parieurs" items={bettorPodiumItems} type="bettor" reducedMotion={reducedMotion} />;
      case 4:
        return (
          <RankingListSlide title="Classement Parieurs">
            {bettors.map((b, i) => (
              <BettorRow key={b.userId} item={b} index={i} reducedMotion={reducedMotion} />
            ))}
          </RankingListSlide>
        );
      case 5:
        return <SlideHighlights highlights={highlights} season={season} reducedMotion={reducedMotion} />;
      case 6:
        return <SlideEloReset competitors={competitors} reducedMotion={reducedMotion} />;
      default:
        return null;
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Récap de saison ${month} — ${year}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={handleClose} />

      {/* Modal container — glassmorphism matching design system */}
      <div
        className="relative w-full max-w-md h-[85vh] max-h-[700px] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-slideUp"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)" }}
      >
        {/* Header: progress bar + close button aligned */}
        <div className="shrink-0 flex items-center gap-2 px-4 pt-3">
          {!isLoading ? (
            <ProgressBar total={TOTAL_SLIDES} current={currentSlide} />
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={handleClose}
            className="shrink-0 p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/80 hover:border-neutral-600 transition-all duration-200"
            aria-label="Fermer le récap"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Content area */}
        <div
          className="flex-1 min-h-0 flex flex-col overflow-hidden py-6"
          style={{ touchAction: "pan-y" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {isLoading ? (
            <SlidesSkeleton />
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reducedMotion ? 0.15 : 0.3, ease: "easeOut" }}
                className="h-full min-h-0 flex flex-col overflow-hidden"
              >
                {renderSlide()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Navigation — using Button component */}
        {!isLoading && (
          <div className="shrink-0 px-4 pb-4 pt-2 border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              {currentSlide > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goPrev}
                  leftIcon={<MdChevronLeft size={18} />}
                >
                  Précédent
                </Button>
              ) : (
                <div />
              )}

              {currentSlide < TOTAL_SLIDES - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={goNext}
                  rightIcon={<MdChevronRight size={18} />}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleClose}
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
