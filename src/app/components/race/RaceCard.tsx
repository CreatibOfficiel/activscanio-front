"use client";

import { FC, useContext, useState, useMemo } from "react";
import { MdSportsMotorsports } from "react-icons/md";
import { RaceEvent } from "@/app/models/RaceEvent";
import { Competitor } from "@/app/models/Competitor";
import { AppContext } from "@/app/context/AppContext";
import { formatRelativeDate } from "@/app/utils/formatters";
import WinnerHighlight from "./WinnerHighlight";
import ParticipantAvatarStack from "./ParticipantAvatarStack";
import RaceDetailsModal from "./RaceDetailsModal";

interface Props {
  race: RaceEvent;
}

interface ParticipantWithResult {
  competitor: Competitor;
  rank12: number;
  score: number;
  isWinner: boolean;
}

const RaceCard: FC<Props> = ({ race }) => {
  const { allCompetitors } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);

  // Build participants with their results
  const participantsWithResults = useMemo((): ParticipantWithResult[] => {
    const results: ParticipantWithResult[] = [];

    // Sort results by rank
    const sortedResults = [...race.results].sort((a, b) => a.rank12 - b.rank12);
    const bestRank = sortedResults.length > 0 ? sortedResults[0].rank12 : undefined;

    sortedResults.forEach((res) => {
      const competitor = allCompetitors.find((c) => c.id === res.competitorId);
      if (competitor) {
        results.push({
          competitor,
          rank12: res.rank12,
          score: res.score,
          isWinner: bestRank !== undefined && res.rank12 === bestRank,
        });
      }
    });

    return results;
  }, [race.results, allCompetitors]);

  // Get winner and other participants
  const winner = participantsWithResults.find((p) => p.isWinner);
  const otherParticipants = participantsWithResults.filter((p) => !p.isWinner);

  // Don't render if no participants
  if (participantsWithResults.length === 0) {
    return null;
  }

  const relativeDate = formatRelativeDate(race.date);
  const participantCount = participantsWithResults.length;

  return (
    <>
      <div
        className="bg-neutral-800 rounded-xl border border-neutral-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-200 cursor-pointer overflow-hidden card-glow-hover"
        onClick={() => setShowModal(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/50">
          <div className="flex items-center gap-2 text-sub text-neutral-400">
            <span>{relativeDate}</span>
            <span className="text-neutral-600">·</span>
            <span>{participantCount} joueur{participantCount > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-700/50 rounded-full">
            <MdSportsMotorsports className="text-primary-500 text-sm" />
            <span className="text-sub text-neutral-300 font-medium">150cc</span>
          </div>
        </div>

        {/* Winner section */}
        {winner && (
          <WinnerHighlight
            competitor={winner.competitor}
            score={winner.score}
            rank12={winner.rank12}
          />
        )}

        {/* Other participants */}
        {otherParticipants.length > 0 && (
          <ParticipantAvatarStack
            participants={otherParticipants.map((p) => ({
              competitor: p.competitor,
              rank12: p.rank12,
              score: p.score,
            }))}
          />
        )}
      </div>

      {/* Details modal */}
      {showModal && (
        <RaceDetailsModal
          raceId={race.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default RaceCard;
