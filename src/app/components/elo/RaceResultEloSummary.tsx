"use client";

import { FC } from "react";
import Image from "next/image";
import { Competitor } from "@/app/models/Competitor";
import { RaceResult } from "@/app/models/RaceResult";
import { EloCalculator } from "@/app/utils/EloCalculator";
import React from "react";

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

  // Calculate expected and actual scores
  const playerRatings = selectedCompetitors.map(competitor => ({
    id: competitor.id,
    rating: competitor.conservativeScore
  }));

  const expectedScores = EloCalculator.computeExpectedScores(playerRatings);
  const actualScores = EloCalculator.computeActualScores(
    selectedCompetitors.map(competitor => ({
      id: competitor.id,
      position: resultMap[competitor.id]?.rank12 ?? 12
    }))
  );

  // Calculate the updated ELO ratings based on the current race results
  const updatedEloMap = EloCalculator.calculateUpdatedEloForRace(
    selectedCompetitors,
    resultMap
  );

  return (
    <div className="space-y-4 w-full">
      <p className="text-sm text-neutral-400 mb-6">
        Voici les résultats de la course avec les variations d'Elo pour chaque compétiteur.
      </p>
      <table className="w-full border-separate border-spacing-y-2">
        <tbody className="w-full">
          {results.map((r) => {
            // Find the corresponding competitor
            const comp = selectedCompetitors.find(
              (c) => c.id === r.competitorId
            );
            if (!comp) return null;

            // Current + projected ELO
            const currentElo = comp.conservativeScore;
            const projectedElo = updatedEloMap[comp.id] ?? comp.conservativeScore;
            const diff = projectedElo - currentElo;

            const shortName = `${comp.firstName} ${comp.lastName[0]}.`;

            // Get expected and actual scores
            const expected = expectedScores[comp.id];
            const actual = actualScores[comp.id];
            const performanceDiff = actual - expected;

            return (
              <React.Fragment key={r.competitorId}>
                <tr>
                  <td className="py-2 w-full">
                    <div className="flex items-center gap-3 w-full">
                      <Image
                        src={comp.profilePictureUrl}
                        alt={comp.firstName}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-neutral-200 font-medium">{shortName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400">
                            Score: {r.score}
                          </span>
                          <span className="text-xs text-neutral-400">
                            -
                          </span>
                          <span className="text-xs text-neutral-400">
                            Rang {r.rank12}/12
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-neutral-400">Elo actuel</span>
                        <span className="text-sm font-medium">{currentElo.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-neutral-400">Elo projeté</span>
                        <span className={`text-sm font-medium ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : ''}`}>
                          {projectedElo.toFixed(0)} ({diff > 0 ? '+' : ''}{diff.toFixed(0)})
                        </span>
                      </div>
                      <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden w-full">
                        <div 
                          className="absolute inset-0 bg-neutral-600"
                          style={{ width: `${expected * 100}%` }}
                        />
                        <div 
                          className="absolute inset-0 bg-primary-500/50"
                          style={{ width: `${actual * 100}%` }}
                        />
                        <div 
                          className="absolute inset-0 bg-primary-500"
                          style={{ width: `${Math.min(expected, actual) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500">
                        {performanceDiff > 0.1
                          ? "Performance au-dessus des attentes"
                          : performanceDiff < -0.1
                          ? "Performance en-dessous des attentes"
                          : "Performance dans la moyenne"}
                      </p>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RaceResultEloSummary;
