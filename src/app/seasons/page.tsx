"use client";

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SeasonsRepository, SeasonArchive } from '@/app/repositories/SeasonsRepository';
import { Card, Badge, Button } from '@/app/components/ui';
import { MdCalendarToday, MdPeople, MdTrendingUp, MdSportsMartialArts, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 12;

const SeasonsPage: FC = () => {
  const router = useRouter();
  const [seasons, setSeasons] = useState<SeasonArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        setIsLoading(true);
        const data = await SeasonsRepository.getAllSeasons();
        setSeasons(data);
      } catch (error) {
        console.error('Error loading seasons:', error);
        toast.error('Erreur lors du chargement des saisons');
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasons();
  }, []);

  const getMonthName = (month: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const handleSeasonClick = (season: SeasonArchive) => {
    router.push(`/seasons/${season.year}/${season.month}`);
  };

  // Pagination logic
  const totalPages = Math.ceil(seasons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSeasons = seasons.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-regular">Chargement des saisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-title mb-2">Historique des Saisons</h1>
          <p className="text-regular text-neutral-300">
            Consultez les archives des saisons précédentes
          </p>
        </div>

        {/* Seasons grid */}
        {seasons.length === 0 ? (
          <Card className="p-8 text-center">
            <MdCalendarToday className="text-6xl text-neutral-600 mx-auto mb-4" />
            <p className="text-regular text-neutral-400">
              Aucune saison archivée pour le moment
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSeasons.map((season) => (
              <Card
                key={season.id}
                className="p-6 cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => handleSeasonClick(season)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-heading text-white">
                      {getMonthName(season.month)} {season.year}
                    </h3>
                    {season.seasonName && (
                      <p className="text-sub text-neutral-400">{season.seasonName}</p>
                    )}
                  </div>
                  <Badge variant="primary" size="md">
                    <MdCalendarToday className="mr-1" />
                    S{season.month}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sub text-neutral-300">
                    <MdPeople className="text-primary-500" />
                    <span>{season.totalCompetitors} compétiteurs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sub text-neutral-300">
                    <MdSportsMartialArts className="text-primary-500" />
                    <span>{season.totalRaces} courses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sub text-neutral-300">
                    <MdTrendingUp className="text-primary-500" />
                    <span>{season.totalBets} paris placés</span>
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

          {/* Pagination */}
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
        )}
      </div>
    </div>
  );
};

export default SeasonsPage;
