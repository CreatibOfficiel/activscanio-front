"use client";

import { useContext, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "./context/AppContext";
import { Competitor } from "./models/Competitor";
import { Button } from "./components/ui";
import { MdFlag } from "react-icons/md";
import {
  ElevatedPodium,
  LeaderboardRow,
  PeriodTabs,
  Period,
} from "./components/leaderboard";
import { TrendDirection } from "./components/leaderboard/TrendIndicator";

const DAYS_THRESHOLD_WEEK = 7;
const DAYS_THRESHOLD_MONTH = 30;

const filterRecentCompetitors = (
  competitors: Competitor[],
  daysAgo: number | null
): Competitor[] => {
  if (daysAgo === null) {
    // All-time: return all with at least one race
    return competitors.filter((c) => c.raceCount && c.raceCount > 0);
  }

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

// Simulate trend data (in a real app, this would come from the API)
const generateTrends = (
  competitors: Competitor[]
): Map<string, { direction: TrendDirection; value?: number }> => {
  const trends = new Map<
    string,
    { direction: TrendDirection; value?: number }
  >();

  competitors.forEach((c) => {
    // Simple simulation based on position and some randomness
    const rand = Math.random();
    let direction: TrendDirection;
    let value: number | undefined;

    if (rand < 0.4) {
      direction = "up";
      value = Math.floor(Math.random() * 3) + 1;
    } else if (rand < 0.7) {
      direction = "down";
      value = Math.floor(Math.random() * 2) + 1;
    } else {
      direction = "stable";
    }

    trends.set(c.id, { direction, value });
  });

  return trends;
};

export default function Home() {
  const { isLoading, allCompetitors } = useContext(AppContext);
  const [now, setNow] = useState<Date | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>("week");

  useEffect(() => {
    setNow(new Date());
  }, []);

  const daysThreshold = useMemo(() => {
    switch (activePeriod) {
      case "week":
        return DAYS_THRESHOLD_WEEK;
      case "month":
        return DAYS_THRESHOLD_MONTH;
      case "all":
        return null;
    }
  }, [activePeriod]);

  const { sortedCompetitors, topThree, others, trends } = useMemo(() => {
    const filtered = filterRecentCompetitors(allCompetitors, daysThreshold);
    const sorted = sortByConservativeScore(filtered);
    const trendData = generateTrends(sorted);

    return {
      sortedCompetitors: sorted,
      topThree: sorted.slice(0, 3),
      others: sorted.slice(3),
      trends: trendData,
    };
  }, [allCompetitors, daysThreshold]);

  if (isLoading || !now) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-neutral-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-title mb-4">Classement</h1>

        {/* Period tabs */}
        <PeriodTabs
          activePeriod={activePeriod}
          onChange={setActivePeriod}
          className="mb-2"
        />

        {/* Period subtitle */}
        <p className="text-sm text-neutral-500">
          {activePeriod === "week" && "Cette semaine"}
          {activePeriod === "month" && "Ce mois-ci"}
          {activePeriod === "all" && "Depuis le début"}
          {" • "}
          {sortedCompetitors.length} coureur
          {sortedCompetitors.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Podium or empty state */}
      {topThree.length > 0 ? (
        <div className="mb-8">
          <ElevatedPodium topThree={topThree} trends={trends} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="mb-6">
            <Image
              src="/illustrations/empty-podium.svg"
              alt="Podium vide"
              width={240}
              height={200}
              priority
            />
          </div>

          <div className="text-center max-w-sm">
            <h2 className="text-heading text-white mb-2">
              Le podium vous attend !
            </h2>
            <p className="text-regular text-neutral-400 mb-6">
              {activePeriod === "week" &&
                "Aucune course n'a encore été disputée cette semaine."}
              {activePeriod === "month" &&
                "Aucune course n'a encore été disputée ce mois-ci."}
              {activePeriod === "all" &&
                "Aucune course n'a encore été enregistrée."}
              {" Ajoutez votre première course pour voir le classement !"}
            </p>

            <Link href="/races/add">
              <Button variant="primary" className="gap-2">
                <MdFlag className="text-lg" />
                Ajouter une course
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Other ranked competitors */}
      {others.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-heading text-neutral-400 mb-3 px-1">
            Autres classés
          </h2>
          {others.map((competitor, index) => (
            <LeaderboardRow
              key={competitor.id}
              competitor={competitor}
              rank={index + 4}
              trend={trends.get(competitor.id)}
              animationDelay={index * 50}
            />
          ))}
        </div>
      )}
    </div>
  );
}
