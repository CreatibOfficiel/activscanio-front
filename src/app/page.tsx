"use client";

import { useContext, useEffect, useState } from "react";
import { AppContext } from "./context/AppContext";
import { Competitor } from "./models/Competitor";
import RankedCompetitorItem from "./components/competitor/RankedCompetitorItem";
import ScrollablePodiumView from "./components/race/ScrollablePodiumView";

const DAYS_THRESHOLD = 7;

const filterRecentCompetitors = (
  competitors: Competitor[],
  daysAgo: number
): Competitor[] => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysAgo);

  return competitors.filter(
    (c) =>
      c.raceCount &&
      c.raceCount > 0 &&
      c.lastRaceDate &&
      new Date(c.lastRaceDate) > threshold
  );
};

const sortByConservativeScore = (competitors: Competitor[]): Competitor[] => {
  return [...competitors].sort((a, b) => {
    if (a.conservativeScore === undefined && b.conservativeScore === undefined)
      return 0;
    if (a.conservativeScore === undefined) return 1;
    if (b.conservativeScore === undefined) return -1;
    return b.conservativeScore - a.conservativeScore;
  });
};

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

  const recentCompetitors = filterRecentCompetitors(
    allCompetitors,
    DAYS_THRESHOLD
  );
  const sortedCompetitors = sortByConservativeScore(recentCompetitors);

  const topThree = sortedCompetitors.slice(0, 3);
  const others = sortedCompetitors.slice(3);

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

      <div className="flex flex-col gap-0">
        {others.map((competitor) => (
          <RankedCompetitorItem key={competitor.id} competitor={competitor} />
        ))}
      </div>
    </div>
  );
}
