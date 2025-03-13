"use client";

import { FC } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import { RaceResult } from "@/app/models/RaceResult";
import { EloCalculator } from "@/app/utils/EloCalculator";

/**
 * Props:
 * - results: The list of RaceResult (rank, score) for each competitor
 * - selectedCompetitors: The list of competitor objects (with current ELO, etc.)
 */
interface Props {
  results: RaceResult[];
  selectedCompetitors: Competitor[];
}

const RaceResultEloSummary: FC<Props> = ({ results, selectedCompetitors }) => {
  // Build a map from competitorId -> RaceResult
  const resultMap: Record<string, RaceResult> = {};
  results.forEach((r) => {
    resultMap[r.competitorId] = r;
  });

  // Calculate the updated ELO ratings based on the current race results
  const updatedEloMap = EloCalculator.calculateUpdatedEloForRace(
    selectedCompetitors,
    resultMap
  );

  return (
    // Main container for vertical spacing
    <div className="space-y-2">
      {/* Table with two columns:
          - Left: Competitor info (avatar, name, score, rank)
          - Right: ELO old -> new, difference
         We use "border-separate" + "border-spacing-y-2" to create vertical gaps (like "space-y-2"),
         so each row looks separated.
      */}
      <table className="w-full border-separate border-spacing-y-2">
        <tbody>
          {results.map((r) => {
            // Find the corresponding competitor
            const comp = selectedCompetitors.find((c) => c.id === r.competitorId);
            if (!comp) return null;

            // Current + projected ELO
            const currentElo = comp.elo;
            const projectedElo = updatedEloMap[comp.id] ?? comp.elo;
            const diff = projectedElo - currentElo;

            // Mark a winner if rank12 == 1
            const isWinner = r.rank12 === 1;

            const shortName = `${comp.firstName} ${comp.lastName[0]}.`;

            return (
              <tr key={comp.id} className="bg-neutral-800 rounded">
                {/* Left column: competitor details */}
                <td className="px-3 py-2 w-[70%] align-middle">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <Image
                      src={comp.profilePictureUrl}
                      alt={comp.firstName}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <div>
                      {/* Name (bold if winner, else a slightly muted color) */}
                      <p
                        className={
                          isWinner
                            ? "text-bold text-neutral-100"
                            : "text-bold text-neutral-300"
                        }
                      >
                        {shortName}
                      </p>
                      {/* Score & rank */}
                      <p className="text-sub text-neutral-400">
                        Score: {r.score}, Rang: {r.rank12}/12
                      </p>
                    </div>
                  </div>
                </td>

                {/* Right column: ELO info */}
                <td className="px-3 py-2">
                  {/* ELO transition from current -> projected, plus difference */}
                  <div className="text-sub flex justify-end gap-4 text-neutral-300 whitespace-nowrap">
                    {currentElo} &rarr; {projectedElo}{" "}
                    <span
                      className={diff >= 0 ? "text-success-500" : "text-error-500"}
                    >
                      ({diff >= 0 ? "+" : ""}
                      {diff})
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RaceResultEloSummary;
