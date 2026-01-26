"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "./context/AppContext";
import { Competitor } from "./models/Competitor";
import RankedCompetitorItem from "./components/competitor/RankedCompetitorItem";
import ScrollablePodiumView from "./components/race/ScrollablePodiumView";
import { Button } from "./components/ui";
import { MdFlag } from "react-icons/md";

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
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {/* Illustration */}
          <div className="mb-6">
            <Image
              src="/illustrations/empty-podium.svg"
              alt="Podium vide"
              width={240}
              height={200}
              priority
            />
          </div>

          {/* Text content */}
          <div className="text-center max-w-sm">
            <h2 className="text-heading text-white mb-2">
              Le podium vous attend !
            </h2>
            <p className="text-regular text-neutral-400 mb-6">
              Aucune course n&apos;a encore été disputée cette semaine.
              Ajoutez votre première course pour voir le classement !
            </p>

            {/* CTA Button */}
            <Link href="/races/add">
              <Button variant="primary" className="gap-2">
                <MdFlag className="text-lg" />
                Ajouter une course
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0">
        {others.map((competitor) => (
          <RankedCompetitorItem key={competitor.id} competitor={competitor} />
        ))}
      </div>
    </div>
  );
}
