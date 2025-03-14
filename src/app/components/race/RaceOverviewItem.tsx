"use client";

import { FC, useContext, useEffect, useState } from "react";
import { RaceEvent } from "../../models/RaceEvent";
import { AppContext } from "../../context/AppContext";
import { Competitor } from "../../models/Competitor";
import RaceDetailsModal from "./RaceDetailsModal";

interface Props {
  race: RaceEvent;
}

const RaceOverviewItem: FC<Props> = ({ race }) => {
  const { allCompetitors } = useContext(AppContext);

  // Liste des Competitor associés à ce RaceEvent
  const [participants, setParticipants] = useState<Competitor[]>([]);

  // La "meilleure" (plus petite) position trouvée parmi les participants (ex: 1).
  // S'il n'y a aucun résultat, ce sera undefined.
  const [bestRank, setBestRank] = useState<number | undefined>(undefined);

  // Contrôle de l'ouverture/fermeture de la modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Construction de la liste des participants
    const comps: Competitor[] = [];
    race.results.forEach((res) => {
      const found = allCompetitors.find((c) => c.id === res.competitorId);
      if (found) comps.push(found);
    });
    setParticipants(comps);

    // On trie les résultats pour trouver la "meilleure" position = rank12 le plus petit
    if (race.results && race.results.length > 0) {
      const sorted = [...race.results].sort((a, b) => a.rank12 - b.rank12);
      setBestRank(sorted[0].rank12); // ex: 1
    } else {
      setBestRank(undefined);
    }
  }, [race.results, allCompetitors]);

  const openModal = () => setShowModal(true);

  // Si aucun participant
  if (race.results.length === 0 || participants.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="bg-neutral-800 p-3 rounded cursor-pointer mb-2"
        onClick={openModal}
      >
        {/* On parcourt chaque RaceResult pour afficher */}
        {race.results.map((res) => {
          const competitor = participants.find((c) => c.id === res.competitorId);
          if (!competitor) return null;

          // isWinner = si rank12 de ce participant == bestRank
          const isWinner = bestRank !== undefined && res.rank12 === bestRank;
          const shortName = `${competitor.firstName} ${competitor.lastName[0]}.`;

          return (
            <div key={res.competitorId} className="flex justify-between items-center mb-1">
              <span
                className={
                  isWinner
                    ? "text-bold text-neutral-100"
                    : "text-regular text-neutral-400"
                }
              >
                {shortName}
              </span>
              <div className="flex items-center space-x-4">
                <span
                  className={
                    isWinner
                      ? "text-bold text-neutral-100"
                      : "text-regular text-neutral-500"
                  }
                >
                  {res.score}
                </span>
                <span
                  className={
                    isWinner
                      ? "text-bold text-neutral-100"
                      : "text-regular text-neutral-600"
                  }
                >
                  {res.rank12}/12
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <RaceDetailsModal
          raceId={race.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default RaceOverviewItem;
