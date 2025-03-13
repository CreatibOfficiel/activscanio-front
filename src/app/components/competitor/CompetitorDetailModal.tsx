"use client";

import { FC, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import { AppContext } from "@/app/context/AppContext";
import { RecentRaceInfo } from "@/app/models/RecentRaceInfo";
import {
  MdShowChart,
  MdPercent,
} from "react-icons/md";

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

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 text-regular p-4 rounded w-full max-w-md">
          <p className="text-neutral-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

  /**
   * Returns the background color according to the medal (0 => gold, 1 => silver, 2 => bronze)
   */
  const getMedalBackground = (index: number): string => {
    switch (index) {
      case 0:
        return "bg-gold-500";
      case 1:
        return "bg-silver-500";
      case 2:
        return "bg-bronze-500";
      default:
        return "bg-neutral-100";
    }
  };

  const getRankIcon = (index: number): string => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "⭐";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded p-4 w-full max-w-md text-neutral-100">
        {/* --- Header modal --- */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-title">Fiche compétiteur</h2>
          <button onClick={onClose} className="text-close-button-500">
            X
          </button>
        </div>

        {/* Profile: Avatar + about + rank */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <Image
              src={competitor.profilePictureUrl}
              alt={competitor.firstName}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-1">
            <h3 className="text-heading font-semibold">{shortName}</h3>
            <p className="text-regular text-neutral-300">
              Courses jouées :{" "}
              <span className="text-statistic">
                {competitor.raceCount || "N/A"}
              </span>
            </p>
          </div>

          {/* Rank */}
          {competitor.rank > 0 && (
            competitor.rank <= 3 ? (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: getMedalBackground(competitor.rank - 1),
                }}
              >
                {getRankIcon(competitor.rank - 1)}
              </div>
            ) : (
              <span className="text-heading text-neutral-50">
                #{competitor.rank}
              </span>
            )
          )}
        </div>

        {/* Stats row */}
        <div className="flex space-x-4 mb-8">
          {/* Elo */}
          <div className="flex-1 bg-neutral-800 p-4 rounded-xl">
            <div className="w-6 h-6 bg-primary-900 flex items-center justify-center rounded mb-2">
              <MdShowChart className="text-primary-500" size={16} />
            </div>
            <p className="text-regular text-neutral-300 mb-1">Élo</p>
            <p className="text-statistic text-neutral-50">{competitor.elo}</p>
          </div>

          {/* Average position */}
          <div className="flex-1 bg-neutral-800 p-4 rounded-xl">
            <div className="w-6 h-6 bg-primary-900 flex items-center justify-center rounded mb-2">
              <MdPercent className="text-primary-500" size={16} />
            </div>
            <p className="text-regular text-neutral-300 mb-1">
              Position moyenne
            </p>
            <p className="text-statistic text-neutral-50">
              {competitor.avgRank12.toFixed(1)}
            </p>
          </div>
        </div>

        {/* --- Recent Races --- */}
        <div>
          <h4 className="text-heading mb-2 text-neutral-50">
            Résultats récents
          </h4>
          {recentRaces.length === 0 ? (
            <p className="text-neutral-500 text-regular">
              Aucune course récente
            </p>
          ) : (
            <ul className="space-y-2">
              {recentRaces.map((race) => {
                const date = new Date(race.date);
                const dateStr = date.toLocaleDateString();
                return (
                  <li key={race.raceId} className="bg-neutral-800 p-2 rounded">
                    <p className="text-bold text-neutral-100">{dateStr}</p>
                    <p className="text-xs text-neutral-400">
                      Position: {race.rank12}, Score: {race.score}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorDetailModal;
