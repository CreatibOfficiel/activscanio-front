"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import CountUp from "react-countup";
import Badge from "@/app/components/ui/Badge";
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
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
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

// ─── Slide components ────────────────────────────────

function SlideTitleStats({
  season,
  monthName,
}: {
  season: SeasonArchive;
  monthName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="text-6xl"
      >
        🏆
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl font-bold text-white text-center"
      >
        {monthName} {season.year}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-neutral-400 text-center"
      >
        Récap de saison
      </motion.p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
        {[
          {
            label: "Pilotes",
            value: season.totalCompetitors,
            icon: <MdFlag className="text-primary-400" />,
          },
          {
            label: "Courses",
            value: season.totalRaces,
            icon: <MdSportsScore className="text-emerald-400" />,
          },
          {
            label: "Paris",
            value: season.totalBets,
            icon: <MdStar className="text-yellow-400" />,
          },
          {
            label: "Parieurs",
            value: season.totalBettors,
            icon: <MdPerson className="text-blue-400" />,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            className="bg-neutral-800/80 rounded-xl p-3 text-center border border-neutral-700/50"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {stat.icon}
              <span className="text-xs text-neutral-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <CountUp end={stat.value} duration={1.5} separator=" " />
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
}: {
  title: string;
  items: { name: string; rank: number; score: number; scoreLabel: string; extra?: string }[];
  type: "competitor" | "bettor";
}) {
  const top3 = items.filter((item) => item.rank <= 3).slice(0, 3);
  // Reorder: 2nd, 1st, 3rd
  const podiumOrder = [
    top3.find((c) => c.rank === 2),
    top3.find((c) => c.rank === 1),
    top3.find((c) => c.rank === 3),
  ].filter(Boolean) as typeof top3;

  const heights = ["h-28", "h-36", "h-24"];
  const delays = [0.4, 0.2, 0.6];
  const colors = [
    "from-silver-500/30 to-silver-500/10 border-silver-500/50",
    "from-gold-500/30 to-gold-500/10 border-gold-500/50",
    "from-bronze-500/30 to-bronze-500/10 border-bronze-500/50",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white text-center"
      >
        {title}
      </motion.h2>

      <div className="flex items-end justify-center gap-3 w-full max-w-sm mt-4">
        {podiumOrder.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 60, scaleY: 0.3 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            transition={{
              delay: delays[i],
              type: "spring",
              stiffness: 150,
              damping: 14,
            }}
            className="flex-1 flex flex-col items-center"
            style={{ originY: 1 }}
          >
            <Badge variant={getRankBadgeVariant(item.rank)} size="sm" className="mb-2">
              #{item.rank}
            </Badge>
            <p className="text-sm font-semibold text-white text-center truncate w-full mb-1">
              {item.name}
            </p>
            {type === "competitor" && item.rank && (
              <span
                className={`text-xs mb-2 ${getLeagueForRank(item.rank).textColor}`}
              >
                {getLeagueForRank(item.rank).emoji}{" "}
                {getLeagueForRank(item.rank).label}
              </span>
            )}
            <div
              className={`w-full ${heights[i]} rounded-t-xl bg-gradient-to-t ${colors[i]} border border-b-0 flex items-center justify-center`}
            >
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {Math.round(item.score)}
                </p>
                <p className="text-xs text-neutral-400">{item.scoreLabel}</p>
              </div>
            </div>
            {item.extra && (
              <p className="text-xs text-neutral-500 mt-1">{item.extra}</p>
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white text-center mb-4 shrink-0"
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
}: {
  item: ArchivedCompetitorRanking;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-center justify-between p-3 bg-neutral-800/60 rounded-lg"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge
          variant={getRankBadgeVariant(item.rank)}
          size="sm"
          className="shrink-0"
        >
          {item.provisional ? "~" : `#${item.rank}`}
        </Badge>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {item.competitorName}
          </p>
          {item.provisional && (
            <p className="text-xs text-neutral-500">En calibrage</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-sm font-bold text-white">
            {Math.round(item.finalRating)}
          </p>
          <p className="text-xs text-neutral-500">ELO</p>
        </div>
        <div>
          <p className="text-sm text-neutral-300">{item.raceCount}</p>
          <p className="text-xs text-neutral-500">courses</p>
        </div>
        {item.winStreak > 0 && (
          <div>
            <p className="text-sm text-yellow-400">{item.winStreak}🔥</p>
            <p className="text-xs text-neutral-500">streak</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BettorRow({
  item,
  index,
}: {
  item: ArchivedBettorRanking;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-center justify-between p-3 bg-neutral-800/60 rounded-lg"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge
          variant={getRankBadgeVariant(item.rank)}
          size="sm"
          className="shrink-0"
        >
          #{item.rank}
        </Badge>
        <p className="text-sm font-medium text-white truncate">
          {item.userName}
        </p>
      </div>
      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-sm font-bold text-white">
            {item.totalPoints.toFixed(1)}
          </p>
          <p className="text-xs text-neutral-500">pts</p>
        </div>
        <div>
          <p className="text-sm text-neutral-300">{item.betsPlaced}</p>
          <p className="text-xs text-neutral-500">paris</p>
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
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay: number;
  glowClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 18 }}
      className={`bg-neutral-800/80 rounded-xl p-4 border border-neutral-700/50 ${glowClass ?? ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-neutral-300">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function SlideHighlights({
  highlights,
}: {
  highlights: SeasonHighlights;
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
      <div className="flex flex-col items-center justify-center h-full px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🔮</p>
          <h2 className="text-2xl font-bold text-white mb-2">
            Moments Forts
          </h2>
          <p className="text-neutral-400">
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white text-center mb-4 shrink-0"
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
          >
            <div className="space-y-1">
              {highlights.perfectScores.map((ps, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20"
                >
                  <span className="text-sm font-medium text-yellow-300">
                    {ps.userName}
                  </span>
                  <span className="text-xs text-neutral-400">
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
          >
            <p className="text-sm text-neutral-300 mb-2">
              {highlights.perfectPodiums.length} podium
              {highlights.perfectPodiums.length > 1 ? "s" : ""} parfait
              {highlights.perfectPodiums.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {highlights.perfectPodiums.map((pp, i) => (
                <span
                  key={i}
                  className="bg-neutral-700/60 text-xs text-white px-2 py-1 rounded-full"
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
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {highlights.highestBetScore.userName}
              </span>
              <div className="text-right">
                <span className="text-lg font-bold text-emerald-400">
                  {highlights.highestBetScore.points} pts
                </span>
                <p className="text-xs text-neutral-500">
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
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">
                  {highlights.biggestUpset.userName}
                </span>
                <span className="text-lg font-bold text-orange-400">
                  x{highlights.biggestUpset.odd.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
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
          >
            <div className="space-y-2">
              {highlights.longestParticipationStreak && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    Plus longue série de participations
                  </span>
                  <span className="text-sm text-white">
                    {highlights.longestParticipationStreak.userName} —{" "}
                    <span className="font-bold text-primary-400">
                      {highlights.longestParticipationStreak.streak} sem.
                    </span>
                  </span>
                </div>
              )}
              {highlights.longestWinStreak && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    Plus longue win streak
                  </span>
                  <span className="text-sm text-white">
                    {highlights.longestWinStreak.competitorName} —{" "}
                    <span className="font-bold text-yellow-400">
                      {highlights.longestWinStreak.streak}🔥
                    </span>
                  </span>
                </div>
              )}
              {highlights.mostRaces && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    Plus grand nombre de courses
                  </span>
                  <span className="text-sm text-white">
                    {highlights.mostRaces.competitorName} —{" "}
                    <span className="font-bold text-blue-400">
                      {highlights.mostRaces.count}
                    </span>
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
  const [competitors, setCompetitors] = useState<ArchivedCompetitorRanking[]>(
    []
  );
  const [bettors, setBettors] = useState<ArchivedBettorRanking[]>([]);
  const [highlights, setHighlights] = useState<SeasonHighlights | null>(null);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const confettiFired = useRef(false);

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
    if (!isLoading && season && !confettiFired.current) {
      confettiFired.current = true;
      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.4 },
          zIndex: 9999,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, season]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide((prev) => {
      setDirection(idx > prev ? 1 : -1);
      return idx;
    });
  }, []);

  // Touch handlers for swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 50) {
        if (delta < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  // Build competitor podium items
  const competitorPodiumItems = competitors
    .filter((c) => c.rank !== null && c.rank <= 3)
    .map((c) => ({
      name: c.competitorName,
      rank: c.rank!,
      score: c.finalRating,
      scoreLabel: "ELO",
      extra: `${c.raceCount} courses`,
    }));

  // Build bettor podium items
  const bettorPodiumItems = bettors
    .filter((b) => b.rank <= 3)
    .map((b) => ({
      name: b.userName,
      rank: b.rank,
      score: b.totalPoints,
      scoreLabel: "pts",
      extra: `${b.betsPlaced} paris`,
    }));

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir >= 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const renderSlide = () => {
    if (!season || !highlights) return null;

    switch (currentSlide) {
      case 0:
        return (
          <SlideTitleStats season={season} monthName={monthName} />
        );
      case 1:
        return (
          <PodiumSlide
            title="Podium Pilotes"
            items={competitorPodiumItems}
            type="competitor"
          />
        );
      case 2:
        return (
          <RankingListSlide title="Classement Pilotes">
            {competitors.map((c, i) => (
              <CompetitorRow key={c.id} item={c} index={i} />
            ))}
          </RankingListSlide>
        );
      case 3:
        return (
          <PodiumSlide
            title="Podium Parieurs"
            items={bettorPodiumItems}
            type="bettor"
          />
        );
      case 4:
        return (
          <RankingListSlide title="Classement Parieurs">
            {bettors.map((b, i) => (
              <BettorRow key={b.userId} item={b} index={i} />
            ))}
          </RankingListSlide>
        );
      case 5:
        return <SlideHighlights highlights={highlights} />;
      default:
        return null;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-full max-w-md mx-4 max-h-[85vh] bg-neutral-900 border border-neutral-700/50 rounded-2xl overflow-hidden flex flex-col animate-slideUp">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white transition-colors"
        >
          <MdClose size={20} />
        </button>

        {/* Content area */}
        <div
          className="flex-1 min-h-0 py-8 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-rotate w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full"
              >
                {renderSlide()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Navigation */}
        {!isLoading && (
          <div className="shrink-0 px-4 pb-4 pt-2 border-t border-neutral-800">
            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    i === currentSlide
                      ? "w-6 bg-primary-500"
                      : "bg-neutral-600 hover:bg-neutral-500"
                  }`}
                />
              ))}
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={goPrev}
                disabled={currentSlide === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-neutral-300 hover:text-white hover:bg-neutral-800"
              >
                <MdChevronLeft size={18} />
                Précédent
              </button>

              {currentSlide < TOTAL_SLIDES - 1 ? (
                <button
                  onClick={goNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-neutral-900 hover:bg-primary-400 transition-colors"
                >
                  Suivant
                  <MdChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-neutral-900 hover:bg-primary-400 transition-colors"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
