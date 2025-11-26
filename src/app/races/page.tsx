"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { RaceEvent } from "../models/RaceEvent";
import { formatDate } from "../utils/formatters";
import RaceOverviewItem from "../components/race/RaceOverviewItem";

const sortRacesByDate = (races: RaceEvent[]): RaceEvent[] => {
  return [...races].sort(
    (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
  );
};

const groupRacesByDate = (
  races: RaceEvent[],
  dateFormatter: (dateStr: string) => string
): Record<string, RaceEvent[]> => {
  const grouped: Record<string, RaceEvent[]> = {};

  races.forEach((race) => {
    const label = dateFormatter(race.date);
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(race);
  });

  return grouped;
};

const RacesPage: NextPage = () => {
  const { isLoading, allRaces } = useContext(AppContext);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (isLoading || !now) {
    return (
      <div className="p-4 bg-neutral-900 text-regular text-neutral-300">
        <p>Chargement des courses...</p>
      </div>
    );
  }

  const sortedRaces = sortRacesByDate(allRaces);
  const racesByDate = groupRacesByDate(sortedRaces, formatDate);

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
      <h1 className="text-center text-title mb-4">Courses</h1>

      {sortedRaces.length === 0 ? (
        <p className="text-neutral-300 text-regular">
          Aucune course enregistrée.
        </p>
      ) : (
        Object.keys(racesByDate).map((dateLabel) => (
          <div key={dateLabel} className="mb-4">
            <h2 className="text-heading mb-2 text-neutral-300">{dateLabel}</h2>
            {racesByDate[dateLabel].map((race) => (
              <RaceOverviewItem key={race.id} race={race} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default RacesPage;
