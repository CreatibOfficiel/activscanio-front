"use client";

import { FC, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RecentRaceInfo } from "@/app/models/RecentRaceInfo";

interface Props {
  competitor: Competitor;
  onClose: () => void;
}

const CompetitorDetailModal: FC<Props> = ({ competitor, onClose }) => {
  const { getRecentRacesOfCompetitor } = useContext(AppContext);
  const [recentRaces, setRecentRaces] = useState<RecentRaceInfo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getRecentRacesOfCompetitor(competitor.id);
      setRecentRaces(data);
      setIsLoaded(true);
    })();
  }, [competitor.id, getRecentRacesOfCompetitor]);

  // Si pas encore chargé
  if (!isLoaded) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="bg-neutral-900 text-neutral-100 p-6 rounded-lg w-full max-w-md shadow-lg">
            <p>Chargement...</p>
          </div>
        </div>
    );
  }

  // Format du rang en français : 1er, 2e, 3e, 4e, ...
  const formatRankFR = (rank: number) => {
    if (rank <= 0) return "--";
    switch (rank) {
      case 1:
        return "1er";
      case 2:
        return "2e";
      case 3:
        return "3e";
      default:
        return `${rank}e`;
    }
  };

  const shortName = `${competitor.firstName} ${competitor.lastName}`;
  const playerRank = competitor.rank > 0 ? formatRankFR(competitor.rank) : null;

  return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
        {/* Carte sombre */}
        <div className="relative bg-neutral-900 text-neutral-100 w-full max-w-md rounded-2xl p-6 shadow-xl">
          {/* Bouton close (X) plus grand */}
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200 transition-colors text-3xl"
          >
            &times;
          </button>

          {/* Avatar + Nom + Rank */}
          <div className="flex flex-col items-center mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
              <Image
                  src={competitor.profilePictureUrl}
                  alt={shortName}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
              />
            </div>

            {/* Nom + Rank sur une seule ligne */}
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>{shortName}</span>
              {playerRank && (
                  <span className="text-2xl text-neutral-400">• {playerRank}</span>
              )}
            </h2>
          </div>

          {/* Stats (3 colonnes séparées par des barres verticales) */}
          <div className="flex items-start justify-evenly text-center mb-6">
            {/* Parties jouées */}
            <div className="px-4">
              <p className="text-2xl font-bold">{competitor.raceCount ?? 0}</p>
              <p className="text-xs text-neutral-400 mt-1">Parties jouées</p>
            </div>
            {/* Barre verticale */}
            <div className="w-px h-8 my-auto bg-neutral-700" />
            {/* Position moyenne */}
            <div className="px-4">
              <p className="text-2xl font-bold">
                {competitor.avgRank12?.toFixed(1)}
              </p>
              <p className="text-xs text-neutral-400 mt-1">Position moyenne</p>
            </div>
            {/* Barre verticale */}
            <div className="w-px h-8 my-auto bg-neutral-700" />
            {/* Elo */}
            <div className="px-4">
              <p className="text-2xl font-bold">{Math.round(competitor.elo)}</p>
              <p className="text-xs text-neutral-400 mt-1">Elo</p>
            </div>
          </div>

          {/* Séparateur horizontal */}
          <hr className="mb-4 border-neutral-700" />

          {/* Titre "Résultats récents" */}
          <h3 className="text-lg font-semibold mb-3">Résultats récents</h3>

          {/* Liste des dernières courses */}
          {recentRaces.length === 0 ? (
              <p className="text-neutral-500 text-sm">Aucune course récente</p>
          ) : (
              <div className="space-y-2">
                {recentRaces.map((race) => {
                  const dateStr = new Date(race.date).toLocaleDateString("fr-FR");
                  const racePlace = formatRankFR(race.rank12 || 0); // Ex: "1er", "4e", ...
                  return (
                      <div
                          key={race.raceId}
                          className="flex items-center justify-between bg-neutral-800 p-3 rounded"
                      >
                        <span className="text-sm text-neutral-200">{dateStr}</span>
                        <span className="text-sm text-neutral-400">
                    {racePlace} • Score: {race.score}
                  </span>
                      </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>
  );
};
export default CompetitorDetailModal;
