"use client";

import { FC, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AppContext } from "@/app/context/AppContext";
import {
  Competitor,
  getDisplayScore,
  getFullName,
} from "@/app/models/Competitor";
import { RecentRaceInfo } from "@/app/models/RecentRaceInfo";
import EditCompetitorButton from "./EditCompetitorButton";
import { BaseCharacter, CharacterVariant } from "@/app/models/Character";

interface Props {
  competitor: Competitor;
  onClose: () => void;
}

const CompetitorDetailModal: FC<Props> = ({ competitor, onClose }) => {
  const { getRecentRacesOfCompetitor } = useContext(AppContext);
  const { baseCharacters } = useContext(AppContext);
  const [recentRaces, setRecentRaces] = useState<RecentRaceInfo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [baseChar, setBaseChar] = useState<BaseCharacter | null>(null);
  const [variantChar, setVariantChar] = useState<CharacterVariant | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getRecentRacesOfCompetitor(competitor.id);
      setRecentRaces(data);
      setIsLoaded(true);
    })();
  }, [competitor.id, getRecentRacesOfCompetitor]);

  useEffect(() => {
    if (!competitor.characterVariantId) {
      return;
    }
    const foundBase = baseCharacters.find((bc) =>
      bc.variants?.some((v) => v.id === competitor.characterVariantId)
    );
    if (foundBase) {
      setBaseChar(foundBase);
      // Find the variant character
      const varObj = foundBase.variants.find(
        (v) => v.id === competitor.characterVariantId
      );
      if (varObj) {
        setVariantChar(varObj);
      }
    }
  }, [competitor.characterVariantId, baseCharacters]);

  // If data is not loaded yet, show a loading spinner
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
        <div className="bg-neutral-900 text-neutral-100 p-6 rounded-lg w-full max-w-md shadow-lg">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Rank format in French: 1er, 2e, 3e, 4e, ...
  const formatRankFR = (rank: number) => {
    if (rank <= 0) return "--";
    switch (rank) {
      case 1:
        return "1er";
      default:
        return `${rank}e`;
    }
  };

  const playerRank =
    competitor.rank && competitor.rank > 0
      ? formatRankFR(competitor.rank)
      : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
      {/* Dark card */}
      <div className="relative bg-neutral-900 text-neutral-100 w-full max-w-md rounded-2xl p-6 shadow-xl">
        {/* Bouton close (X) et Edit */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <EditCompetitorButton competitor={competitor} />
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors text-3xl"
          >
            &times;
          </button>
        </div>

        {/* Avatar + Name + Rank */}
        <div className="flex flex-col items-center mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <Image
              src={competitor.profilePictureUrl}
              alt={getFullName(competitor)}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
          {/* Name + Rank on a single line */}
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>{getFullName(competitor)}</span>
            {playerRank && (
              <span className="text-2xl text-neutral-400">• {playerRank}</span>
            )}
          </h2>
          {/* Character info if available */}
          {variantChar && (
            <div className="gap-2 mt-2 bg-neutral-800 px-3 py-2 rounded-lg">
              {/* Name + Variant */}
              <span className="text-sm text-neutral-300">
                {baseChar?.name}{" "}
                {variantChar?.label === "Default" ? "" : variantChar.label}
              </span>
            </div>
          )}
        </div>

        {/* Stats (3 columns separated by vertical bars) */}
        <div className="flex items-start justify-evenly text-center mb-6">
          {/* Games played */}
          <div className="px-4">
            <p className="text-2xl font-bold">{competitor.raceCount ?? 0}</p>
            <p className="text-xs text-neutral-400 mt-1">Parties jouées</p>
          </div>
          {/* Vertical bar */}
          <div className="w-px h-8 my-auto bg-neutral-700" />
          {/* Average position */}
          <div className="px-4">
            <p className="text-2xl font-bold">
              {competitor.avgRank12?.toFixed(1)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Position moyenne</p>
          </div>
          {/* Vertical bar */}
          <div className="w-px h-8 my-auto bg-neutral-700" />
          {/* Elo */}
          <div className="px-4">
            <p className="text-2xl font-bold">{getDisplayScore(competitor)}</p>
            <p className="text-xs text-neutral-400 mt-1">Elo</p>
          </div>
        </div>

        {/* Horizontal separator */}
        <hr className="mb-4 border-neutral-700" />

        {/* Title "Recent Results" */}
        <h3 className="text-lg font-semibold mb-3">Résultats récents</h3>

        {/* List of recent races */}
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
