"use client";

import { useContext, useEffect, useState } from "react";
import { AppContext } from "./context/AppContext";
import RankedCompetitorItem from "./components/competitor/RankedCompetitorItem";
import ScrollablePodiumView from "./components/race/ScrollablePodiumView";

export default function Home() {
  const { isLoading, allCompetitors } = useContext(AppContext);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (isLoading || !now) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 text-regular">
        <p>Chargement...</p>
      </div>
    );
  }

  // Take only competitors who have already played in the last 7 days
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const withGames = allCompetitors.filter(
    (c) =>
      c.raceCount &&
      c.raceCount > 0 &&
      c.lastRaceDate &&
      new Date(c.lastRaceDate) > sevenDaysAgo
  );
  // Sort by conservativeScore (higher is better)
  withGames.sort((a, b) => {
    if (a.conservativeScore === undefined && b.conservativeScore === undefined) return 0;
    if (a.conservativeScore === undefined) return 1;
    if (b.conservativeScore === undefined) return -1;
    return b.conservativeScore - a.conservativeScore;
  });

  // Top 3 (podium)
  const topThree = withGames.slice(0, 3);
  // Others
  const others = withGames.slice(3);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <h1 className="text-center text-title mb-4">Classement</h1>

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
