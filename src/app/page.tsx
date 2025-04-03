"use client";

import { useContext } from "react";
import { AppContext } from "./context/AppContext";
import RankedCompetitorItem from "./components/competitor/RankedCompetitorItem";
import ScrollablePodiumView from "./components/race/ScrollablePodiumView";

export default function Home() {
  const { isLoading, allCompetitors } = useContext(AppContext);

  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 text-regular">
        <p>Chargement...</p>
      </div>
    );
  }

  // Take only competitors who have already played
  const withGames = allCompetitors.filter(
    (c) => c.raceCount && c.raceCount > 0
  );
  // Sort by rank
  withGames.sort((a, b) => {
    if (a.rank === undefined && b.rank === undefined) return 0;
    if (a.rank === undefined) return 1;
    if (b.rank === undefined) return -1;
    return a.rank - b.rank;
  });

  // Top 3 (podium)
  const topThree = withGames.slice(0, 3);
  // Others
  const others = withGames.slice(3);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <h1 className="text-center text-2xl font-bold mb-4">Classement</h1>

      {topThree.length > 0 ? (
        <div className="mb-6">
          <ScrollablePodiumView topThreeCompetitors={topThree} />
        </div>
      ) : (
        <p className="text-neutral-300 text-regular">
          Il n&apos;y a aucun compétiteur pour l&apos;instant.
        </p>
      )}

      {/* List of others */}
      <div className="flex flex-col gap-0">
        {others.map((competitor) => (
          <RankedCompetitorItem key={competitor.id} competitor={competitor} />
        ))}
      </div>
    </div>
  );
}
