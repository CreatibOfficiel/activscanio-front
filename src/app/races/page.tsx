"use client";

import { NextPage } from "next";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import RaceOverviewItem from "../components/race/RaceOverviewItem";
import { RaceEvent } from "../models/RaceEvent";

const RacesPage: NextPage = () => {
  const { isLoading, allRaces } = useContext(AppContext);

  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-900 text-regular text-neutral-300">
        <p>Chargement des courses...</p>
      </div>
    );
  }

  // Sort by descending date
  const sortedRaces = [...allRaces].sort(
    (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) {
      return "Aujourd\u2019hui";
    }
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // Group by date
  const racesByDate: Record<string, RaceEvent[]> = {};
  sortedRaces.forEach((race) => {
    const label = formatDate(race.date);
    if (!racesByDate[label]) racesByDate[label] = [];
    racesByDate[label].push(race);
  });

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
