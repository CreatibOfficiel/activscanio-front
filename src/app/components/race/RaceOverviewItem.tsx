"use client";

import { FC, useContext, useEffect, useState } from "react";
import { RaceEvent } from "../../models/RaceEvent";
import { AppContext } from "../../context/AppContext";
import { Competitor } from "../../models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";
import RaceDetailsModal from "./RaceDetailsModal";

interface Props {
  race: RaceEvent;
}

const RaceOverviewItem: FC<Props> = ({ race }) => {
  const { allCompetitors } = useContext(AppContext);

  // List of Competitors associated with this RaceEvent
  const [participants, setParticipants] = useState<Competitor[]>([]);

  // The "best" (smallest) position found among the participants (e.g., 1)
  const [bestRank, setBestRank] = useState<number | undefined>(undefined);

  // Control of the modal's open/close state
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    /// Construction of the list of participants
    const comps: Competitor[] = [];
    race.results.forEach((res) => {
      const found = allCompetitors.find((c) => c.id === res.competitorId);
      if (found) comps.push(found);
    });
    setParticipants(comps);

    // We sort to find the "best" position = the smallest rank12
    if (race.results && race.results.length > 0) {
      const sorted = [...race.results].sort((a, b) => a.rank12 - b.rank12);
      setBestRank(sorted[0].rank12); // ex: 1
    } else {
      setBestRank(undefined);
    }
  }, [race.results, allCompetitors]);

  const openModal = () => setShowModal(true);

  // If no participants
  if (race.results.length === 0 || participants.length === 0) {
    return null;
  }

  // We sort by rank12 for display from first to last
  const sortedResults = [...race.results].sort((a, b) => a.rank12 - b.rank12);

  return (
    <>
      <div
        className="bg-neutral-800 p-3 rounded cursor-pointer mb-2"
        onClick={openModal}
      >
        {sortedResults.map((res) => {
          const competitor = participants.find(
            (c) => c.id === res.competitorId
          );
          if (!competitor) return null;

          // isWinner = if rank12 of this participant == bestRank
          const isWinner = bestRank !== undefined && res.rank12 === bestRank;
          const shortName = formatCompetitorName(competitor.firstName, competitor.lastName);

          return (
            <div
              key={res.competitorId}
              className="flex justify-between items-center mb-1"
            >
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

      <RaceDetailsModal
        raceId={race.id}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default RaceOverviewItem;
