"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import CountUp from "react-countup";
import Badge from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui";
import { getLeagueForRank } from "@/app/utils/leagues";
import {
  SeasonsRepository,
  type SeasonArchive,
  type ArchivedCompetitorRanking,
  type ArchivedBettorRanking,
  type SeasonHighlights,
} from "@/app/repositories/SeasonsRepository";
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
} from "react-icons/md";

interface SeasonRecapModalProps {
  year: number;
  month: number;
  onClose: () => void;
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const TOTAL_SLIDES = 6;

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
    <div className="flex gap-1 px-4 pt-3" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
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
  monthName,
  reducedMotion,
}: {
  season: SeasonArchive;
  monthName: string;
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
        {monthName} {season.year}
      </motion.h2>

      <motion.p
        {...motionProps(0.35)}
        className="text-regular text-neutral-400 text-center"
      >
        Récap de saison
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
  items: { name: string; rank: number; score: number; scoreLabel: string; extra?: string }[];
  type: "competitor" | "bettor";
  reducedMotion: boolean;
}) {
  // Reorder: 2nd, 1st, 3rd
  const podiumOrder = [
    items.find((c) => c.rank === 2),
    items.find((c) => c.rank === 1),
    items.find((c) => c.rank === 3),
  ].filter(Boolean) as typeof items;

  const heights = ["h-28", "h-36", "h-24"];
  const delays = [0.3, 0.15, 0.45];
  const gradients = [
    "bg-gradient-to-t from-neutral-800 to-neutral-700 border-silver-500/40",
    "bg-gradient-to-t from-neutral-800 to-neutral-700 border-gold-500/50",
    "bg-gradient-to-t from-neutral-800 to-neutral-700 border-bronze-500/40",
  ];
  const glows = ["", "shadow-[0_0_20px_rgba(235,170,30,0.15)]", ""];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-heading text-white text-center"
      >
        {title}
      </motion.h2>

      <div className="flex items-end justify-center gap-3 w-full max-w-sm mt-4">
        {podiumOrder.map((item, i) => (
          <motion.div
            key={item.name}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 50, scaleY: 0.4 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scaleY: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : { delay: delays[i], type: "spring", stiffness: 150, damping: 14 }
            }
            className="flex-1 flex flex-col items-center"
            style={{ transformOrigin: "bottom" }}
          >
            <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="mb-2">
              #{item.rank}
            </Badge>
            <p className="text-bold text-white text-center truncate w-full mb-1">
              {item.name}
            </p>
            {type === "competitor" && item.rank && (
              <span className={`text-sub mb-2 ${getLeagueForRank(item.rank).textColor}`}>
                {getLeagueForRank(item.rank).emoji} {getLeagueForRank(item.rank).label}
              </span>
            )}
            <div
              className={`w-full ${heights[i]} rounded-t-xl ${gradients[i]} border border-b-0 flex items-center justify-center ${glows[i]}`}
            >
              <div className="text-center">
                <p className="text-statistic text-white">
                  {Math.round(item.score)}
                </p>
                <p className="text-sub text-neutral-400">{item.scoreLabel}</p>
              </div>
            </div>
            {item.extra && (
              <p className="text-sub text-neutral-500 mt-1">{item.extra}</p>
            )}
          </motion.div>
        ))}
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
    <div className="flex flex-col h-full px-4">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-heading text-white text-center mb-4 shrink-0"
      >
        {title}
      </motion.h2>
      <div className="overflow-y-auto flex-1 space-y-2 pb-4 overscroll-contain">
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
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.5), duration: 0.3 }}
      className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-neutral-700/50"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="shrink-0">
          {item.provisional ? "~" : `#${item.rank}`}
        </Badge>
        <div className="min-w-0">
          <p className="text-bold text-white truncate">{item.competitorName}</p>
          {item.provisional && (
            <p className="text-sub text-neutral-500">En calibrage</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-bold text-primary-500">{Math.round(item.finalRating)}</p>
          <p className="text-sub text-neutral-500">ELO</p>
        </div>
        <div>
          <p className="text-regular text-neutral-300">{item.raceCount}</p>
          <p className="text-sub text-neutral-500">courses</p>
        </div>
        {item.winStreak > 0 && (
          <div>
            <p className="text-regular text-yellow-400">{item.winStreak}🔥</p>
            <p className="text-sub text-neutral-500">streak</p>
          </div>
        )}
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
      className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-neutral-700/50"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="shrink-0">
          #{item.rank}
        </Badge>
        <p className="text-bold text-white truncate">{item.userName}</p>
      </div>
      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-bold text-primary-500">{item.totalPoints.toFixed(1)}</p>
          <p className="text-sub text-neutral-500">pts</p>
        </div>
        <div>
          <p className="text-regular text-neutral-300">{item.betsPlaced}</p>
          <p className="text-sub text-neutral-500">paris</p>
        </div>
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

function SlideHighlights({
  highlights,
  reducedMotion,
}: {
  highlights: SeasonHighlights;
  reducedMotion: boolean;
}) {
  const hasContent =
    highlights.perfectScores.length > 0 ||
    highlights.perfectPodiums.length > 0 ||
    highlights.highestBetScore ||
    highlights.biggestUpset ||
    highlights.longestParticipationStreak ||
    highlights.longestWinStreak ||
    highlights.mostRaces;

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
    <div className="flex flex-col h-full px-4">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-heading text-white text-center mb-4 shrink-0"
      >
        Moments Forts
      </motion.h2>

      <div className="overflow-y-auto flex-1 space-y-3 pb-4 overscroll-contain">
        {/* Perfect Scores (60 pts) */}
        {highlights.perfectScores.length > 0 && (
          <HighlightCard
            icon={<span className="text-xl">💯</span>}
            title="Scores Parfaits (60 pts)"
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
        {highlights.perfectPodiums.length > 0 && (
          <HighlightCard
            icon={<MdEmojiEvents className="text-xl text-yellow-400" />}
            title="Podiums Parfaits"
            delay={(delayIdx++) * 0.1 + 0.1}
            reducedMotion={reducedMotion}
          >
            <p className="text-regular text-neutral-300 mb-2">
              {highlights.perfectPodiums.length} podium
              {highlights.perfectPodiums.length > 1 ? "s" : ""} parfait
              {highlights.perfectPodiums.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {highlights.perfectPodiums.map((pp, i) => (
                <span
                  key={i}
                  className="bg-neutral-700 text-sub text-white px-2.5 py-1 rounded-full border border-neutral-600"
                >
                  {pp.userName} (S{pp.week})
                </span>
              ))}
            </div>
          </HighlightCard>
        )}

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

        {/* Streaks */}
        {(highlights.longestParticipationStreak ||
          highlights.longestWinStreak ||
          highlights.mostRaces) && (
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
                  <span className="text-sub text-neutral-400">Win streak pilote</span>
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
            </div>
          </HighlightCard>
        )}
      </div>
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

  const monthName = MONTH_NAMES[month - 1] ?? "";

  // Load data
  useEffect(() => {
    setIsLoading(true);
    SeasonsRepository.getSeasonRecapData(year, month)
      .then((data) => {
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
      if (e.key === "Escape") onClose();
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
          score: c.finalRating,
          scoreLabel: "ELO",
          extra: `${c.raceCount} courses`,
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
          extra: `${b.betsPlaced} paris`,
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
        return <SlideTitleStats season={season} monthName={monthName} reducedMotion={reducedMotion} />;
      case 1:
        return <PodiumSlide title="Podium Pilotes" items={competitorPodiumItems} type="competitor" reducedMotion={reducedMotion} />;
      case 2:
        return (
          <RankingListSlide title="Classement Pilotes">
            {competitors.map((c, i) => (
              <CompetitorRow key={c.id} item={c} index={i} reducedMotion={reducedMotion} />
            ))}
          </RankingListSlide>
        );
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
        return <SlideHighlights highlights={highlights} reducedMotion={reducedMotion} />;
      default:
        return null;
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Récap de saison ${monthName} ${year}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={onClose} />

      {/* Modal container — glassmorphism matching design system */}
      <div
        className="relative w-full max-w-md max-h-[90vh] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-slideUp"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)" }}
      >
        {/* Progress bar */}
        {!isLoading && <ProgressBar total={TOTAL_SLIDES} current={currentSlide} />}

        {/* Close button — matching design system pattern */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/80 hover:border-neutral-600 transition-all duration-200"
          aria-label="Fermer le récap"
        >
          <MdClose size={18} />
        </button>

        {/* Content area */}
        <div
          className="flex-1 min-h-0 py-6 overflow-hidden"
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
                className="h-full"
              >
                {renderSlide()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Navigation — using Button component */}
        {!isLoading && (
          <div className="shrink-0 px-4 pb-4 pt-2 border-t border-neutral-700/50">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                disabled={currentSlide === 0}
                leftIcon={<MdChevronLeft size={18} />}
              >
                Précédent
              </Button>

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
                  onClick={onClose}
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
