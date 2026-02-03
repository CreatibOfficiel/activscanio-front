"use client";

import { FC, useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { AppContext } from "@/app/context/AppContext";
import { RaceEvent } from "@/app/models/RaceEvent";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";

interface Props {
  raceId: string;
  onClose: () => void;
}

const RaceDetailsModal: FC<Props> = ({ raceId, onClose }) => {
  const { getRaceById, allCompetitors, getSimilarRaces } =
    useContext(AppContext);

  const [raceEvent, setRaceEvent] = useState<RaceEvent | null>(null);
  const [similarRaces, setSimilarRaces] = useState<RaceEvent[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple loads
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        const event = await getRaceById(raceId);
        setRaceEvent(event);

        const comps: Competitor[] = [];
        event.results.forEach((r) => {
          const found = allCompetitors.find((c) => c.id === r.competitorId);
          if (found) comps.push(found);
        });
        setCompetitors(comps);

        const similars = await getSimilarRaces(raceId);
        setSimilarRaces(similars);

        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading race details:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
        setIsLoaded(true);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceId]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-neutral-900 p-4 text-regular rounded">
          <p className="text-neutral-300">Chargement de la course...</p>
        </div>
      </div>
    );
  }

  if (error || !raceEvent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-neutral-900 p-6 rounded max-w-sm w-full">
          <p className="text-red-400 mb-4">{error || "Course introuvable"}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const sortedResults = [...raceEvent.results].sort(
    (a, b) => a.rank12 - b.rank12
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-50">
      <div className="bg-neutral-900 p-4 rounded max-w-xl w-full text-neutral-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-title">Feuille de course</h2>
          <button onClick={onClose} className="text-close-button-500">
            X
          </button>
        </div>

        {/* Participants */}
        <div className="flex flex-wrap justify-around mb-4">
          {sortedResults.map((res) => {
            const comp = competitors.find((c) => c.id === res.competitorId);
            if (!comp) return null;
            const isWinner = res.rank12 === 1;
            return (
              <div className="flex flex-col items-center m-2" key={comp.id}>
                <Image
                  src={comp.profilePictureUrl}
                  alt={comp.firstName}
                  width={56}
                  height={56}
                  className="rounded-md object-cover"
                />
                <p
                  className={
                    isWinner
                      ? "text-bold text-neutral-100"
                      : "text-bold text-neutral-300"
                  }
                >
                  {formatCompetitorName(comp.firstName, comp.lastName)}
                </p>
                <p className="text-regular text-neutral-400">
                  Score: {res.score}, #{res.rank12}/12
                </p>
              </div>
            );
          })}
        </div>

        <hr className="my-4 border-neutral-700" />

        {/* Similar Races */}
        <h3 className="text-heading mb-2 text-neutral-300">
          Historique des rencontres similaires
        </h3>
        {similarRaces.length === 0 ? (
          <p className="text-regular text-neutral-500">Aucun historique</p>
        ) : (
          similarRaces.slice(0, 3).map((sim) => (
            <div key={sim.id} className="bg-neutral-800 p-3 rounded mb-2">
              <p className="text-sm font-semibold text-neutral-100">
                Course #{sim.id} du {new Date(sim.date).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RaceDetailsModal;
