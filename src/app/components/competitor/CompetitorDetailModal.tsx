"use client";

import { FC, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AppContext } from "@/app/context/AppContext";
import { Competitor, getFullName } from "@/app/models/Competitor";
import { RecentRaceInfo } from "@/app/models/RecentRaceInfo";
import EditCompetitorButton from "./EditCompetitorButton";

interface Props {
  competitor: Competitor;
  onClose: () => void;
}

const CompetitorDetailModal: FC<Props> = ({ competitor, onClose }) => {
  const { getRecentRacesOfCompetitor } = useContext(AppContext);

  const [recentRaces, setRecentRaces] = useState<RecentRaceInfo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* ---------- load recent races ---------- */
  useEffect(() => {
    (async () => {
      const data = await getRecentRacesOfCompetitor(competitor.id);
      setRecentRaces(data);
      setIsLoaded(true);
    })();
  }, [competitor.id, getRecentRacesOfCompetitor]);

  /* ---------- helpers ---------- */

  const formatRankFR = (rank: number) => {
    if (rank <= 0) return "--";
    return rank === 1 ? "1er" : `${rank}e`;
  };

  const variant = competitor.characterVariant;
  const baseName = variant?.baseCharacter?.name;
  const variantLabel =
    variant && variant.label !== "Default" ? variant.label : null;

  /* ---------- loading ---------- */
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
        <div className="bg-neutral-900 text-neutral-100 p-6 rounded-lg w-full max-w-md shadow-lg">
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
      <div className="relative bg-neutral-900 text-neutral-100 w-full max-w-md rounded-2xl p-6 shadow-xl">
        {/* Close / Edit */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <EditCompetitorButton competitor={competitor} />
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors text-3xl"
          >
            &times;
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <Image
              src={competitor.profilePictureUrl}
              alt={getFullName(competitor)}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
          <h2 className="text-2xl font-bold">
            <span>{getFullName(competitor)}</span>
          </h2>

          {/* Character info */}
          {variant && (
            <div className="gap-2 mt-2 bg-neutral-800 px-3 py-2 rounded-lg">
              <span className="text-sm text-neutral-300">
                {baseName}
                {variantLabel && ` – ${variantLabel}`}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-start justify-evenly text-center mb-6">
          <div className="px-4">
            <p className="text-2xl font-bold">{competitor.raceCount ?? 0}</p>
            <p className="text-xs text-neutral-400 mt-1">Parties jouées</p>
          </div>
          <div className="w-px h-8 my-auto bg-neutral-700" />
          <div className="px-4">
            <p className="text-2xl font-bold">
              {competitor.avgRank12?.toFixed(1) ?? "--"}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Position moyenne</p>
          </div>
          <div className="w-px h-8 my-auto bg-neutral-700" />
          <div className="px-4">
            <p className="text-2xl font-bold">
              {(competitor.conservativeScore ?? competitor.rating).toFixed(0)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Elo</p>
          </div>
        </div>

        <hr className="mb-4 border-neutral-700" />

        {/* Glicko-2 Stats */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Statistiques Glicko-2</h3>

          {/* Score Reliability */}
          <div className="mb-4">
            <p className="text-sm text-neutral-400">
              {(() => {
                const scoreDiff =
                  (competitor.conservativeScore ?? competitor.rating) -
                  competitor.rating;
                const margin = Math.max(10, competitor.rd * 0.1);
                return scoreDiff < -margin
                  ? "Votre niveau réel est probablement plus élevé que votre Elo actuel."
                  : scoreDiff > margin
                  ? "Votre niveau réel est probablement plus bas que votre Elo actuel."
                  : "Votre niveau actuel est très fiable.";
              })()}
            </p>
          </div>

          {/* Rating Deviation (RD) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-neutral-300">Incertitude (RD)</span>
              <span className="text-sm font-medium">
                {competitor.rd.toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {competitor.rd > 100
                ? "Votre niveau est encore incertain. Plus vous jouerez, plus il sera précis."
                : competitor.rd > 50
                ? "Votre niveau se stabilise. Continuez à jouer régulièrement."
                : "Votre niveau est très stable et précis."}
            </p>
          </div>

          {/* Volatility */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-neutral-300">Volatilité</span>
              <span className="text-sm font-medium">
                {competitor.vol.toFixed(3)}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {competitor.vol > 0.07
                ? "Votre niveau varie beaucoup…"
                : competitor.vol > 0.045
                ? "Votre niveau est assez stable."
                : "Votre niveau est très stable et prévisible."}
            </p>
          </div>
        </div>

        <hr className="mb-4 border-neutral-700" />

        {/* Recent results */}
        <h3 className="text-lg font-semibold mb-3">Résultats récents</h3>

        {recentRaces.length === 0 ? (
          <p className="text-neutral-500 text-sm">Aucune course récente</p>
        ) : (
          <div className="space-y-2">
            {recentRaces.map((race) => (
              <div
                key={race.raceId}
                className="flex items-center justify-between bg-neutral-800 p-3 rounded"
              >
                <span className="text-sm text-neutral-200">
                  {new Date(race.date).toLocaleDateString("fr-FR")}
                </span>
                <span className="text-sm text-neutral-400">
                  {formatRankFR(race.rank12 ?? 0)} • Score: {race.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorDetailModal;
