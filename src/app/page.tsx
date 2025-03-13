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

  // Filter those who have played
  const withGames = allCompetitors.filter((c) => c.raceCount > 0);
  withGames.sort((a, b) => a.rank - b.rank);
  const topThree = withGames.slice(0, 3);

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
      <h1 className="text-title mb-4">Classement</h1>
      {topThree.length > 0 ? (
        <div className="mb-4">
          <ScrollablePodiumView topThreeCompetitors={topThree} />
        </div>
      ) : (
        <p className="text-neutral-300 text-regular">
          Il n&apos;y a aucun compétiteur pour l&apos;instant.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {withGames.slice(3).map((competitor) => (
          <RankedCompetitorItem key={competitor.id} competitor={competitor} />
        ))}
      </div>
    </div>
  );
}
