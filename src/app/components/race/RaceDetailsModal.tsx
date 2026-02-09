"use client";

import { FC, useContext, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { AppContext } from "@/app/context/AppContext";
import { RaceEvent } from "@/app/models/RaceEvent";
import { Competitor } from "@/app/models/Competitor";
import {
  formatCompetitorName,
  formatRelativeDate,
} from "@/app/utils/formatters";
import Modal from "@/app/components/ui/Modal";
import Badge from "@/app/components/ui/Badge";
import Skeleton from "@/app/components/ui/Skeleton";

interface Props {
  raceId: string;
  onClose: () => void;
}

const MAX_SCORE = 60;

function getRankLabel(rank: number): string {
  if (rank === 1) return "1er";
  return `${rank}e`;
}

function getRankBadgeVariant(
  rank: number
): "gold" | "silver" | "bronze" | "default" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}

function formatRaceDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Aujourd'hui à ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Hier à ${time}`;

  const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "short" });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day} ${month}`;
}

function getSimilarRaceSummary(
  race: RaceEvent,
  competitors: Competitor[]
): string {
  const sorted = [...race.results].sort((a, b) => a.rank12 - b.rank12);
  const top = sorted.slice(0, 2);
  return top
    .map((r) => {
      const comp = competitors.find((c) => c.id === r.competitorId);
      const name = comp
        ? formatCompetitorName(comp.firstName, comp.lastName)
        : "?";
      return `${name} ${getRankLabel(r.rank12)}`;
    })
    .join(" · ");
}

/* ---------- Loading skeleton ---------- */

const RaceDetailsSkeleton: FC = () => (
  <div className="space-y-6">
    {/* Winner skeleton */}
    <div className="flex flex-col items-center gap-3 py-4">
      <Skeleton variant="circular" width={64} height={64} />
      <Skeleton variant="text" width={120} height={20} />
      <Skeleton variant="text" width={80} height={16} />
    </div>

    {/* Participants skeleton */}
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="text" width={28} height={28} />
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="text" width={100} height={16} />
          <div className="flex-1" />
          <Skeleton variant="text" width={40} height={16} />
        </div>
      ))}
    </div>

    {/* Similar races skeleton */}
    <div className="space-y-2 pt-4 border-t border-neutral-700">
      <Skeleton variant="text" width={160} height={18} />
      <Skeleton variant="rounded" height={48} />
      <Skeleton variant="rounded" height={48} />
    </div>
  </div>
);

/* ---------- Main component ---------- */

const RaceDetailsModal: FC<Props> = ({ raceId, onClose }) => {
  const { getRaceById, allCompetitors, getSimilarRaces } =
    useContext(AppContext);

  const [currentRaceId, setCurrentRaceId] = useState(raceId);
  const [raceEvent, setRaceEvent] = useState<RaceEvent | null>(null);
  const [similarRaces, setSimilarRaces] = useState<RaceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRace = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const [event, similars] = await Promise.all([
          getRaceById(id),
          getSimilarRaces(id),
        ]);
        setRaceEvent(event);
        setSimilarRaces(similars);
      } catch (err) {
        console.error("Error loading race details:", err);
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [getRaceById, getSimilarRaces]
  );

  useEffect(() => {
    loadRace(currentRaceId);
  }, [currentRaceId, loadRace]);

  const handleSimilarRaceClick = (id: string) => {
    setCurrentRaceId(id);
  };

  const sortedResults = raceEvent
    ? [...raceEvent.results].sort((a, b) => a.rank12 - b.rank12)
    : [];
  const winner = sortedResults[0] ?? null;
  const others = sortedResults.slice(1);
  const winnerComp = winner
    ? allCompetitors.find((c) => c.id === winner.competitorId)
    : null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Feuille de course" size="lg">
      {isLoading ? (
        <RaceDetailsSkeleton />
      ) : error || !raceEvent ? (
        <p className="text-red-400 text-center py-8">
          {error || "Course introuvable"}
        </p>
      ) : (
        <div className="space-y-6">
          {/* Date */}
          <p className="text-sm text-neutral-400 text-center">
            {formatRaceDateTime(raceEvent.date)}
          </p>

          {/* Winner hero */}
          {winner && winnerComp && (
            <div className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gradient-to-b from-gold-500/10 to-transparent">
              <span className="text-2xl animate-crown-bounce">
                {winnerComp.firstName === "Joran" ? "🤪" : "👑"}
              </span>
              <div className="relative">
                <Image
                  src={winnerComp.profilePictureUrl}
                  alt={winnerComp.firstName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover ring-2 ring-gold-500"
                />
              </div>
              <p className="text-lg font-bold text-white">
                {formatCompetitorName(
                  winnerComp.firstName,
                  winnerComp.lastName
                )}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="gold" size="sm">
                  1er
                </Badge>
                <span className="text-sm text-neutral-300">
                  · {winner.score} pts
                </span>
              </div>
            </div>
          )}

          {/* Other participants */}
          {others.length > 0 && (
            <div className="space-y-2">
              {others.map((res) => {
                const comp = allCompetitors.find(
                  (c) => c.id === res.competitorId
                );
                if (!comp) return null;
                const variant = getRankBadgeVariant(res.rank12);
                const scorePercent = Math.round(
                  (res.score / MAX_SCORE) * 100
                );

                return (
                  <div
                    key={comp.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-700/30 transition-colors"
                  >
                    <Badge variant={variant} size="sm" className="w-7 text-center">
                      {res.rank12}
                    </Badge>
                    <Image
                      src={comp.profilePictureUrl}
                      alt={comp.firstName}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                    <span className="text-sm text-neutral-200 flex-1 min-w-0 truncate">
                      {formatCompetitorName(comp.firstName, comp.lastName)}
                    </span>
                    {/* Score bar + value */}
                    <div className="flex items-center gap-2 w-28 shrink-0">
                      <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400 w-8 text-right tabular-nums">
                        {res.score} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Similar races */}
          <div className="pt-4 border-t border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">
              Rencontres similaires
            </h3>
            {similarRaces.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun historique</p>
            ) : (
              <div className="space-y-2">
                {similarRaces.slice(0, 5).map((sim) => (
                  <button
                    key={sim.id}
                    type="button"
                    onClick={() => handleSimilarRaceClick(sim.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      sim.id === currentRaceId
                        ? "bg-primary-500/20 ring-1 ring-primary-500/40"
                        : "bg-neutral-700/40 hover:bg-neutral-700/70"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm shrink-0">📅</span>
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-200">
                          {formatRelativeDate(sim.date)}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {getSimilarRaceSummary(sim, allCompetitors)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RaceDetailsModal;
