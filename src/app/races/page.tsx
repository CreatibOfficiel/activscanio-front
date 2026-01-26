"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppContext } from "../context/AppContext";
import { RaceEvent } from "../models/RaceEvent";
import { formatDate } from "../utils/formatters";
import RaceOverviewItem from "../components/race/RaceOverviewItem";
import { Button } from "../components/ui";
import { MdAdd, MdFlag } from "react-icons/md";

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
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-24">
      <h1 className="text-center text-title mb-4">Courses</h1>

      {sortedRaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {/* Illustration */}
          <div className="mb-6">
            <Image
              src="/illustrations/empty-races.svg"
              alt="Aucune course"
              width={240}
              height={200}
              priority
            />
          </div>

          {/* Text content */}
          <div className="text-center max-w-sm">
            <h2 className="text-heading text-white mb-2">
              Prêt pour la course ?
            </h2>
            <p className="text-regular text-neutral-400 mb-6">
              Aucune course n&apos;a encore été enregistrée.
              Créez votre première course et que la compétition commence !
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

      {/* Floating Action Button - Add Race (only when there are races) */}
      {sortedRaces.length > 0 && (
        <Link
          href="/races/add"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-neutral-900 z-40"
          aria-label="Ajouter une course"
        >
          <MdAdd className="text-2xl" />
        </Link>
      )}
    </div>
  );
};

export default RacesPage;
