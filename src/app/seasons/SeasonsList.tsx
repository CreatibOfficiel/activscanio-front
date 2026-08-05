"use client";

import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SeasonArchive } from '@/app/repositories/SeasonsRepository';
import { Card, Badge, Button } from '@/app/components/ui';
import {
  MdCalendarToday,
  MdPeople,
  MdTrendingUp,
  MdSportsMartialArts,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';

const ITEMS_PER_PAGE = 12;

interface SeasonsListProps {
  /**
   * Already fetched by the server component. This client half owns only the
   * pagination cursor and the row click, so it never refetches.
   */
  seasons: SeasonArchive[];
}

/**
 * Client half of /seasons: pagination state and row navigation.
 *
 * The data arrives as a prop from the server component, so the first paint
 * ships filled markup instead of a spinner.
 */
const SeasonsList: FC<SeasonsListProps> = ({ seasons }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * The detail route reads its second segment as a calendar month and hands it
   * straight to `/seasons/:year/:month` on the API, so it must be `month` and
   * not `seasonNumber`.
   *
   * The two happen to be equal today only because season 1 was January 2026.
   * They diverge in January 2027, where season 13 is month 1 — `seasonNumber`
   * would ask for month 13, which does not exist. `seasonNumber` stays in the
   * card's label ("Saison 13"); it just has no business in the URL.
   */
  const handleSeasonClick = (season: SeasonArchive) => {
    router.push(`/seasons/${season.year}/${season.month}`);
  };

  const totalPages = Math.ceil(seasons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSeasons = seasons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (seasons.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MdCalendarToday className="text-6xl text-neutral-600 mx-auto mb-4" />
        <p className="text-regular text-neutral-400">
          Aucune saison archivée pour le moment
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentSeasons.map((season) => (
          <Card
            key={season.id}
            className="p-6 cursor-pointer hover:border-primary-500 transition-colors"
            onClick={() => handleSeasonClick(season)}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-heading text-white">
                  Saison {season.seasonNumber} - {season.year}
                </h3>
                {season.seasonName && (
                  <p className="text-sub text-neutral-400">{season.seasonName}</p>
                )}
              </div>
              <Badge variant="primary" size="md">
                <MdCalendarToday className="mr-1" />
                S{season.seasonNumber}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sub text-neutral-300">
                <MdPeople className="text-primary-500" />
                <span>
                  {season.totalCompetitors} pilote
                  {season.totalCompetitors !== 1 && 's'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sub text-neutral-300">
                <MdSportsMartialArts className="text-primary-500" />
                <span>
                  {season.totalRaces} course{season.totalRaces !== 1 && 's'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sub text-neutral-300">
                <MdTrendingUp className="text-primary-500" />
                <span>
                  {season.totalBets} pari{season.totalBets !== 1 && 's'} placé
                  {season.totalBets !== 1 && 's'}
                </span>
              </div>
              <div className="border-t border-neutral-700 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sub text-neutral-400">ELO moyen</span>
                  <span className="text-bold text-white">
                    {Math.round(season.avgCompetitorRating)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            aria-label="Page précédente"
          >
            <MdChevronLeft className="text-xl" />
            Précédent
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-regular text-neutral-300">
              Page {currentPage} sur {totalPages}
            </span>
            <Badge variant="primary" size="sm">
              {seasons.length} saisons
            </Badge>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
          >
            Suivant
            <MdChevronRight className="text-xl" />
          </Button>
        </div>
      )}
    </>
  );
};

export default SeasonsList;
