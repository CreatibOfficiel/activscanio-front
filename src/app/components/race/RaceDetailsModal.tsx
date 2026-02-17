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
import EloDeltaBadge from "@/app/components/race/EloDeltaBadge";

interface Props {
  raceId: string;
  isOpen: boolean;
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
  return sorted
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

const RaceDetailsModal: FC<Props> = ({ raceId, isOpen, onClose }) => {
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
    if (isOpen) {
      loadRace(currentRaceId);
    }
  }, [currentRaceId, isOpen, loadRace]);

  const handleSimilarRaceClick = (id: string) => {
    setCurrentRaceId(id);
  };

  const sortedResults = raceEvent
    ? [...raceEvent.results].sort((a, b) => {
        if (a.rank12 !== b.rank12) return a.rank12 - b.rank12;
        if (a.score !== b.score) return b.score - a.score;
        return a.competitorId.localeCompare(b.competitorId);
      })
    : [];
  const bestRank = sortedResults[0]?.rank12;
  const winners = sortedResults.filter((r) => r.rank12 === bestRank);
  const others = sortedResults.filter((r) => r.rank12 !== bestRank);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feuille de course" size="lg">
      {isLoading ? (
        <RaceDetailsSkeleton />
      ) : error || !raceEvent ? (
        <p className="text-red-400 text-center py-8">
          {error || "Course introuvable"}
        </p>
      ) : (
        <div className="space-y-6">
          {/* Date */}
          <div className="text-center">
            <p className="text-sm text-neutral-400">
              {formatRaceDateTime(raceEvent.date)}
            </p>
            <div className="w-12 h-px bg-primary-500/30 mx-auto mt-2" />
          </div>

          {/* Winner hero */}
          {winners.length > 0 && (
            <div className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gradient-to-b from-gold-500/10 to-transparent">
              <span className="text-2xl animate-crown-bounce">👑</span>
              <div className="flex items-center justify-center gap-4">
                {winners.map((w) => {
                  const comp = allCompetitors.find((c) => c.id === w.competitorId);
                  if (!comp) return null;
                  return (
                    <div key={comp.id} className="flex flex-col items-center gap-1">
                      <Image
                        src={comp.profilePictureUrl}
                        alt={comp.firstName}
                        width={64}
                        height={64}
                        className="rounded-full object-cover ring-2 ring-gold-500"
                      />
                      <p className="text-lg font-bold text-white">
                        {formatCompetitorName(comp.firstName, comp.lastName)}
                      </p>
                      {winners.length > 1 && (
                        <EloDeltaBadge delta={w.ratingDelta} size="sm" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="gold" size="sm">
                    {winners.length > 1 ? "1er ex-aequo" : "1er"}
                  </Badge>
                  <span className="text-sm text-neutral-300">
                    · {winners[0].score} pts
                  </span>
                </div>
                {winners.length === 1 && (
                  <EloDeltaBadge delta={winners[0].ratingDelta} size="md" />
                )}
              </div>
            </div>
          )}

          {/* Other participants */}
          {others.length > 0 && (
            <div className="divide-y divide-neutral-700/30">
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
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-700/30 transition-colors"
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
                    {/* ELO delta */}
                    <div className="w-16 shrink-0 flex justify-end">
                      <EloDeltaBadge delta={res.ratingDelta} />
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
                        <p className="text-xs text-neutral-400">
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
